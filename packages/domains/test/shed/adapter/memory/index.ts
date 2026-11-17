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
import { registry as tools_registry } from '../../business/tools/_registry.ts'
import { registry as loans_registry } from '../../business/loans/_registry.ts'
import { registry as accounts_registry } from '../../auth/accounts/_registry.ts'
import {
  the_hats_of_an_account,
  the_member_card_of_an_account,
} from '../../auth/accounts/_lookup.ts'
import { accounts_lookups, type AccountsState } from './accounts.ts'
import {
  add_a_tool,
  put_a_repaired_tool_back_in_service,
  retire_a_tool,
  send_a_tool_to_repair,
  the_catalogue,
} from '../../business/tools/_usecase.ts'
import {
  borrow_a_tool,
  cancel_the_reservations_of_a_tool,
  continue_the_cancellation_of_reservations,
  continue_the_repair_notice_round,
  declare_the_loan_overdue,
  notify_the_members_of_a_repair,
  remind_the_member_of_the_due_date,
  reserve_a_tool,
  return_a_tool,
  the_ongoing_loans_of_a_member,
  the_reservations_of_a_member,
} from '../../business/loans/_usecase.ts'
import type { Field, ProcessRead, Selection, Source } from './fragments.ts'
import {
  loan_selection,
  loan_sources,
  loans_fragments,
  loans_writes,
  reservation_selection,
  reservation_sources,
  reservation_steps,
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

/** A recorded fact with its outbox entries and the state it left. */
export interface Step {
  readonly fact: wlib.StoredEnvelope
  readonly entries: readonly wlib.StoredEntry[]
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
  /** The facts recorded from a position on, inclusive (DOM-17); from the first, with none. */
  readonly history: (from: wlib.position | undefined) => History
  /** The facts recorded after a position, as soon as there is one. */
  readonly after: (position: wlib.position) => Promise<readonly Recorded[]>
  /** The entries recorded with the facts, effect by effect (DOM-14). */
  readonly outbox: wlib.Outbox
  /** The paths and versions of the facts and the entries it keeps, distinct (DOM-22). */
  readonly stored_versions: wlib.StoredVersions
  /** The state of the effect executors: positions per effect, dead letters, shown to a test. */
  readonly executor: wlib.ExecutorState
  /** The state of the consumers of the reactions: positions per reaction, dead letters, shown to a test. */
  readonly reactions: wlib.ReactionState
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

/** What a branch writes, recorded on a state: its writes in the order of its parts, its fact, its entries. */
const record =
  (cell: Cell) =>
  (state: State) =>
  (written: wlib.PlannedWrite<Write>): void => {
    cell.record({
      fact: written.fact,
      entries: written.entries,
      state: written.writes.reduce<State>(
        (before, write) => ({ ...before, ...write(before) }),
        state,
      ),
    })
  }

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
    record(cell)(state)(branch)
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

/**
 * The comparison with a step's cursor (DOM-20): a candidate after the order
 * key, the first field that differs deciding, a descending one reversed, in
 * the value order of LIB-9.
 */
const after =
  <state, candidate>(
    key: readonly wlib.OrderKeyValue<Field<state, candidate>>[],
  ): Selection<state, candidate> =>
  (state) =>
  (candidate) =>
    (key
      .map(
        ({ field, direction, value }) =>
          (direction === 'ascending' ? 1 : -1) * compare_values(field(state)(candidate), value),
      )
      .find((comparison) => comparison !== 0) ?? 0) > 0

/**
 * A step in one state (DOM-20, D112.2): the process read; not found, nothing
 * writes; else the instances after the cursor, in order, and the first on
 * which a branch of the transition holds writes that branch, those before it
 * passed over; none left, the closing writes. The oracle filters every
 * instance: `passing_over` is SQL's, which reads one at a time.
 */
const execute_step =
  (cell: Cell) =>
  <candidate>(
    plan: wlib.PlannedStep<
      Fragment,
      Write,
      ProcessRead<State>,
      Selection<State, candidate>,
      Source<State, candidate>,
      Field<State, candidate>
    >,
  ): Promise<wlib.StepExecution> => {
    const state = cell.get()
    const choice = plan.choose(plan.read(state))
    if (choice.choice === 'not_found') {
      return Promise.resolve<wlib.StepExecution>({ outcome: 'not_found' })
    }
    const advancing = entries_on(choice.instances)(state).flatMap(({ entry }) => {
      const branches = choice.advances(entry)
      const applied = branches.findIndex((branch) => branch.condition(state))
      const branch = branches[applied]
      return branch === undefined ? [] : [{ instance: entry, applied, branch }]
    })[0]
    if (advancing === undefined) {
      record(cell)(state)(choice.completes)
      return Promise.resolve<wlib.StepExecution>({
        outcome: 'completed',
        position: cell.position(),
      })
    }
    record(cell)(state)(advancing.branch)
    return Promise.resolve<wlib.StepExecution>({
      outcome: 'advanced',
      instance: advancing.instance,
      branch: advancing.applied,
      position: cell.position(),
    })
  }

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
 * after it that the fact touches (its identity among the resources of a part) is
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
      recorded.fact.parts.some((part) =>
        part.resources.some(
          (resource) => resource.path === plan.identity.path && resource.value === identity,
        ),
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
 * Whether a fact is of the domain whose registry is given: a fact is of one
 * domain (DOM-8), so any of its parts tells.
 */
const is_of_the_domain =
  (registry: wlib.Registry) =>
  (recorded: Recorded): boolean =>
    recorded.fact.parts.some((part) => part.path in registry)

/**
 * A stream from a position: the events of the facts kept from there, then
 * "caught up", then the events of each new fact; or "position no longer
 * available", when the cell keeps that position no longer. Only the facts of
 * the query's domain, as if it had a log of its own (DOM-8, D64.3): the
 * cell keeps every domain's, and a fact of `loans` holding the drill's id
 * would otherwise touch the drill in `tools`' catalogue (A, 16 Nov 2026 (6)).
 */
const stream =
  (cell: Cell) =>
  (registry: wlib.Registry) =>
  <candidate>(plan: Plan<candidate>) =>
  (from: wlib.position): AsyncIterable<Event> => {
    const events = (recorded: Recorded): readonly Event[] =>
      is_of_the_domain(registry)(recorded) ? events_of(plan)(recorded) : []
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

/**
 * The fact log of the cell (DOM-17): every fact of every domain, since the
 * oracle keeps them in one value; a consumer skips the paths it does not
 * read. The facts kept from a position, then "caught up", then each new one.
 */
const log =
  (cell: Cell): wlib.FactLog =>
  (from) => {
    async function* live(position: wlib.position): AsyncGenerator<wlib.LogEvent> {
      const recorded = await cell.after(position)
      yield* recorded.map((fact): wlib.LogEvent => ({
        event: 'fact',
        position: fact.position,
        fact: fact.fact,
      }))
      yield* live(recorded.at(-1)?.position ?? position)
    }
    async function* from_history(): AsyncGenerator<wlib.LogEvent> {
      const history = cell.history(from)
      if (history.history === 'forgotten') {
        yield { event: 'position_unavailable' }
        return
      }
      yield* history.recorded.map((fact): wlib.LogEvent => ({
        event: 'fact',
        position: fact.position,
        fact: fact.fact,
      }))
      yield { event: 'caught_up', position: history.position }
      yield* live(history.position)
    }
    return from_history()
  }

/**
 * The oracle streams every query natively: its stream is exact, state before
 * and after each fact, over the facts of the query's domain.
 */
const native = (cell: Cell) => (registry: wlib.Registry) =>
  ({ strategy: 'native', stream: stream(cell)(registry) }) as const

export const memory_adapter = (cell: Cell) => (versions: wlib.Versions) => ({
  log: log(cell),
  tools: {
    ...wlib.command_use_case_ports({
      registry: tools_registry,
      versions,
      use_cases: {
        add_a_tool,
        retire_a_tool,
        send_a_tool_to_repair,
        put_a_repaired_tool_back_in_service,
      },
    })({
      algebra: algebra(tools_fragments),
      write: tools_writes,
      execute: execute(cell),
    }),
    ...wlib.read_use_case_ports({
      registry: tools_registry,
      versions,
      use_cases: { the_catalogue },
    })({
      algebra: tool_selection,
      sources: tool_sources,
      read: read(cell),
      streams: { the_catalogue: native(cell)(tools_registry) },
    }),
  },
  loans: {
    ...wlib.command_use_case_ports({
      registry: loans_registry,
      versions,
      use_cases: {
        borrow_a_tool,
        reserve_a_tool,
        return_a_tool,
        remind_the_member_of_the_due_date,
        declare_the_loan_overdue,
        cancel_the_reservations_of_a_tool,
        continue_the_cancellation_of_reservations,
        notify_the_members_of_a_repair,
        continue_the_repair_notice_round,
      },
    })({
      algebra: algebra(loans_fragments),
      write: loans_writes,
      execute: execute(cell),
      steps: {
        selection: { ...reservation_selection, after },
        sources: reservation_steps,
        execute: execute_step(cell),
      },
    }),
    ...wlib.read_use_case_ports({
      registry: loans_registry,
      versions,
      use_cases: { the_ongoing_loans_of_a_member },
    })({
      algebra: loan_selection,
      sources: loan_sources,
      read: read(cell),
      streams: { the_ongoing_loans_of_a_member: native(cell)(loans_registry) },
    }),
    ...wlib.read_use_case_ports({
      registry: loans_registry,
      versions,
      use_cases: { the_reservations_of_a_member },
    })({
      algebra: reservation_selection,
      sources: reservation_sources,
      read: read(cell),
      streams: { the_reservations_of_a_member: native(cell)(loans_registry) },
    }),
  },
  accounts: wlib.lookup_ports({
    registry: accounts_registry,
    lookups: { the_hats_of_an_account, the_member_card_of_an_account },
  })(accounts_lookups(cell.get)),
})
