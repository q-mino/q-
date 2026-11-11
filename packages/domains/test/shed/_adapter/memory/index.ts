// A sketch of the in-memory state adapter, the oracle of the shed (TST-2):
// one module per domain, the state of every domain in one value, one command
// at a time. The links between domains are typed in the modules (`loans.ts`
// imports `tools.ts`), and their imports are the graph of who reads whom.
// Nothing runs: the library is wished.
//
// Reads are typed by subject (DOM-18): each domain module gives, for each
// subject, its selection fragments over a typed candidate and the sources of
// its queries; the query ports are built one subject at a time, so that each
// has its own candidate type.

import * as wlib from '../../wlib.ts'
import { registry as tools_registry } from '../../tools/_domain/registry.ts'
import { registry as loans_registry } from '../../loans/_domain/registry.ts'
import { add_a_tool, retire_a_tool } from '../../tools/_domain/command.ts'
import { the_catalogue } from '../../tools/_domain/query.ts'
import { borrow_a_tool, reserve_a_tool, return_a_tool } from '../../loans/_domain/command.ts'
import {
  the_ongoing_loans_of_a_member,
  the_reservations_of_a_member,
} from '../../loans/_domain/query.ts'
import type { Field, Selection, Source } from './fragments.ts'
import {
  loan_selection,
  loan_sources,
  loans_fragments,
  loans_writes,
  reservation_selection,
  reservation_sources,
  type LoansState,
} from './loans.ts'
import {
  tool_selection,
  tool_sources,
  tools_fragments,
  tools_writes,
  type ToolsState,
} from './tools.ts'

/** The state of every domain. */
export interface State extends ToolsState, LoansState {}

/** A condition, read on the state. */
type Fragment = (state: State) => boolean

/** A fact's write: the part of the state it changes. */
type Write = (state: State) => Partial<State>

/**
 * Where the oracle keeps the state: a port, so that a test can look at it.
 * Its position counts the states it was set to.
 */
export interface Cell {
  readonly get: () => State
  readonly set: (state: State) => void
  readonly position: () => wlib.position
}

const algebra = <fragments>(predicate: fragments) => ({
  predicate,
  and:
    (components: readonly Fragment[]): Fragment =>
    (state) =>
      components.every((component) => component(state)),
  or:
    (components: readonly Fragment[]): Fragment =>
    (state) =>
      components.some((component) => component(state)),
  not:
    (operand: Fragment): Fragment =>
    (state) =>
      !operand(state),
})

/**
 * A serial writer (DOM-9): every branch and every leaf read on one state; the
 * first branch that holds writes; if none does, the leaves name the failures.
 */
const execute =
  (cell: Cell): wlib.Execute<Fragment, Write> =>
  (plan) => {
    const state = cell.get()
    const applied = plan.findIndex((branch) => branch.condition(state))
    const branch = plan[applied]
    if (branch === undefined) {
      return Promise.resolve<wlib.Execution>({
        outcome: 'rejected',
        leaves: plan.map((planned) => planned.leaves.map((leaf) => leaf(state))),
      })
    }
    cell.set({ ...state, ...branch.write(state) })
    return Promise.resolve<wlib.Execution>({ outcome: 'applied', branch: applied })
  }

const code_points = (text: string): readonly number[] =>
  Array.from(text, (character) => character.codePointAt(0) ?? 0)

/** Text by Unicode code point, no collation (LIB-9). */
const compare_texts = (a: string, b: string): number => {
  const x = code_points(a)
  const y = code_points(b)
  const first_difference = x.findIndex((point, i) => point !== y[i])
  return first_difference === -1
    ? x.length - y.length
    : (x[first_difference] ?? 0) - (y[first_difference] ?? Number.NEGATIVE_INFINITY)
}

/**
 * The value order of LIB-9: an absent value after any value, false before
 * true, numbers by value, text by code point.
 */
const compare_values = (a: unknown, b: unknown): number =>
  a === undefined || a === null
    ? b === undefined || b === null
      ? 0
      : 1
    : b === undefined || b === null
      ? -1
      : typeof a === 'string' && typeof b === 'string'
        ? compare_texts(a, b)
        : typeof a === 'number' && typeof b === 'number'
          ? a - b
          : typeof a === 'boolean' && typeof b === 'boolean'
            ? Number(a) - Number(b)
            : 0

/**
 * A read on one state: the candidates of the source that the selection keeps,
 * in the order (a descending field reverses the value order), each as the
 * entry of its fields.
 */
const read =
  (cell: Cell) =>
  <candidate>(
    plan: wlib.PlannedQuery<
      Selection<State, candidate>,
      Source<State, candidate>,
      Field<State, candidate>
    >,
  ) => {
    const state = cell.get()
    const keeps = plan.selection(state)
    const order = plan.order.map(([field, direction]) => {
      const value = field(state)
      const sign = direction === 'ascending' ? 1 : -1
      return (a: candidate, b: candidate): number => sign * compare_values(value(a), value(b))
    })
    const entries = plan
      .from(state)
      .filter(keeps)
      .toSorted((a, b) => order.reduce((result, by) => (result !== 0 ? result : by(a, b)), 0))
      .map((candidate) =>
        Object.fromEntries(
          Object.entries(plan.fields).map(([name, field]) => [name, field(state)(candidate)]),
        ),
      )
    return Promise.resolve({ entries, position: cell.position() })
  }

export const memory_adapter = (cell: Cell) => ({
  tools: {
    ...wlib.command_ports({ registry: tools_registry, commands: { add_a_tool, retire_a_tool } })({
      algebra: algebra(tools_fragments),
      write: tools_writes,
      execute: execute(cell),
    }),
    ...wlib.query_ports({ registry: tools_registry, queries: { the_catalogue } })({
      algebra: tool_selection,
      sources: tool_sources,
      read: read(cell),
    }),
  },
  loans: {
    ...wlib.command_ports({
      registry: loans_registry,
      commands: { borrow_a_tool, reserve_a_tool, return_a_tool },
    })({
      algebra: algebra(loans_fragments),
      write: loans_writes,
      execute: execute(cell),
    }),
    ...wlib.query_ports({
      registry: loans_registry,
      queries: { the_ongoing_loans_of_a_member },
    })({
      algebra: loan_selection,
      sources: loan_sources,
      read: read(cell),
    }),
    ...wlib.query_ports({
      registry: loans_registry,
      queries: { the_reservations_of_a_member },
    })({
      algebra: reservation_selection,
      sources: reservation_sources,
      read: read(cell),
    }),
  },
})
