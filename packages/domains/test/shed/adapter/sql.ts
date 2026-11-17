// A sketch of a SQL state adapter for the shed, to try the signatures the
// library derives (LIB-14). One adapter for the state of every domain: the
// predicates of `tools` that `loans` uses are fragments of the same adapter
// (D71). Nothing runs: the database is a port, the library is wished.

import { z } from 'zod'
import * as wlib from '../wlib.ts'
import { registry as tools_registry } from '../business/tools/_registry.ts'
import { registry as loans_registry } from '../business/loans/_registry.ts'
import type * as tools_fact from '../business/tools/_fact.ts'
import type * as tools_predicate from '../business/tools/_predicate.ts'
import type * as tool_selections from '../business/tools/_tool_selection.ts'
import {
  add_a_tool,
  put_a_repaired_tool_back_in_service,
  rename_a_tool,
  retire_a_tool,
  send_a_tool_to_repair,
  the_catalogue,
} from '../business/tools/_usecase.ts'
import type * as loans_fact from '../business/loans/_fact.ts'
import type * as loans_predicate from '../business/loans/_predicate.ts'
import type * as loan_selections from '../business/loans/_loan_selection.ts'
import type * as reservation_selections from '../business/loans/_reservation_selection.ts'
import {
  borrow_a_tool,
  correct_the_tool_of_a_loan,
  lend_a_booked_tool,
  continue_the_cancellation_of_reservations,
  continue_the_repair_notice_round,
  reserve_a_tool,
  return_a_tool,
  the_ongoing_loans_of_a_member,
  the_reservations_of_a_member,
  the_reservations_of_a_member_in_the_workshop,
} from '../business/loans/_usecase.ts'

/** A SQL fragment: its text, with `?` for each value. */
export interface sql {
  readonly text: string
  readonly values: readonly unknown[]
}

const is_sql = (value: unknown): value is sql =>
  typeof value === 'object' && value !== null && 'text' in value && 'values' in value

const join = (fragments: readonly sql[], separator: string): sql => ({
  text: fragments.map((fragment) => fragment.text).join(separator),
  values: fragments.flatMap((fragment) => fragment.values),
})

const bind = (value: unknown): sql => ({ text: '?', values: [value] })

/**
 * A fragment from a template: a nested fragment is spliced, an array becomes
 * a list of values, any other value is bound.
 */
export const sql = (strings: TemplateStringsArray, ...values: readonly unknown[]): sql =>
  values.reduce<sql>(
    (fragment, value, i) => {
      const next = strings[i + 1] ?? ''
      const inner = is_sql(value)
        ? value
        : Array.isArray(value)
          ? join(value.map(bind), ', ')
          : bind(value)
      return {
        text: fragment.text + inner.text + next,
        values: [...fragment.values, ...inner.values],
      }
    },
    { text: strings[0] ?? '', values: [] },
  )

/** A name the adapter writes itself, never a value. */
const identifier = (name: string): sql => ({ text: `"${name}"`, values: [] })

/**
 * The database, a port. Its transactions are serializable; one the database
 * aborts for a conflict (a serialization failure, or the unique key of the
 * facts' operation, `operation_scope` and `operation_id`) it runs again,
 * whole, until it commits: `work` touches nothing but `tx`, and a plan is
 * data. So two commands at the same instant give the outcomes of some serial
 * order (DOM-9, TST-5, SC-11).
 */
export interface Database {
  readonly transaction: <result>(work: (tx: Transaction) => Promise<result>) => Promise<result>
  /** Resolves when a fact after the position is recorded (`listen`/`notify`). */
  readonly recorded: (after: wlib.position) => Promise<void>
}
export interface Transaction {
  /** One statement, one boolean per column: `select c1, c2, …`. */
  readonly booleans: (columns: readonly sql[]) => Promise<readonly boolean[]>
  readonly run: (statement: sql) => Promise<void>
  readonly rows: (statement: sql) => Promise<readonly unknown[]>
  /** Where the state stands: the sequence of the last fact recorded. */
  readonly position: () => Promise<wlib.position>
}

// The fragments of each domain's predicates: one translation, reused by every
// command (ADP-8).

const tools_fragments: wlib.PredicateFragments<wlib.PredicatesIn<typeof tools_predicate>, sql> = {
  'business/tools/predicate/a_tool_has_this_id': (p) =>
    sql`exists (select 1 from tools where id = ${p.tool_id})`,
  'business/tools/predicate/the_tool_is_in_service': (p) =>
    sql`exists (select 1 from tools where id = ${p.tool_id} and status = 'inService')`,
  'business/tools/predicate/the_tool_is_retired': (p) =>
    sql`exists (select 1 from tools where id = ${p.tool_id} and status = 'retired')`,
  'business/tools/predicate/the_tool_is_under_repair': (p) =>
    sql`exists (select 1 from tools where id = ${p.tool_id} and status = 'underRepair')`,
}

const loans_fragments: wlib.PredicateFragments<wlib.PredicatesIn<typeof loans_predicate>, sql> = {
  // The view of `loans` over the tools of `tools` (GR-3, V11): the link.
  'business/loans/predicate/a_tool_has_this_id': (p) =>
    sql`exists (select 1 from tools where id = ${p.tool_id})`,
  'business/loans/predicate/the_tool_is_in_service': (p) =>
    sql`exists (select 1 from tools where id = ${p.tool_id} and status = 'inService')`,
  'business/loans/predicate/a_loan_has_this_id': (p) =>
    sql`exists (select 1 from loans where id = ${p.loan_id})`,
  'business/loans/predicate/the_loan_is_ongoing': (p) =>
    sql`exists (select 1 from loans where id = ${p.loan_id} and stage = 'ongoing')`,
  'business/loans/predicate/the_loan_is_returned': (p) =>
    sql`exists (select 1 from loans where id = ${p.loan_id} and stage = 'returned')`,
  'business/loans/predicate/the_loan_is_of_this_tool': (p) =>
    sql`exists (select 1 from loans where id = ${p.loan_id} and tool_id = ${p.tool_id})`,
  'business/loans/predicate/the_due_date_of_the_loan_is_still_ahead': (p) =>
    sql`exists (select 1 from loans where id = ${p.loan_id} and due_day >= ${wlib.day_of(p.now)})`,
  'business/loans/predicate/the_tool_is_on_loan': (p) =>
    sql`exists (select 1 from loans where tool_id = ${p.tool_id} and stage = 'ongoing')`,
  'business/loans/predicate/the_tool_is_on_loan_to_this_member': (p) =>
    sql`exists (select 1 from loans where tool_id = ${p.tool_id} and member_id = ${p.member_id} and stage = 'ongoing')`,
  'business/loans/predicate/a_reservation_has_this_id': (p) =>
    sql`exists (select 1 from reservations where id = ${p.reservation_id})`,
  'business/loans/predicate/the_reservation_is_booked': (p) =>
    sql`exists (select 1 from reservations where id = ${p.reservation_id} and stage = 'booked')`,
  'business/loans/predicate/the_tool_is_booked_for_the_day': (p) =>
    sql`exists (select 1 from reservations where tool_id = ${p.tool_id} and day = ${p.day} and stage = 'booked')`,
  'business/loans/predicate/the_tool_is_booked_for_the_day_by_this_member': (p) =>
    sql`exists (select 1 from reservations where tool_id = ${p.tool_id} and day = ${p.day} and member_id = ${p.member_id} and stage = 'booked')`,
  'business/loans/predicate/the_loan_is_of_this_member': (p) =>
    sql`exists (select 1 from loans where id = ${p.loan_id} and member_id = ${p.member_id})`,
  'business/loans/predicate/the_loan_is_due_on_this_day': (p) =>
    sql`exists (select 1 from loans where id = ${p.loan_id} and due_day = ${p.due_day})`,
  'business/loans/predicate/the_reservation_holds_the_tool_for_the_member_on_the_day': (p) =>
    sql`exists (select 1 from reservations where id = ${p.reservation_id} and tool_id = ${p.tool_id} and member_id = ${p.member_id} and day = ${p.day} and stage = 'booked')`,
  'business/loans/predicate/the_reservation_of_the_member_has_been_taken_up': (p) =>
    sql`exists (select 1 from reservations where id = ${p.reservation_id} and member_id = ${p.member_id} and stage = 'taken_up')`,
  'business/loans/predicate/a_cancellation_of_the_reservations_of_the_tool_has_begun': (p) =>
    sql`exists (select 1 from cancellations where tool_id = ${p.tool_id})`,
  'business/loans/predicate/the_notice_round_of_the_repair_has_begun': (p) =>
    sql`exists (select 1 from repair_notice_rounds where repair_id = ${p.repair_id})`,
}

// The fragments of the selection predicates, grouped by subject (DOM-18): a
// condition over the candidate of a query, which every source of the adapter
// calls `candidate`. In SQL every group has the same fragment type.

const tool_selection_fragments: wlib.PredicateFragments<
  wlib.SelectionsIn<typeof tool_selections>,
  sql
> = {
  'business/tools/selection/tool/the_tool_is_in_service': () => sql`candidate.status = 'inService'`,
  'business/tools/selection/tool/the_tool_is_in_one_of_these_categories': (p) =>
    sql`candidate.category in (${p.categories})`,
}

const loan_selection_fragments: wlib.PredicateFragments<
  wlib.SelectionsIn<typeof loan_selections>,
  sql
> = {
  'business/loans/selection/loan/the_loan_is_ongoing': () => sql`candidate.stage = 'ongoing'`,
  'business/loans/selection/loan/the_loan_is_of_this_member': (p) =>
    sql`candidate.member_id = ${p.member_id}`,
}

const reservation_selection_fragments: wlib.PredicateFragments<
  wlib.SelectionsIn<typeof reservation_selections>,
  sql
> = {
  'business/loans/selection/reservation/the_reservation_is_booked': () =>
    sql`candidate.stage = 'booked'`,
  'business/loans/selection/reservation/the_reservation_is_of_this_member': (p) =>
    sql`candidate.member_id = ${p.member_id}`,
  'business/loans/selection/reservation/the_reservation_is_of_this_tool': (p) =>
    sql`candidate.tool_id = ${p.tool_id}`,
  'business/loans/selection/reservation/the_reservation_is_from_this_day_on': (p) =>
    sql`candidate.day >= ${p.day}`,
  // The link: the view of `loans` over the tools, read from `tools` (SC-20).
  'business/loans/selection/reservation/the_tool_of_the_reservation_is_in_the_workshop': () =>
    sql`exists (select 1 from tools where tools.id = candidate.tool_id and tools.status = 'underRepair')`,
}

const algebra = <fragments>(predicate: fragments) => ({
  predicate,
  and: (components: readonly sql[]): sql =>
    components.length === 0 ? sql`true` : sql`(${join(components, ' and ')})`,
  or: (components: readonly sql[]): sql =>
    components.length === 0 ? sql`false` : sql`(${join(components, ' or ')})`,
  not: (operand: sql): sql => sql`not (${operand})`,
})

// The writes of each domain's facts: how their values reach the state (DOM-5).

const tools_writes: wlib.FactWrites<wlib.FactsIn<typeof tools_fact>, readonly sql[]> = {
  'business/tools/fact/a_tool_has_been_added': ({ added_tool: t }) => [
    sql`insert into tools (id, name, category, notes, add_date, status) values (${t.id}, ${t.name}, ${t.category}, ${t.notes ?? null}, ${t.addDate}, ${t.status})`,
  ],
  'business/tools/fact/a_tool_has_been_retired': ({ retired_tool: t }) => [
    sql`update tools set status = ${t.status}, repair_id = null, repair_since = null, retirement_date = ${t.retirement.date}, retirement_reason = ${t.retirement.reason}, retirement_notes = ${t.retirement.notes ?? null} where id = ${t.id}`,
  ],
  'business/tools/fact/the_tool_was_already_retired': () => [],
  'business/tools/fact/a_tool_has_been_sent_to_repair': ({ tool_under_repair: t }) => [
    sql`update tools set status = ${t.status}, repair_id = ${t.repair.id}, repair_since = ${t.repair.since} where id = ${t.id}`,
  ],
  'business/tools/fact/the_tool_was_already_under_repair': () => [],
  'business/tools/fact/the_tool_was_retired_before_the_repair': () => [],
  'business/tools/fact/a_tool_has_been_repaired': ({ repaired_tool: t }) => [
    sql`update tools set status = ${t.status}, repair_id = null, repair_since = null where id = ${t.id}`,
  ],
  'business/tools/fact/a_tool_has_been_renamed': ({ renamed_tool: t }) => [
    sql`update tools set name = ${t.name} where id = ${t.id}`,
  ],
}

const loans_writes: wlib.FactWrites<wlib.FactsIn<typeof loans_fact>, readonly sql[]> = {
  'business/loans/fact/a_tool_has_been_lent': ({ new_loan: l }) => [
    sql`insert into loans (id, tool_id, member_id, start_date, due_day, stage, term) values (${l.id}, ${l.tool_id}, ${l.member_id}, ${l.start_date}, ${l.due_day}, ${l.progress.stage}, ${l.progress.term})`,
  ],
  'business/loans/fact/the_member_already_has_the_tool': () => [],
  'business/loans/fact/a_tool_has_been_returned': ({ returned_loan: l }) => [
    sql`update loans set stage = ${l.progress.stage}, term = null, return_date = ${l.progress.return_date}, return_condition = ${l.progress.condition} where id = ${l.id}`,
  ],
  'business/loans/fact/the_loan_was_already_returned': () => [],
  'business/loans/fact/the_member_has_been_reminded_of_the_due_date': () => [],
  'business/loans/fact/the_loan_was_returned_before_the_reminder': () => [],
  'business/loans/fact/the_due_date_came_before_the_reminder': () => [],
  'business/loans/fact/a_loan_has_become_overdue': ({ overdue_loan: l }) => [
    sql`update loans set term = ${l.progress.term} where id = ${l.id}`,
  ],
  'business/loans/fact/the_loan_was_returned_before_it_became_overdue': () => [],
  'business/loans/fact/the_due_day_was_not_over': () => [],
  'business/loans/fact/a_tool_has_been_booked': ({ new_reservation: r }) => [
    sql`insert into reservations (id, tool_id, member_id, day, booking_date, stage) values (${r.id}, ${r.tool_id}, ${r.member_id}, ${r.day}, ${r.booking_date}, ${r.progress.stage})`,
  ],
  'business/loans/fact/the_member_already_booked_the_tool': () => [],
  'business/loans/fact/the_cancellation_of_the_reservations_of_a_tool_has_begun': ({
    new_cancellation: c,
  }) => [
    sql`insert into cancellations (tool_id, start_date, stage) values (${c.tool_id}, ${c.start_date}, ${c.progress.stage})`,
  ],
  'business/loans/fact/the_tool_of_a_loan_has_been_corrected': ({ corrected_loan: l }) => [
    sql`update loans set tool_id = ${l.tool_id} where id = ${l.id}`,
  ],
  'business/loans/fact/the_tool_of_the_loan_was_already_corrected': () => [],
  'business/loans/fact/the_tool_was_corrected_before_the_reminder': () => [],
  'business/loans/fact/a_reservation_has_been_taken_up': ({ taken_up_reservation: r }) => [
    sql`update reservations set stage = ${r.progress.stage}, loan_id = ${r.progress.loan_id} where id = ${r.id}`,
  ],
  'business/loans/fact/the_reservation_was_already_taken_up': () => [],
  'business/loans/fact/a_reservation_has_been_cancelled': ({ cancelled_reservation: r }) => [
    sql`update reservations set stage = ${r.progress.stage}, cancellation_date = ${r.progress.cancellation_date} where id = ${r.id}`,
  ],
  'business/loans/fact/the_cancellation_has_advanced': (c) => [
    sql`update cancellations set cursor = ${c.cursor} where tool_id = ${c.tool_id}`,
  ],
  'business/loans/fact/the_cancellation_of_the_reservations_of_a_tool_is_complete': ({
    completed_cancellation: c,
  }) => [
    sql`update cancellations set stage = ${c.progress.stage}, cursor = null, end_date = ${c.progress.end_date} where tool_id = ${c.tool_id}`,
  ],
  'business/loans/fact/a_repair_notice_round_has_begun': ({ new_round: r }) => [
    sql`insert into repair_notice_rounds (repair_id, tool_id, start_date, stage) values (${r.repair_id}, ${r.tool_id}, ${r.start_date}, ${r.progress.stage})`,
  ],
  'business/loans/fact/a_member_has_been_notified_of_the_repair': () => [],
  'business/loans/fact/the_repair_notice_round_has_advanced': (r) => [
    sql`update repair_notice_rounds set cursor = ${r.cursor} where repair_id = ${r.repair_id}`,
  ],
  'business/loans/fact/the_repair_notice_round_is_complete': ({ completed_round: r }) => [
    sql`update repair_notice_rounds set stage = ${r.progress.stage}, cursor = null, end_date = ${r.progress.end_date} where repair_id = ${r.repair_id}`,
  ],
}

/**
 * What a branch writes, in a transaction: its writes in the order of its
 * parts, then its fact and its outbox entries, in the same transaction
 * (DOM-8, D12).
 */
const record =
  (tx: Transaction) =>
  (written: wlib.PlannedWrite<readonly sql[]>): Promise<void> =>
    [
      ...written.writes.flat(),
      sql`insert into facts (parts, operation_scope, operation_id, branch, fingerprint, correlation) values (${JSON.stringify(written.fact.parts)}, ${written.fact.operation.scope}, ${written.fact.operation.id}, ${written.fact.branch}, ${written.fact.fingerprint}, ${written.fact.correlation})`,
      ...written.entries.map(
        (entry) =>
          sql`insert into outbox (effect, id, version, payload, not_before) values (${entry.effect}, ${entry.id}, ${entry.version}, ${JSON.stringify(entry.payload)}, ${entry.not_before ?? null})`,
      ),
    ].reduce((done, statement) => done.then(() => tx.run(statement)), Promise.resolve())

/**
 * The fact an operation recorded, read in the transaction that would record
 * it (the duplicate branch, DOM-11): the first statement of every command and
 * step (SC-11).
 */
const recorded_by =
  (tx: Transaction) =>
  async (operation: wlib.Operation): Promise<wlib.AlreadyRecorded | undefined> => {
    const [row] = await tx.rows(
      sql`select ${the_fact_columns} from facts where operation_scope = ${operation.scope} and operation_id = ${operation.id}`,
    )
    const fact = row === undefined ? undefined : as_fact(row)
    return fact?.event === 'fact'
      ? { outcome: 'recorded', position: fact.position, fact: fact.fact }
      : undefined
  }

/**
 * One transaction per command. The operation looked up first; then one
 * statement reads every branch's condition and every leaf: the first branch
 * that holds writes; if none does, the leaves name the failures, from the
 * same read.
 */
const execute =
  (database: Database): wlib.Execute<sql, readonly sql[]> =>
  (plan) =>
    database.transaction(async (tx) => {
      const recorded = await recorded_by(tx)(plan.operation)
      if (recorded !== undefined) {
        return recorded
      }
      const values = await tx.booleans([
        ...plan.branches.map((branch) => branch.condition),
        ...plan.branches.flatMap((branch) => branch.leaves),
      ])
      const applied = plan.branches.findIndex((_, i) => values[i] === true)
      const branch = plan.branches[applied]
      if (branch !== undefined) {
        await record(tx)(branch)
        return { outcome: 'applied', branch: applied, position: await tx.position() }
      }
      const starts = plan.branches.map((_, i) =>
        plan.branches
          .slice(0, i)
          .reduce((start, previous) => start + previous.leaves.length, plan.branches.length),
      )
      return {
        outcome: 'rejected',
        leaves: plan.branches.map((planned, i) =>
          planned.leaves.map((_, j) => values[(starts[i] ?? 0) + j] === true),
        ),
      }
    })

/** The statement of a planned query: the fields of the candidates the selection keeps, in the order. */
const select = (plan: wlib.PlannedQuery<sql, sql, sql>): sql =>
  sql`select ${join(
    Object.entries(plan.fields).map(([name, field]) => sql`${field} as ${identifier(name)}`),
    ', ',
  )} from ${plan.from} where ${plan.selection} order by ${join(
    plan.order.map(
      ([field, direction]) => sql`${field} ${direction === 'ascending' ? sql`asc` : sql`desc`}`,
    ),
    ', ',
  )}`

/**
 * One statement in one transaction, a snapshot: the fields of the candidates
 * that the selection keeps, in the order, and the position it was read at.
 */
const read =
  (database: Database): wlib.Read<sql, sql, sql> =>
  (plan) =>
    database.transaction(async (tx) => ({
      entries: await tx.rows(select(plan)),
      position: await tx.position(),
    }))

/**
 * The comparison with a step's cursor (DOM-20): the candidates after the
 * order key, lexicographic, a descending field reversed (`(day, id) > (?, ?)`,
 * written out so that the directions may differ).
 */
const after = (key: readonly wlib.OrderKeyValue<sql>[]): sql => {
  const [first, ...rest] = key
  if (first === undefined) {
    return sql`false`
  }
  const beyond =
    first.direction === 'ascending'
      ? sql`${first.field} > ${first.value}`
      : sql`${first.field} < ${first.value}`
  return rest.length === 0
    ? beyond
    : sql`(${beyond} or (${first.field} = ${first.value} and ${after(rest)}))`
}

/**
 * A step in one transaction (DOM-20, D112.2): the operation looked up first,
 * as a command's; then the process read; not found, nothing writes. Else one instance at a time, the next in the order
 * (`limit 1`): on the first on which a branch of the transition holds, that
 * branch writes; one on which none holds is passed over, and the next read
 * past it; none left, the closing writes.
 */
const execute_step =
  (database: Database): wlib.ExecuteStep<sql, readonly sql[], sql, sql, sql, sql> =>
  (plan) =>
    database.transaction(async (tx) => {
      const recorded = await recorded_by(tx)(plan.operation)
      if (recorded !== undefined) {
        return recorded
      }
      const [process] = await tx.rows(plan.read)
      const choice = plan.choose(process)
      if (choice.choice === 'not_found') {
        return { outcome: 'not_found' }
      }
      const walk = async (
        instances: wlib.PlannedQuery<sql, sql, sql>,
      ): Promise<wlib.StepExecution> => {
        const [instance] = await tx.rows(sql`${select(instances)} limit 1`)
        if (instance === undefined) {
          await record(tx)(choice.completes)
          return { outcome: 'completed', position: await tx.position() }
        }
        const branches = choice.advances(instance)
        const holds = await tx.booleans(branches.map((branch) => branch.condition))
        const applied = holds.findIndex((value) => value)
        const branch = branches[applied]
        if (branch === undefined) {
          return walk(choice.passing_over(instance))
        }
        await record(tx)(branch)
        return { outcome: 'advanced', instance, branch: applied, position: await tx.position() }
      }
      return walk(choice.instances)
    })

/**
 * A row of the facts table, its sequence the position (DOM-17): one row per
 * fact, its parts in one column, in order (DOM-10).
 */
const fact_row = z.strictObject({
  sequence: wlib.position,
  parts: z.string(),
  operation_scope: z.string(),
  operation_id: wlib.operation_id,
  branch: z.string(),
  fingerprint: wlib.fingerprint,
  correlation: wlib.correlation,
})

/** The columns of a fact, as `fact_row` reads them. */
const the_fact_columns = sql`sequence, parts, operation_scope, operation_id, branch, fingerprint, correlation`

const parts = z.array(
  z.strictObject({
    path: z.string(),
    version: wlib.semver,
    payload: z.unknown(),
    resources: z.array(z.strictObject({ path: z.string(), value: z.unknown() })),
  }),
)

const as_fact = (row: unknown): wlib.LogEvent => {
  const fact = fact_row.parse(row)
  const stored: unknown = JSON.parse(fact.parts)
  return {
    event: 'fact',
    position: fact.sequence,
    fact: {
      parts: parts.parse(stored),
      operation: { scope: fact.operation_scope, id: fact.operation_id },
      branch: fact.branch,
      fingerprint: fact.fingerprint,
      correlation: fact.correlation,
    },
  }
}

const facts_from = (database: Database) => (where: sql) =>
  database.transaction((tx) =>
    tx.rows(sql`select ${the_fact_columns} from facts where ${where} order by sequence`),
  )

/**
 * The fact log (DOM-17) over the facts table, which every command writes in
 * its transaction: the facts from a position, inclusive, then each new one as
 * `recorded` signals it. A position no longer in the table is unavailable
 * (the table's retention is the adapter's).
 */
const log =
  (database: Database): wlib.FactLog =>
  (from) => {
    const rows = facts_from(database)
    async function* live(position: wlib.position): AsyncGenerator<wlib.LogEvent> {
      await database.recorded(position)
      const facts = (await rows(sql`sequence > ${position}`)).map(as_fact)
      yield* facts
      const last = facts.at(-1)
      yield* live(last?.event === 'fact' ? last.position : position)
    }
    async function* from_position(start: wlib.position): AsyncGenerator<wlib.LogEvent> {
      const [kept] = await database.transaction((tx) =>
        tx.booleans([sql`exists (select 1 from facts where sequence = ${start})`]),
      )
      if (kept !== true) {
        yield { event: 'position_unavailable' }
        return
      }
      const facts = (await rows(sql`sequence >= ${start}`)).map(as_fact)
      yield* facts
      const last = facts.at(-1)
      const position = last?.event === 'fact' ? last.position : start
      yield { event: 'caught_up', position }
      yield* live(position)
    }
    async function* from_the_first(): AsyncGenerator<wlib.LogEvent> {
      // The facts and the position in one snapshot, so that none falls between.
      const [kept, position] = await database.transaction(
        async (tx) =>
          [
            await tx.rows(sql`select ${the_fact_columns} from facts order by sequence`),
            await tx.position(),
          ] as const,
      )
      yield* kept.map(as_fact)
      yield { event: 'caught_up', position }
      yield* live(position)
    }
    return from === undefined ? from_the_first() : from_position(from)
  }

/**
 * The paths and versions the database keeps, distinct, among the parts of
 * its facts and its outbox entries: what the library checks its versions
 * against at wiring (DOM-22, A, 17 Nov 2026).
 */
export const stored_versions =
  (database: Database): wlib.StoredVersions =>
  async () =>
    z
      .array(z.strictObject({ path: z.string(), version: wlib.semver }))
      .parse(
        await database.transaction((tx) =>
          tx.rows(
            sql`select distinct part->>'path' as path, part->>'version' as version from facts, jsonb_array_elements(parts::jsonb) as part union select distinct effect as path, version from outbox`,
          ),
        ),
      )

/** The tables the facts write, which a rebuild empties first. */
const the_tables = ['tools', 'loans', 'reservations', 'cancellations', 'repair_notice_rounds']

/** Statements run one after the other, in a transaction. */
const run_in_order =
  (tx: Transaction) =>
  (statements: readonly sql[]): Promise<void> =>
    statements.reduce((done, statement) => done.then(() => tx.run(statement)), Promise.resolve())

/**
 * The rebuild of the tables from the facts (DOM-22, A, 17 Nov 2026): with a
 * release that changes them (`loans` 2.0.0, its `due_date` column become
 * `due_day`), the adapter empties them and writes again every fact the log
 * keeps, which the library gives at the current shapes (`replay`), through
 * the same writes as a command's. Marta's loan, lent at 1.x due at 10:12 on
 * 16 November, comes back due on that day; no value is rewritten by hand. One
 * transaction: no reader sees the tables half done.
 */
const rebuild = (database: Database) => (versions: wlib.Versions) => (): Promise<void> => {
  const facts = wlib.replay<
    wlib.FactsIn<typeof tools_fact> | wlib.FactsIn<typeof loans_fact>,
    readonly sql[]
  >({ versions, writes: { ...tools_writes, ...loans_writes } })(log(database))
  return database.transaction(async (tx) => {
    await run_in_order(tx)(the_tables.map((table) => sql`delete from ${identifier(table)}`))
    for await (const fact of facts) {
      await run_in_order(tx)(fact.writes.flat())
    }
  })
}

// The sources of the queries: where the candidates are, how each field reads.

/** The reservations a step of `loans` walks, whole: both its sheets walk them (DOM-20). */
const the_whole_reservation = {
  from: sql`reservations as candidate`,
  fields: {
    id: sql`candidate.id`,
    tool_id: sql`candidate.tool_id`,
    member_id: sql`candidate.member_id`,
    day: sql`candidate.day`,
    booking_date: sql`candidate.booking_date`,
    progress: sql`json_strip_nulls(json_build_object('stage', candidate.stage, 'loan_id', candidate.loan_id, 'cancellation_date', candidate.cancellation_date))`,
  },
}

/** A member's reservation, as the member sees it: the tool with its name, read from `tools`, and the day. */
const the_reservation_entry = {
  from: sql`reservations as candidate`,
  fields: {
    id: sql`candidate.id`,
    tool_id: sql`candidate.tool_id`,
    tool_name: sql`(select name from tools where tools.id = candidate.tool_id)`,
    day: sql`candidate.day`,
  },
}

export const sql_adapter = (database: Database) => (versions: wlib.Versions) => ({
  rebuild: rebuild(database)(versions),
  tools: {
    ...wlib.command_use_case_ports({
      registry: tools_registry,
      versions,
      use_cases: {
        add_a_tool,
        retire_a_tool,
        send_a_tool_to_repair,
        put_a_repaired_tool_back_in_service,
        rename_a_tool,
      },
    })({
      algebra: algebra(tools_fragments),
      write: tools_writes,
      execute: execute(database),
    }),
    // The catalogue is only read: a visitor reads it once, no case streams it.
    ...wlib.read_use_case_ports({
      registry: tools_registry,
      versions,
      use_cases: { the_catalogue },
    })({
      algebra: algebra(tool_selection_fragments),
      sources: {
        the_catalogue: {
          from: sql`tools as candidate`,
          fields: {
            id: sql`candidate.id`,
            name: sql`candidate.name`,
            category: sql`candidate.category`,
            notes: sql`candidate.notes`,
          },
        },
      },
      read: read(database),
      streams: {},
    }),
  },
  loans: {
    ...wlib.command_use_case_ports({
      registry: loans_registry,
      versions,
      use_cases: {
        borrow_a_tool,
        lend_a_booked_tool,
        correct_the_tool_of_a_loan,
        reserve_a_tool,
        return_a_tool,
        continue_the_cancellation_of_reservations,
        continue_the_repair_notice_round,
      },
    })({
      algebra: algebra(loans_fragments),
      write: loans_writes,
      execute: execute(database),
      steps: {
        selection: { ...algebra(reservation_selection_fragments), after },
        sources: {
          // The work sheet by its tool, nested as its value (the library
          // parses it: none, or closed, is the step's rejection); the
          // reservations it walks, whole.
          continue_the_cancellation_of_reservations: {
            reads: (input) =>
              sql`select tool_id, start_date, json_strip_nulls(json_build_object('stage', stage, 'cursor', cursor, 'end_date', end_date)) as progress from cancellations where tool_id = ${input.tool_id}`,
            ...the_whole_reservation,
          },
          // The round of notices by its stay in repair, the same reservations.
          continue_the_repair_notice_round: {
            reads: (input) =>
              sql`select repair_id, tool_id, start_date, json_strip_nulls(json_build_object('stage', stage, 'cursor', cursor, 'end_date', end_date)) as progress from repair_notice_rounds where repair_id = ${input.repair_id}`,
            ...the_whole_reservation,
          },
        },
        execute: execute_step(database),
      },
    }),
    ...wlib.read_use_case_ports({
      registry: loans_registry,
      versions,
      use_cases: {
        the_ongoing_loans_of_a_member,
        the_reservations_of_a_member,
        the_reservations_of_a_member_in_the_workshop,
      },
    })({
      algebra: algebra({ ...loan_selection_fragments, ...reservation_selection_fragments }),
      sources: {
        the_ongoing_loans_of_a_member: {
          from: sql`loans as candidate`,
          fields: {
            id: sql`candidate.id`,
            tool_id: sql`candidate.tool_id`,
            // A value of the view of `loans`, read from `tools`: the link.
            tool_name: sql`(select name from tools where tools.id = candidate.tool_id)`,
            start_date: sql`candidate.start_date`,
            due_day: sql`candidate.due_day`,
            term: sql`candidate.term`,
          },
        },
        the_reservations_of_a_member: the_reservation_entry,
        the_reservations_of_a_member_in_the_workshop: the_reservation_entry,
      },
      read: read(database),
      // A member's loans and reservations are few: a whole read per fact of the
      // node is cheap, and a fact of `tools` that renames a tool reads again
      // the name of its rows (SC-19).
      streams: {
        the_ongoing_loans_of_a_member: { strategy: 'composed', log: log(database) },
        the_reservations_of_a_member: { strategy: 'composed', log: log(database) },
        the_reservations_of_a_member_in_the_workshop: { strategy: 'composed', log: log(database) },
      },
    }),
  },
})
