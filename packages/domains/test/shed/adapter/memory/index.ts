// A sketch of the in-memory state adapter, the oracle of the shed and its
// reference interpreter (TST-2, V10):
// one module per domain, the state of every domain in one value, one command
// at a time. The links between domains are typed in the modules (`loans.ts`
// imports `tools.ts`), and their imports are the graph of who reads whom.
// Nothing runs: the library is wished.
//
// Reads are typed by subject (DOM-18): each domain module gives, for each
// subject, its selection fragments over a typed candidate and the sources of
// its queries; the query ports are built one subject at a time, so that each
// has its own candidate type.
//
// Streams (DOM-17): the oracle keeps every fact with the state before and
// after it, and its stream defines what the events of a fact are.

import * as wlib from '../../wlib.ts'
import { registry as tools_registry } from '../../@business/@tools/_registry.ts'
import { registry as loans_registry } from '../../@business/@loans/_registry.ts'
import { registry as accounts_registry } from '../../@auth/@accounts/_registry.ts'
import {
  the_hats_of_an_account,
  the_member_card_of_an_account,
} from '../../@auth/@accounts/_lookup.ts'
import { accounts_lookups, type AccountsState } from './accounts.ts'
import { add_a_tool, retire_a_tool, the_catalogue } from '../../@business/@tools/_usecase.ts'
import {
  borrow_a_tool,
  reserve_a_tool,
  return_a_tool,
  the_ongoing_loans_of_a_member,
  the_reservations_of_a_member,
} from '../../@business/@loans/_usecase.ts'
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
export interface State extends ToolsState, LoansState, AccountsState {}

/** A condition, read on the state. */
type Fragment = (state: State) => boolean

/** A fact's write: the part of the state it changes. */
type Write = (state: State) => Partial<State>

/** A recorded fact with the state it left. */
export interface Step {
  readonly fact: wlib.StoredEnvelope
  readonly state: State
}

/**
 * Where the oracle keeps the state and its facts: a port, so that a test can
 * look at it. Its position counts the facts recorded.
 */
export interface Cell {
  readonly get: () => State
  readonly record: (step: Step) => void
  readonly position: () => wlib.position
  /** The facts recorded from a position on, inclusive (DOM-17). */
  readonly history: (from: wlib.position) => History
  /** The facts recorded after a position, as soon as there is one. */
  readonly after: (position: wlib.position) => Promise<readonly Recorded[]>
}

/** A recorded fact, at its position, with the state before and after it. */
export interface Recorded {
  readonly position: wlib.position
  readonly fact: wlib.StoredEnvelope
  readonly before: State
  readonly after: State
}

/**
 * What the cell keeps from a position on: the facts recorded, and its
 * position when asked; or nothing, when it keeps that position no longer (a
 * test injects it, TST-4).
 */
export type History =
  | {
      readonly history: 'kept'
      readonly recorded: readonly Recorded[]
      readonly position: wlib.position
    }
  | { readonly history: 'forgotten' }

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
    cell.record({ fact: branch.fact, state: { ...state, ...branch.write(state) } })
    return Promise.resolve<wlib.Execution>({
      outcome: 'applied',
      branch: applied,
      position: cell.position(),
    })
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
 * The value order of LIB-9, an interpreter rule that the other adapters and
 * the UI follow: an absent value after any value, false before
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

/** A planned query over the candidates of one subject. */
type Plan<candidate> = wlib.PlannedQuery<
  Selection<State, candidate>,
  Source<State, candidate>,
  Field<State, candidate>
>

/** An entry with its identity, read from its identity field. */
interface Identified {
  readonly identity: unknown
  readonly entry: Readonly<Record<string, unknown>>
}

/**
 * The entries of a query on a state: the candidates of the source that the
 * selection keeps, in the order (a descending field reverses the value
 * order; the identity closes it), each as the entry of its fields.
 */
const entries_on =
  <candidate>(plan: Plan<candidate>) =>
  (state: State): readonly Identified[] => {
    const keeps = plan.selection(state)
    const order = plan.order.map(([field, direction]) => {
      const value = field(state)
      const sign = direction === 'ascending' ? 1 : -1
      return (a: candidate, b: candidate): number => sign * compare_values(value(a), value(b))
    })
    return plan
      .from(state)
      .filter(keeps)
      .toSorted((a, b) => order.reduce((result, by) => (result !== 0 ? result : by(a, b)), 0))
      .map((candidate) => {
        const entry = Object.fromEntries(
          Object.entries(plan.fields).map(([name, field]) => [name, field(state)(candidate)]),
        )
        return { identity: entry[plan.identity.field], entry }
      })
  }

/** A read on one state: its entries and its position. */
const read =
  (cell: Cell) =>
  <candidate>(plan: Plan<candidate>) =>
    Promise.resolve({
      entries: entries_on(plan)(cell.get()).map((identified) => identified.entry),
      position: cell.position(),
    })

type Event = wlib.StreamEvent<wlib.StoredEnvelope, unknown, unknown>

/**
 * The events of a fact for a query, the semantics of a stream (DOM-17, V10):
 * the entries before and after the fact, compared by identity. An entry kept
 * after it that the fact touches (its identity among the fact's resources) is
 * the fact; one that appears untouched entered; one that disappears left,
 * touched or not; an untouched entry that stays gives nothing, even if a
 * field changed. Interpreter rule: the events of one fact come in the order
 * of the entries after it, then those that left, in their order before it.
 */
const events_of =
  <candidate>(plan: Plan<candidate>) =>
  (recorded: Recorded): readonly Event[] => {
    const before = entries_on(plan)(recorded.before)
    const after = entries_on(plan)(recorded.after)
    const among = (entries: readonly Identified[]) => (identity: unknown) =>
      entries.some((identified) => identified.identity === identity)
    const touched = (identity: unknown): boolean =>
      recorded.fact.resources.some(
        (resource) => resource.path === plan.identity.path && resource.value === identity,
      )
    return [
      ...after.flatMap(({ identity, entry }): readonly Event[] =>
        touched(identity)
          ? [{ event: 'fact', position: recorded.position, identity, fact: recorded.fact, entry }]
          : among(before)(identity)
            ? []
            : [{ event: 'entered', position: recorded.position, identity, entry }],
      ),
      ...before
        .filter(({ identity }) => !among(after)(identity))
        .map(({ identity }): Event => ({ event: 'left', position: recorded.position, identity })),
    ]
  }

/**
 * A stream from a position: the events of the facts kept from there, then
 * "caught up", then the events of each new fact; or "position no longer
 * available", when the cell keeps that position no longer.
 */
const stream =
  (cell: Cell) =>
  <candidate>(plan: Plan<candidate>) =>
  (from: wlib.position): AsyncIterable<Event> => {
    const events = events_of(plan)
    async function* live(position: wlib.position): AsyncGenerator<Event> {
      const recorded = await cell.after(position)
      yield* recorded.flatMap(events)
      yield* live(recorded.at(-1)?.position ?? position)
    }
    async function* from_history(): AsyncGenerator<Event> {
      const history = cell.history(from)
      if (history.history === 'forgotten') {
        yield { event: 'position_unavailable' }
        return
      }
      yield* history.recorded.flatMap(events)
      yield { event: 'caught_up', position: history.position }
      yield* live(history.position)
    }
    return from_history()
  }

/** The oracle streams every query natively: its stream is exact, state before and after each fact. */
const native = (cell: Cell) => ({ strategy: 'native', stream: stream(cell) }) as const

export const memory_adapter = (cell: Cell) => ({
  tools: {
    ...wlib.command_use_case_ports({
      registry: tools_registry,
      use_cases: { add_a_tool, retire_a_tool },
    })({
      algebra: algebra(tools_fragments),
      write: tools_writes,
      execute: execute(cell),
    }),
    ...wlib.read_use_case_ports({ registry: tools_registry, use_cases: { the_catalogue } })({
      algebra: tool_selection,
      sources: tool_sources,
      read: read(cell),
      streams: { the_catalogue: native(cell) },
    }),
  },
  loans: {
    ...wlib.command_use_case_ports({
      registry: loans_registry,
      use_cases: { borrow_a_tool, reserve_a_tool, return_a_tool },
    })({
      algebra: algebra(loans_fragments),
      write: loans_writes,
      execute: execute(cell),
    }),
    ...wlib.read_use_case_ports({
      registry: loans_registry,
      use_cases: { the_ongoing_loans_of_a_member },
    })({
      algebra: loan_selection,
      sources: loan_sources,
      read: read(cell),
      streams: { the_ongoing_loans_of_a_member: native(cell) },
    }),
    ...wlib.read_use_case_ports({
      registry: loans_registry,
      use_cases: { the_reservations_of_a_member },
    })({
      algebra: reservation_selection,
      sources: reservation_sources,
      read: read(cell),
      streams: { the_reservations_of_a_member: native(cell) },
    }),
  },
  accounts: wlib.lookup_ports({
    registry: accounts_registry,
    lookups: { the_hats_of_an_account, the_member_card_of_an_account },
  })(accounts_lookups(cell.get)),
})
