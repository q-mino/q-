// The relay's storage on SQLite (`node:sqlite`; CFG-3, ADP-6, ADP-8, MBX-8):
// the state of `mailbox/deposits`, its fact log, its outbox and its
// executor's state, in one database, reached only through the ports. A
// serial writer (DOM-9): one process, and every command's step is
// synchronous, one transaction from the duplicate branch to the commit, so
// that the outcomes are those of a serial order by construction (TST-5).
// Its read streams composed by the library over the log (DOM-2, MBX-8): a
// collect from a position is read again. It keeps no logs (CFG-3).

import { DatabaseSync } from 'node:sqlite'
import * as zz from '@q-mino/domains/library'
import { registry } from '@q-mino/domains/mailbox/deposits/_registry.ts'
import {
  deposit_an_envelope,
  discard_an_envelope,
  the_envelopes_in_a_mailbox,
} from '@q-mino/domains/mailbox/deposits/_usecase.ts'
import {
  deposit_fragments,
  deposit_selection_fragments,
  deposit_sources,
  deposit_writes,
  the_deposits_tables,
  the_first_position_kept,
  type Write,
} from './deposits.ts'
import { the_log, the_logs_tables, waiting } from './log.ts'
import { the_outbox, the_outboxs_tables } from './outbox.ts'
import { after, holds, integer_of, operators, rows, run, sql, text_of, type Sql } from './sql.ts'

type Branch = zz.PlannedCommandBranch<Sql, Write>

/** A query or a page of the storage, over SQL. */
type Plan = zz.PlannedQuery<Sql, Sql, Sql>

/** The column a field is read into: its name, quoted. */
const column = (name: string): string => `"${name.replaceAll('"', '""')}"`

/** A plan's SELECT: its fields, its source, a selection, its order closed by the identity, at most so many rows. */
const select = (plan: Plan, selection: Sql, limit?: number): Sql => {
  const fields = Object.entries(plan.fields)
  const order = plan.order.map(([field, direction]) => ({
    text: `(${field.text}) ${direction === 'ascending' ? 'ASC NULLS LAST' : 'DESC NULLS FIRST'}`,
    values: field.values,
  }))
  return {
    text: [
      `SELECT ${fields.map(([name, field]) => `(${field.text}) AS ${column(name)}`).join(', ')}`,
      `FROM ${plan.from.text}`,
      `WHERE ${selection.text}`,
      order.length === 0 ? '' : `ORDER BY ${order.map((each) => each.text).join(', ')}`,
      limit === undefined ? '' : 'LIMIT ?',
    ].join(' '),
    values: [
      ...fields.flatMap(([, field]) => field.values),
      ...plan.from.values,
      ...selection.values,
      ...order.flatMap((each) => each.values),
      ...(limit === undefined ? [] : [limit]),
    ],
  }
}

/**
 * The storage of a relay, in a database at a location (a file, or
 * `:memory:`), its tables made if they are not there. What a configurator
 * wires: the versions the store keeps (DOM-22), the ports of `deposits`, the
 * fact log (DOM-17), the outbox and the executor's state (DOM-14); and the
 * positions it forgets (MBX-8), which a test may name (TST-4).
 */
export const the_relays_storage = (location: string) => {
  const database = new DatabaseSync(location)
  database.exec('PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL;')
  database.exec(the_logs_tables + the_outboxs_tables + the_deposits_tables)
  const waits = waiting()
  const facts = the_log(database, waits)
  const entries = the_outbox(database, waits)
  const all = rows(database)
  const holds_now = holds(database)
  const write = run(database)

  /** The branch each element of a list applies, the first that holds, -1 where none does (SC-54). */
  const chosen = (branch: Branch): readonly number[] =>
    'elements' in branch
      ? branch.elements.map((element) => element.findIndex((each) => holds_now(each.condition)))
      : []
  const applies = (branch: Branch): boolean =>
    holds_now(branch.condition) && chosen(branch).every((index) => index !== -1)
  const leaves = (branch: Branch): readonly Sql[] => [
    ...branch.leaves,
    ...('elements' in branch
      ? branch.elements.flatMap((element) => element.flatMap((each) => each.leaves))
      : []),
  ]
  /** The log forgets what the relay discarded (MBX-8): everything before the first position it must keep. */
  const forget_what_is_discarded = (): void => {
    const [row] = all(the_first_position_kept)
    const kept_from = row?.['kept_from']
    if (typeof kept_from === 'number') facts.forget(kept_from)
  }
  /** A step in one transaction, rolled back if it throws; then the readers woken, if it wrote. */
  const in_one_step = <outcome>(step: () => outcome): outcome => {
    database.exec('BEGIN IMMEDIATE')
    try {
      const outcome = step()
      database.exec('COMMIT')
      waits.wake()
      return outcome
    } catch (error) {
      if (database.isTransaction) database.exec('ROLLBACK')
      throw error
    }
  }

  const execute: zz.Execute<Sql, Write> = (plan) =>
    Promise.resolve(
      in_one_step((): zz.Execution => {
        const found = facts.recorded_by(plan.operation)
        if (found !== undefined) return found
        const applied = plan.branches.findIndex(applies)
        const branch = plan.branches[applied]
        if (branch === undefined) {
          return {
            outcome: 'rejected',
            leaves: plan.branches.map((planned) => leaves(planned).map(holds_now)),
          }
        }
        const elements = chosen(branch)
        const written = 'elements' in branch ? branch.applies(elements) : branch
        const position = facts.record(written.fact)
        for (const each of written.writes) for (const piece of each({ position })) write(piece)
        entries.queue(written.entries)
        forget_what_is_discarded()
        return { outcome: 'applied', branch: applied, elements, position }
      }),
    )

  const read = (plan: Plan) =>
    Promise.resolve({
      entries: all(select(plan, plan.selection)).map((row) => ({ ...row })),
      position: facts.position(),
    })
  const page = (plan: zz.PlannedPage<Sql, Sql, Sql>) =>
    Promise.resolve({
      entries: all(select(plan, plan.page, plan.limit)).map((row) => ({ ...row })),
      total: integer_of(
        all({
          text: `SELECT COUNT(*) AS total FROM ${plan.from.text} WHERE ${plan.selection.text}`,
          values: [...plan.from.values, ...plan.selection.values],
        })[0],
        'total',
      ),
      position: facts.position(),
    })

  /** The paths and versions of the facts and the entries the store keeps (DOM-22). */
  const stored_versions: zz.StoredVersions = () =>
    Promise.resolve(
      all(
        sql(
          "SELECT DISTINCT json_extract(part.value, '$.path') AS path, json_extract(part.value, '$.version') AS version FROM facts, json_each(facts.fact, '$.parts') AS part UNION SELECT DISTINCT effect AS path, version FROM entries",
        ),
      ).map((row) => ({
        path: text_of(row, 'path'),
        version: zz.semver.parse(text_of(row, 'version')),
      })),
    )

  return {
    stored_versions,
    /** The fact log of the store (DOM-17): every fact kept, then each new one. */
    log: facts.log,
    /** The outbox of the store, effect by effect (DOM-14). */
    outbox: entries.outbox,
    /** The effect executor's durable state (DOM-14). */
    executor: entries.executor,
    /**
     * The ports of `mailbox/deposits` over the store: its commands, and its
     * read, streamed by the library over the log (DOM-2, MBX-8).
     */
    deposits: (versions: zz.Versions) => ({
      ...zz.command_use_case_ports({
        registry,
        versions,
        use_cases: { deposit_an_envelope, discard_an_envelope },
      })({
        algebra: { predicate: deposit_fragments, ...operators },
        write: deposit_writes,
        execute,
        recorded: (operation) => Promise.resolve(facts.recorded_by(operation)),
      }),
      ...zz.read_use_case_ports({
        registry,
        versions,
        use_cases: { the_envelopes_in_a_mailbox },
      })({
        algebra: { predicate: deposit_selection_fragments, ...operators, after },
        sources: deposit_sources,
        read,
        page,
        streams: { the_envelopes_in_a_mailbox: { strategy: 'composed', log: facts.log } } as const,
      }),
    }),
    /** The positions before this one, which the store keeps no longer (MBX-8; TST-4 injects one). */
    forget: (before: zz.position): void => {
      in_one_step(() => {
        facts.forget(Number(before))
      })
    },
    /** The database closed: the relay stops. */
    close: (): void => {
      database.close()
    },
  }
}

/** The storage of a relay, as a configurator wires it. */
export type TheRelaysStorage = ReturnType<typeof the_relays_storage>
