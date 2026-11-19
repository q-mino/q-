// A sketch of the in-memory state adapter, the oracle of the shed and its
// reference interpreter (TST-2, V10):
// one module per domain, the state of every domain in one value, one command
// at a time. The links between domains are typed in the modules (`loans.ts`
// imports `tools.ts`), and their imports are the graph of who reads whom.
// It runs over the library as the library's parts give it bodies: the
// commands since part 4.1, the snapshots of the reads since 5.1.
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
import type * as tools_fact from '../../business/tools/_fact.ts'
import type * as loans_fact from '../../business/loans/_fact.ts'
import {
  the_hats_of_an_account,
  the_hats_of_a_key,
  the_member_card_of_an_account,
} from '../../auth/accounts/_lookup.ts'
import { accounts_lookups, type AccountsState } from './accounts.ts'
import {
  add_a_tool,
  close_a_repair,
  put_a_repaired_tool_back_in_service,
  rename_a_tool,
  retire_a_tool,
  send_a_tool_to_repair,
  load_the_tools_of_a_sheet,
  load_the_tools_of_a_short_sheet,
  continue_the_loading_of_a_sheet,
  the_catalogue,
} from '../../business/tools/_usecase.ts'
import {
  begin_a_weekly_summary,
  borrow_a_tool,
  lend_a_booked_tool,
  cancel_the_reservations_of_a_tool,
  continue_the_cancellation_of_reservations,
  continue_the_repair_notice_round,
  declare_the_loan_overdue,
  notify_the_members_of_a_repair,
  remind_the_member_of_the_due_date,
  reserve_a_tool,
  return_a_tool,
  sum_up_the_week_for_the_member,
  the_ongoing_loans_of_a_member,
  the_reservations_of_a_member,
  the_reservations_of_a_member_in_the_workshop,
  the_loans_of_each_tool_this_month,
} from '../../business/loans/_usecase.ts'
import {
  correct_the_tool_of_a_loan,
  extend_the_loan,
} from '../../business/loans/an_ongoing_loan/_usecase.ts'
import type { Field, ProcessRead, Selection, Source } from './fragments.ts'
import {
  loan_selection,
  loan_sources,
  loans_fragments,
  loans_writes,
  reservation_selection,
  reservation_sources,
  reservation_steps,
  tool_calculation as loans_tool_calculation,
  tool_selection as loans_tool_selection,
  tool_sources as loans_tool_sources,
  type LoansState,
} from './loans.ts'
import {
  line_selection,
  line_steps,
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
  /**
   * The fact an operation recorded, at its position: kept as long as the
   * operations are (DOM-11), whatever the history keeps (SC-11).
   */
  readonly recorded_by: (operation: wlib.Operation) => Recorded | undefined
  /** The entries recorded with the facts, effect by effect (DOM-14). */
  readonly outbox: wlib.Outbox
  /** The paths and versions of the facts and the entries it keeps, distinct (DOM-22). */
  readonly stored_versions: wlib.StoredVersions
  /** The state of the effect executors: positions per effect, the entries each holds (SC-53), shown to a test. */
  readonly executor: wlib.ExecutorState
  /**
   * The state of the consumers of the reactions: positions per reaction, the
   * parts each holds (its dead letters and the parts waiting behind them,
   * SC-42), the letters discarded; shown to a test.
   */
  readonly reactions: wlib.ReactionState
}

/**
 * What the commands need of the cell: its state, recording a step, its
 * position, the fact an operation recorded (DOM-11). The harness of the
 * scenarios gives it alone while the reads, the executors and the consumers
 * have no body (`scenarios/oracle.ts`).
 */
export type CommandCell = Pick<Cell, 'get' | 'record' | 'position' | 'recorded_by'>

/**
 * What the reads need of the cell: its state and its position, for a
 * snapshot; the facts it recorded from a position on, and after it, for a
 * stream (DOM-17). The harness of the scenarios gives it beside the
 * commands' (part 5.1).
 */
export type ReadCell = Pick<Cell, 'get' | 'position' | 'history' | 'after'>

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

/** A state after a fact's writes, in the order of its parts (DOM-10). */
const after_writes =
  (state: State) =>
  (writes: readonly Write[]): State =>
    writes.reduce<State>((before, write) => ({ ...before, ...write(before) }), state)

/** What a branch writes, recorded on a state: its writes in the order of its parts, its fact, its entries. */
const record =
  (cell: CommandCell) =>
  (state: State) =>
  (planned: wlib.PlannedWrite<Write>): void => {
    cell.record({
      fact: planned.fact,
      entries: planned.entries,
      state: after_writes(state)(planned.writes),
    })
  }

/**
 * The oracle's state rebuilt from a log (DOM-22, A, 17 Nov 2026; SC-8), as
 * the SQL adapter rebuilds its tables: from a state with nothing, every fact
 * the log keeps written again through the writes of the commands, each at
 * the current shape the library gives (`wlib.replay`), so that a loan lent
 * at `loans` 1.x, due at an instant, comes back due on that instant's day;
 * no value is rewritten by hand. It gives the state after each fact, at its
 * position, for the cell to keep beside the fact as it was stored: the log
 * is never rewritten.
 */
export const rebuilt = (versions: wlib.Versions) => (nothing: State) =>
  async function* (
    log: wlib.FactLog,
  ): AsyncGenerator<{ readonly position: wlib.position; readonly state: State }> {
    let state = nothing
    for await (const fact of wlib.replay<
      wlib.FactsIn<typeof tools_fact> | wlib.FactsIn<typeof loans_fact>,
      Write
    >({ versions, writes: { ...tools_writes, ...loans_writes } })(log)) {
      state = after_writes(state)(fact.writes)
      yield { position: fact.position, state }
    }
  }

/** The fact an operation already recorded, as the duplicate branch gives it back (DOM-11). */
const already_recorded = (recorded: Recorded): wlib.AlreadyRecorded => ({
  outcome: 'recorded',
  position: recorded.position,
  fact: recorded.fact,
})

/**
 * The branch of the transition each element of a list applies, the first
 * whose condition holds on the state, -1 where none does (SC-54): none for a
 * plain branch.
 */
const chosen =
  (state: State) =>
  (branch: wlib.PlannedCommandBranch<Fragment, Write>): readonly number[] =>
    'elements' in branch
      ? branch.elements.map((element) => element.findIndex((each) => each.condition(state)))
      : []

/** A branch holds: its condition, and, over a list, a branch of the transition on every element (SC-54). */
const holds =
  (state: State) =>
  (branch: wlib.PlannedCommandBranch<Fragment, Write>): boolean =>
    branch.condition(state) && chosen(state)(branch).every((index) => index !== -1)

/** What a branch writes: a plain branch its own, a branch over a list the library's from the choice (SC-54). */
const written = (
  branch: wlib.PlannedCommandBranch<Fragment, Write>,
  elements: readonly number[],
): wlib.PlannedWrite<Write> => ('elements' in branch ? branch.applies(elements) : branch)

/** Every leaf of a branch: its own, then, over a list, each element's branches' (SC-54). */
const leaves = (branch: wlib.PlannedCommandBranch<Fragment, Write>): readonly Fragment[] => [
  ...branch.leaves,
  ...('elements' in branch
    ? branch.elements.flatMap((element) => element.flatMap((each) => each.leaves))
    : []),
]

/**
 * A serial writer (DOM-9): the operation looked up, then every branch and
 * every leaf read on one state; the first branch that holds writes; if none
 * does, the leaves name the failures. Over a list, each element applies the
 * first branch of the transition that holds on the state before the
 * command, with no combination between the elements (SC-54, D113.1). Nothing awaits between the reads and
 * the write, so two commands sent at the same instant run one after the
 * other, in the order the event loop takes them: the outcomes of a serial
 * order, by construction (SC-11). An interpreter rule: the oracle never
 * awaits inside an execution.
 */
const execute =
  (cell: CommandCell): wlib.Execute<Fragment, Write> =>
  (plan) => {
    const recorded = cell.recorded_by(plan.operation)
    if (recorded !== undefined) {
      return Promise.resolve<wlib.Execution>(already_recorded(recorded))
    }
    const state = cell.get()
    const applied = plan.branches.findIndex(holds(state))
    const branch = plan.branches[applied]
    if (branch === undefined) {
      return Promise.resolve<wlib.Execution>({
        outcome: 'rejected',
        leaves: plan.branches.map((planned) => leaves(planned).map((leaf) => leaf(state))),
      })
    }
    const elements = chosen(state)(branch)
    record(cell)(state)(written(branch, elements))
    return Promise.resolve<wlib.Execution>({
      outcome: 'applied',
      branch: applied,
      elements,
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
 * true, numbers by value, text by code point. Ascending; a descending field
 * reverses it, so an absent value comes first there. Its cases in
 * `order.test.ts`, since no query of Shed orders by a field that may be
 * absent, or by a boolean.
 */
export const compare_values = (a: unknown, b: unknown): number =>
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
 * The comparison with a cursor, a step's (DOM-20) or a page's (SC-22): a
 * candidate after the order key, the first field that differs deciding, a
 * descending one reversed, in the value order of LIB-9.
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
 * A step in one state (DOM-20, D112.2), a serial writer as a command (SC-11):
 * the operation looked up; then the process read; not found, nothing
 * writes; else the instances after the cursor, in order, and the first on
 * which a branch of the transition holds writes that branch, those before it
 * passed over; none left, the closing writes. The oracle filters every
 * instance: `passing_over` is SQL's, which reads one at a time.
 */
const execute_step =
  (cell: CommandCell) =>
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
    const recorded = cell.recorded_by(plan.operation)
    if (recorded !== undefined) {
      return Promise.resolve<wlib.StepExecution>(already_recorded(recorded))
    }
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

/**
 * A planned query over the candidates of one subject; its actions' leaves,
 * if any, as command fragments (SC-33).
 */
type Plan<candidate> = wlib.PlannedQuery<
  Selection<State, candidate>,
  Source<State, candidate>,
  Field<State, candidate>,
  Fragment
>

/** An entry with its identity, read from its identity field. */
interface Identified {
  readonly identity: unknown
  readonly entry: Readonly<Record<string, unknown>>
}

/**
 * The entries of a query on a state: the candidates of the source that the
 * selection keeps, in the order (a descending field reverses the value
 * order; the identity closes it), each as the entry of its fields and, if
 * the plan has leaves of actions, their values on the same state, every one,
 * as one more field (SC-33).
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
        const read = Object.fromEntries(
          Object.entries(plan.fields).map(([name, field]) => [name, field(state)(candidate)]),
        )
        const entry =
          plan.leaves === undefined
            ? read
            : {
                ...read,
                [plan.leaves.field]: plan.leaves.of(read).map((condition) => condition(state)),
              }
        return { identity: entry[plan.identity.field], entry }
      })
  }

/** A read on one state: its entries and its position. */
const read =
  (cell: ReadCell) =>
  <candidate>(plan: Plan<candidate>) =>
    Promise.resolve({
      entries: entries_on(plan)(cell.get()).map((identified) => identified.entry),
      position: cell.position(),
    })

/**
 * A page on one state (SC-22): the entries the page's selection keeps, in the
 * order, at most `limit`; the total, how many the query's selection keeps;
 * and the position. One state, so the page and its total are one snapshot.
 */
const page =
  (cell: ReadCell) =>
  <candidate>(
    plan: wlib.PlannedPage<
      Selection<State, candidate>,
      Source<State, candidate>,
      Field<State, candidate>,
      Fragment
    >,
  ) => {
    const state = cell.get()
    return Promise.resolve({
      entries: entries_on({ ...plan, selection: plan.page })(state)
        .slice(0, plan.limit)
        .map((identified) => identified.entry),
      total: entries_on(plan)(state).length,
      position: cell.position(),
    })
  }

type Event = wlib.StreamEvent<wlib.StoredEnvelope, unknown, unknown>

/**
 * Whether two values are the same, field by field and deeply: how an entry
 * that stays is compared with itself before a fact (an interpreter rule,
 * SC-19).
 */
const same_value = (a: unknown, b: unknown): boolean => {
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
    return Object.is(a, b)
  }
  const other = new Map<string, unknown>(Object.entries(b))
  return (
    Array.isArray(a) === Array.isArray(b) &&
    Object.keys(a).length === other.size &&
    Object.entries(a).every(([key, value]) => other.has(key) && same_value(value, other.get(key)))
  )
}

/**
 * The events of a fact for a query, the semantics of a stream (DOM-17, V10):
 * the entries before and after the fact, compared by identity and value. An
 * entry kept after it that the fact touches (a fact of the query's domain,
 * its identity among the resources of a part) is the fact; one that stays
 * untouched and is no longer the same changed (a fact of `tools` renamed the
 * drill a loan's entry reads, SC-19); one that appears untouched entered; one
 * that disappears left, touched or not; an untouched entry that stays the
 * same gives nothing. Every fact of the log counts, of any domain: a query's
 * entries may read another domain's state (GR-3), and only `fact` carries the
 * fact, of the query's domain alone (DOM-8, D64.3). Interpreter rule: the
 * events of one fact come in the order of the entries after it, then those
 * that left, in their order before it.
 */
const events_of =
  (registry: wlib.Registry) =>
  <candidate>(plan: Plan<candidate>) =>
  (recorded: Recorded): readonly Event[] => {
    const before = entries_on(plan)(recorded.before)
    const after = entries_on(plan)(recorded.after)
    const before_it = (identity: unknown): Identified | undefined =>
      before.find((identified) => identified.identity === identity)
    const among_after = (identity: unknown): boolean =>
      after.some((identified) => identified.identity === identity)
    const touched = (identity: unknown): boolean =>
      is_of_the_domain(registry)(recorded) &&
      recorded.fact.parts.some((part) =>
        part.resources.some(
          (resource) => resource.path === plan.identity.path && resource.value === identity,
        ),
      )
    const untouched = (identified: Identified): readonly Event[] => {
      const was = before_it(identified.identity)
      const at = {
        position: recorded.position,
        identity: identified.identity,
        entry: identified.entry,
      }
      return was === undefined
        ? [{ event: 'entered', ...at }]
        : same_value(was.entry, identified.entry)
          ? []
          : [{ event: 'changed', ...at }]
    }
    return [
      ...after.flatMap((identified): readonly Event[] =>
        touched(identified.identity)
          ? [
              {
                event: 'fact',
                position: recorded.position,
                identity: identified.identity,
                fact: recorded.fact,
                entry: identified.entry,
              },
            ]
          : untouched(identified),
      ),
      ...before
        .filter(({ identity }) => !among_after(identity))
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
 * available", when the cell keeps that position no longer. Every fact of
 * the cell counts for what it changes of the entries; only a fact of the
 * query's domain touches one (`events_of`), so that a fact of `loans`
 * holding the drill's id does not touch the drill in `tools`' catalogue (A,
 * 16 Nov 2026 (6)), while a fact of `tools` that renames it changes Marta's
 * row of its loan (SC-19).
 */
const stream =
  (cell: ReadCell) =>
  (registry: wlib.Registry) =>
  <candidate>(plan: Plan<candidate>) =>
  (from: wlib.position): AsyncIterable<Event> => {
    const events = events_of(registry)(plan)
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
  (cell: ReadCell): wlib.FactLog =>
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
 * and after each fact of the cell.
 */
const native = (cell: ReadCell) => (registry: wlib.Registry) =>
  ({ strategy: 'native', stream: stream(cell)(registry) }) as const

/** The command use cases of `tools`, whose ports the oracle builds. */
export const tools_command_use_cases = {
  add_a_tool,
  retire_a_tool,
  send_a_tool_to_repair,
  put_a_repaired_tool_back_in_service,
  close_a_repair,
  rename_a_tool,
  load_the_tools_of_a_sheet,
  load_the_tools_of_a_short_sheet,
  continue_the_loading_of_a_sheet,
}

/** The command use cases of `loans`, whose ports the oracle builds. */
export const loans_command_use_cases = {
  borrow_a_tool,
  lend_a_booked_tool,
  extend_the_loan,
  correct_the_tool_of_a_loan,
  reserve_a_tool,
  return_a_tool,
  remind_the_member_of_the_due_date,
  declare_the_loan_overdue,
  cancel_the_reservations_of_a_tool,
  continue_the_cancellation_of_reservations,
  notify_the_members_of_a_repair,
  continue_the_repair_notice_round,
  begin_a_weekly_summary,
  sum_up_the_week_for_the_member,
}

/**
 * The oracle's state adapter for the commands of `tools` that run no step
 * (TST-2): the fragments of its predicates, the writes of its facts, the
 * execution.
 */
export const tools_command_adapter = (cell: CommandCell) => ({
  algebra: algebra(tools_fragments),
  write: tools_writes,
  execute: execute(cell),
})

/**
 * The oracle's state adapter for the commands of `loans` that run no step
 * (TST-2): the fragments of its predicates, over the state of `tools` too
 * (GR-3), the writes of its facts, the execution.
 */
export const loans_command_adapter = (cell: CommandCell) => ({
  algebra: algebra(loans_fragments),
  write: loans_writes,
  execute: execute(cell),
})

/**
 * The command ports of `tools` and `loans` over the oracle (TST-2): what
 * the scenarios of the commands run on (`scenarios/oracle.ts`).
 */
export const memory_commands = (cell: CommandCell) => (versions: wlib.Versions) => ({
  tools: wlib.command_use_case_ports({
    registry: tools_registry,
    versions,
    use_cases: tools_command_use_cases,
  })({
    ...tools_command_adapter(cell),
    // The loading of a sheet of tools walks its lines (SC-44): one
    // subject, its own selection.
    steps: {
      selection: { ...line_selection, after },
      sources: line_steps,
      execute: execute_step(cell),
    },
  }),
  loans: wlib.command_use_case_ports({
    // The facts of `loans` hold identities of `tools` (GR-3), whose paths
    // its registry gives.
    registry: { ...tools_registry, ...loans_registry },
    versions,
    use_cases: loans_command_use_cases,
  })({
    ...loans_command_adapter(cell),
    steps: {
      selection: { ...reservation_selection, after },
      sources: reservation_steps,
      execute: execute_step(cell),
    },
  }),
})

/**
 * The read ports of `tools` and `loans` over the oracle (TST-2), one subject
 * at a time (DOM-18): what the scenarios of the reads run on
 * (`scenarios/oracle.ts`). Every query streams natively; `loans` reads its
 * entries' identities of `tools` (`tool_id`), whose paths `tools`' registry
 * gives (`identities`, GR-3), its own registry the domain's, whose facts its
 * streams carry (DOM-17).
 */
export const memory_reads = (cell: ReadCell) => (versions: wlib.Versions) => ({
  tools: wlib.read_use_case_ports({
    registry: tools_registry,
    versions,
    use_cases: { the_catalogue },
  })({
    algebra: { ...tool_selection, after },
    sources: tool_sources,
    read: read(cell),
    page: page(cell),
    streams: { the_catalogue: native(cell)(tools_registry) },
  }),
  loans: {
    ...wlib.read_use_case_ports({
      registry: loans_registry,
      versions,
      use_cases: { the_ongoing_loans_of_a_member },
    })({
      algebra: { ...loan_selection, after },
      sources: loan_sources,
      read: read(cell),
      page: page(cell),
      streams: { the_ongoing_loans_of_a_member: native(cell)(loans_registry) },
      // The member's buttons on the rows of their loans (SC-33): the
      // commands' own fragments, on the state of the read (ADP-8).
      applicability: { the_ongoing_loans_of_a_member: loans_fragments },
    }),
    ...wlib.read_use_case_ports({
      registry: loans_registry,
      versions,
      use_cases: { the_reservations_of_a_member, the_reservations_of_a_member_in_the_workshop },
    })({
      algebra: { ...reservation_selection, after },
      sources: reservation_sources,
      read: read(cell),
      page: page(cell),
      streams: {
        the_reservations_of_a_member: native(cell)(loans_registry),
        the_reservations_of_a_member_in_the_workshop: native(cell)(loans_registry),
      },
    }),
    ...wlib.read_use_case_ports({
      registry: loans_registry,
      // The entry of a tool of the shed is named by `tools`' id (SC-21).
      identities: tools_registry,
      versions,
      use_cases: { the_loans_of_each_tool_this_month },
    })({
      algebra: { ...loans_tool_selection, after },
      calculations: loans_tool_calculation,
      sources: loans_tool_sources,
      read: read(cell),
      page: page(cell),
      streams: { the_loans_of_each_tool_this_month: native(cell)(loans_registry) },
    }),
  },
})

export const memory_adapter = (cell: Cell) => (versions: wlib.Versions) => {
  const commands = memory_commands(cell)(versions)
  const reads = memory_reads(cell)(versions)
  return {
    log: log(cell),
    tools: { ...commands.tools, ...reads.tools },
    loans: { ...commands.loans, ...reads.loans },
    accounts: wlib.lookup_ports({
      registry: accounts_registry,
      lookups: { the_hats_of_an_account, the_hats_of_a_key, the_member_card_of_an_account },
    })(accounts_lookups(cell.get)),
  }
}
