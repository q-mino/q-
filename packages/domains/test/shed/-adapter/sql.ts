// A sketch of a SQL state adapter for the shed, to try the signatures the
// library derives (LIB-14). One adapter for the state of every domain: the
// predicates of `tools` that `loans` uses are fragments of the same adapter
// (D71). Nothing runs: the database is a port, the library is wished.

import * as wlib from '../wlib.ts'
import type * as tools_fact from '../tools/-domain/$fact.ts'
import type * as tools_predicate from '../tools/-domain/$predicate.ts'
import { add_a_tool, retire_a_tool } from '../tools/-domain/command.ts'
import type * as loans_fact from '../loans/-domain/$fact.ts'
import type * as loans_predicate from '../loans/-domain/$predicate.ts'
import { borrow_a_tool, reserve_a_tool } from '../loans/-domain/command.ts'

/** A SQL fragment: its text, with `?` for each value. */
export interface sql {
  readonly text: string
  readonly values: readonly unknown[]
}

const is_sql = (value: unknown): value is sql =>
  typeof value === 'object' && value !== null && 'text' in value && 'values' in value

/** A fragment from a template: a nested fragment is spliced, any other value is bound. */
export const sql = (strings: TemplateStringsArray, ...values: readonly unknown[]): sql =>
  values.reduce<sql>(
    (fragment, value, i) => {
      const next = strings[i + 1] ?? ''
      return is_sql(value)
        ? { text: fragment.text + value.text + next, values: [...fragment.values, ...value.values] }
        : { text: fragment.text + '?' + next, values: [...fragment.values, value] }
    },
    { text: strings[0] ?? '', values: [] },
  )

const join = (fragments: readonly sql[], separator: string): sql => ({
  text: fragments.map((fragment) => fragment.text).join(separator),
  values: fragments.flatMap((fragment) => fragment.values),
})

/** The database, a port. Its transactions are serializable. */
export interface Database {
  readonly transaction: <result>(work: (tx: Transaction) => Promise<result>) => Promise<result>
}
export interface Transaction {
  /** One statement, one boolean per column: `select c1, c2, …`. */
  readonly booleans: (columns: readonly sql[]) => Promise<readonly boolean[]>
  readonly run: (statement: sql) => Promise<void>
}

// The fragments of each domain's predicates: one translation, reused by every
// command and every read.

const tools_fragments: wlib.PredicateFragments<wlib.PredicatesIn<typeof tools_predicate>, sql> = {
  'tools/predicate/a_tool_has_this_id': (p) =>
    sql`exists (select 1 from tools where id = ${p.tool_id})`,
  'tools/predicate/the_tool_is_in_service': (p) =>
    sql`exists (select 1 from tools where id = ${p.tool_id} and status = 'inService')`,
  'tools/predicate/the_tool_is_retired': (p) =>
    sql`exists (select 1 from tools where id = ${p.tool_id} and status = 'retired')`,
}

const loans_fragments: wlib.PredicateFragments<wlib.PredicatesIn<typeof loans_predicate>, sql> = {
  'loans/predicate/a_loan_has_this_id': (p) =>
    sql`exists (select 1 from loans where id = ${p.loan_id})`,
  'loans/predicate/the_tool_is_on_loan': (p) =>
    sql`exists (select 1 from loans where tool_id = ${p.tool_id} and stage = 'ongoing')`,
  'loans/predicate/the_tool_is_on_loan_to_this_member': (p) =>
    sql`exists (select 1 from loans where tool_id = ${p.tool_id} and member_id = ${p.member_id} and stage = 'ongoing')`,
  'loans/predicate/a_reservation_has_this_id': (p) =>
    sql`exists (select 1 from reservations where id = ${p.reservation_id})`,
  'loans/predicate/the_tool_is_booked_for_the_day': (p) =>
    sql`exists (select 1 from reservations where tool_id = ${p.tool_id} and day = ${p.day} and stage = 'booked')`,
  'loans/predicate/the_tool_is_booked_for_the_day_by_this_member': (p) =>
    sql`exists (select 1 from reservations where tool_id = ${p.tool_id} and day = ${p.day} and member_id = ${p.member_id} and stage = 'booked')`,
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
  'tools/fact/a_tool_has_been_added': ({ added_tool: t }) => [
    sql`insert into tools (id, name, category, notes, add_date, status) values (${t.id}, ${t.name}, ${t.category}, ${t.notes ?? null}, ${t.addDate}, ${t.status})`,
  ],
  'tools/fact/a_tool_has_been_retired': ({ retired_tool: t }) => [
    sql`update tools set status = ${t.status}, retirement_date = ${t.retirement.date}, retirement_reason = ${t.retirement.reason}, retirement_notes = ${t.retirement.notes ?? null} where id = ${t.id}`,
  ],
  'tools/fact/the_tool_was_already_retired': () => [],
}

const loans_writes: wlib.FactWrites<wlib.FactsIn<typeof loans_fact>, readonly sql[]> = {
  'loans/fact/a_tool_has_been_lent': ({ new_loan: l }) => [
    sql`insert into loans (id, tool_id, member_id, start_date, due_date, stage) values (${l.id}, ${l.tool_id}, ${l.member_id}, ${l.start_date}, ${l.due_date}, ${l.progress.stage})`,
  ],
  'loans/fact/the_member_already_has_the_tool': () => [],
  'loans/fact/a_tool_has_been_booked': ({ new_reservation: r }) => [
    sql`insert into reservations (id, tool_id, member_id, day, booking_date, stage) values (${r.id}, ${r.tool_id}, ${r.member_id}, ${r.day}, ${r.booking_date}, ${r.progress.stage})`,
  ],
  'loans/fact/the_member_already_booked_the_tool': () => [],
}

/**
 * One transaction per command. One statement reads every branch's condition
 * and every leaf: the first branch that holds writes; if none does, the
 * leaves name the failures, from the same read.
 */
const execute =
  (database: Database): wlib.Execute<sql, readonly sql[]> =>
  (plan) =>
    database.transaction(async (tx) => {
      const values = await tx.booleans([
        ...plan.map((branch) => branch.condition),
        ...plan.flatMap((branch) => branch.leaves),
      ])
      const applied = plan.findIndex((_, i) => values[i] === true)
      const branch = plan[applied]
      if (branch !== undefined) {
        await branch.write.reduce(
          (done, statement) => done.then(() => tx.run(statement)),
          Promise.resolve(),
        )
        return { outcome: 'applied', branch: applied }
      }
      const starts = plan.map((_, i) =>
        plan.slice(0, i).reduce((start, previous) => start + previous.leaves.length, plan.length),
      )
      return {
        outcome: 'rejected',
        leaves: plan.map((planned, i) =>
          planned.leaves.map((_, j) => values[(starts[i] ?? 0) + j] === true),
        ),
      }
    })

export const sql_adapter = (database: Database) => ({
  tools: wlib.command_ports({ add_a_tool, retire_a_tool })({
    algebra: algebra(tools_fragments),
    write: tools_writes,
    execute: execute(database),
  }),
  loans: wlib.command_ports({ borrow_a_tool, reserve_a_tool })({
    algebra: algebra({ ...tools_fragments, ...loans_fragments }),
    write: loans_writes,
    execute: execute(database),
  }),
})
