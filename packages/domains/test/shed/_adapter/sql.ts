// A sketch of a SQL state adapter for the shed, to try the signatures the
// library derives (LIB-14). One adapter for the state of every domain: the
// predicates of `tools` that `loans` uses are fragments of the same adapter
// (D71). Nothing runs: the database is a port, the library is wished.

import * as wlib from '../wlib.ts'
import { registry as tools_registry } from '../tools/_domain/registry.ts'
import { registry as loans_registry } from '../loans/_domain/registry.ts'
import type * as tools_fact from '../tools/_domain/fact.ts'
import type * as tools_predicate from '../tools/_domain/predicate.ts'
import type * as tools_selection from '../tools/_domain/selection/index.ts'
import { add_a_tool, retire_a_tool } from '../tools/_domain/command.ts'
import { the_catalogue } from '../tools/_domain/query.ts'
import type * as loans_fact from '../loans/_domain/fact.ts'
import type * as loans_predicate from '../loans/_domain/predicate.ts'
import type * as loans_selection from '../loans/_domain/selection/index.ts'
import { borrow_a_tool, reserve_a_tool, return_a_tool } from '../loans/_domain/command.ts'
import {
  the_ongoing_loans_of_a_member,
  the_reservations_of_a_member,
} from '../loans/_domain/query.ts'

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

/** The database, a port. Its transactions are serializable. */
export interface Database {
  readonly transaction: <result>(work: (tx: Transaction) => Promise<result>) => Promise<result>
}
export interface Transaction {
  /** One statement, one boolean per column: `select c1, c2, …`. */
  readonly booleans: (columns: readonly sql[]) => Promise<readonly boolean[]>
  readonly run: (statement: sql) => Promise<void>
  readonly rows: (statement: sql) => Promise<readonly unknown[]>
  /** Where the state stands: the sequence of the last fact written. */
  readonly position: () => Promise<wlib.position>
}

// The fragments of each domain's predicates: one translation, reused by every
// command (ADP-8).

const tools_fragments: wlib.PredicateFragments<wlib.PredicatesIn<typeof tools_predicate>, sql> = {
  'tools/predicate/a_tool_has_this_id': (p) =>
    sql`exists (select 1 from tools where id = ${p.tool_id})`,
  'tools/predicate/the_tool_is_in_service': (p) =>
    sql`exists (select 1 from tools where id = ${p.tool_id} and status = 'inService')`,
  'tools/predicate/the_tool_is_retired': (p) =>
    sql`exists (select 1 from tools where id = ${p.tool_id} and status = 'retired')`,
}

const loans_fragments: wlib.PredicateFragments<wlib.PredicatesIn<typeof loans_predicate>, sql> = {
  // The view of `loans` over the tools of `tools` (GR-3, V11): the link.
  'loans/predicate/a_tool_has_this_id': (p) =>
    sql`exists (select 1 from tools where id = ${p.tool_id})`,
  'loans/predicate/the_tool_is_in_service': (p) =>
    sql`exists (select 1 from tools where id = ${p.tool_id} and status = 'inService')`,
  'loans/predicate/a_loan_has_this_id': (p) =>
    sql`exists (select 1 from loans where id = ${p.loan_id})`,
  'loans/predicate/the_loan_is_ongoing': (p) =>
    sql`exists (select 1 from loans where id = ${p.loan_id} and stage = 'ongoing')`,
  'loans/predicate/the_loan_is_returned': (p) =>
    sql`exists (select 1 from loans where id = ${p.loan_id} and stage = 'returned')`,
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

// The fragments of the selection predicates, grouped by subject (DOM-18): a
// condition over the candidate of a query, which every source of the adapter
// calls `candidate`. In SQL every group has the same fragment type.

const tool_selection_fragments: wlib.PredicateFragments<
  wlib.SelectionsIn<typeof tools_selection.tool>,
  sql
> = {
  'tools/selection/tool/the_tool_is_in_service': () => sql`candidate.status = 'inService'`,
  'tools/selection/tool/the_tool_is_in_one_of_these_categories': (p) =>
    sql`candidate.category in (${p.categories})`,
}

const loan_selection_fragments: wlib.PredicateFragments<
  wlib.SelectionsIn<typeof loans_selection.loan>,
  sql
> = {
  'loans/selection/loan/the_loan_is_ongoing': () => sql`candidate.stage = 'ongoing'`,
  'loans/selection/loan/the_loan_is_of_this_member': (p) =>
    sql`candidate.member_id = ${p.member_id}`,
}

const reservation_selection_fragments: wlib.PredicateFragments<
  wlib.SelectionsIn<typeof loans_selection.reservation>,
  sql
> = {
  'loans/selection/reservation/the_reservation_is_booked': () => sql`candidate.stage = 'booked'`,
  'loans/selection/reservation/the_reservation_is_of_this_member': (p) =>
    sql`candidate.member_id = ${p.member_id}`,
  'loans/selection/reservation/the_reservation_is_from_this_day_on': (p) =>
    sql`candidate.day >= ${p.day}`,
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
  'loans/fact/a_tool_has_been_returned': ({ returned_loan: l }) => [
    sql`update loans set stage = ${l.progress.stage}, return_date = ${l.progress.return_date}, return_condition = ${l.progress.condition} where id = ${l.id}`,
  ],
  'loans/fact/the_loan_was_already_returned': () => [],
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

/**
 * One statement in one transaction, a snapshot: the fields of the candidates
 * that the selection keeps, in the order, and the position it was read at.
 */
const read =
  (database: Database): wlib.Read<sql, sql, sql> =>
  (plan) =>
    database.transaction(async (tx) => ({
      entries: await tx.rows(
        sql`select ${join(
          Object.entries(plan.fields).map(([name, field]) => sql`${field} as ${identifier(name)}`),
          ', ',
        )} from ${plan.from} where ${plan.selection} order by ${join(
          plan.order.map(
            ([field, direction]) =>
              sql`${field} ${direction === 'ascending' ? sql`asc` : sql`desc`}`,
          ),
          ', ',
        )}`,
      ),
      position: await tx.position(),
    }))

// The sources of the queries: where the candidates are, how each field reads.

export const sql_adapter = (database: Database) => ({
  tools: {
    ...wlib.command_ports({ registry: tools_registry, commands: { add_a_tool, retire_a_tool } })({
      algebra: algebra(tools_fragments),
      write: tools_writes,
      execute: execute(database),
    }),
    ...wlib.query_ports({ registry: tools_registry, queries: { the_catalogue } })({
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
    }),
  },
  loans: {
    ...wlib.command_ports({
      registry: loans_registry,
      commands: { borrow_a_tool, reserve_a_tool, return_a_tool },
    })({
      algebra: algebra(loans_fragments),
      write: loans_writes,
      execute: execute(database),
    }),
    ...wlib.query_ports({
      registry: loans_registry,
      queries: { the_ongoing_loans_of_a_member, the_reservations_of_a_member },
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
            due_date: sql`candidate.due_date`,
          },
        },
        the_reservations_of_a_member: {
          from: sql`reservations as candidate`,
          fields: {
            id: sql`candidate.id`,
            tool_id: sql`candidate.tool_id`,
            tool_name: sql`(select name from tools where tools.id = candidate.tool_id)`,
            day: sql`candidate.day`,
          },
        },
      },
      read: read(database),
    }),
  },
})
