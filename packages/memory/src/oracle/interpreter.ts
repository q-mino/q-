// The reference interpreter of q- (V10, TST-2): what a command and a read
// mean, over the state of a cell, with the interpreter rules (LIB-9,
// DOM-17). Generic over the state: each domain's module gives its fragments,
// its sources and its writes, from its `dsl` (DOM-5). On the model of Shed's
// (`test/shed/adapter/memory/index.ts`), which is a test tree's and stays
// apart (LIB-2): this one is q-'s, and runs in the `memory` stack.

import * as zz from '@q-mino/domains/library'
import type { CommandCell, ReadCell, Recorded } from './cell.ts'

/** A condition, read on the state. */
export type Fragment<state> = (state: state) => boolean

/** A fact's write: the part of the state it changes. */
export type Write<state> = (state: state) => Partial<state>

/** A selection predicate: a condition over a candidate of its subject (DOM-18). */
export type Selection<state, candidate> = (state: state) => (candidate: candidate) => boolean

/** Where a query's candidates are. */
export type Source<state, candidate> = (state: state) => readonly candidate[]

/** How a field of an entry reads from a candidate. */
export type Field<state, candidate> = (state: state) => (candidate: candidate) => unknown

/** AND, OR, NOT over the conditions of a command, and its predicates' fragments. */
export const algebra = <state, fragments>(predicate: fragments) => ({
  predicate,
  and:
    (components: readonly Fragment<state>[]): Fragment<state> =>
    (state) =>
      components.every((component) => component(state)),
  or:
    (components: readonly Fragment<state>[]): Fragment<state> =>
    (state) =>
      components.some((component) => component(state)),
  not:
    (operand: Fragment<state>): Fragment<state> =>
    (state) =>
      !operand(state),
})

/** AND, OR, NOT over the selections of one subject. */
export const selection_operators = <state, candidate>() => ({
  and:
    (components: readonly Selection<state, candidate>[]): Selection<state, candidate> =>
    (state) =>
    (candidate) =>
      components.every((component) => component(state)(candidate)),
  or:
    (components: readonly Selection<state, candidate>[]): Selection<state, candidate> =>
    (state) =>
    (candidate) =>
      components.some((component) => component(state)(candidate)),
  not:
    (operand: Selection<state, candidate>): Selection<state, candidate> =>
    (state) =>
    (candidate) =>
      !operand(state)(candidate),
})

/** A state after a fact's writes, in the order of its parts (DOM-10). */
const after_writes =
  <state>(state: state) =>
  (writes: readonly Write<state>[]): state =>
    writes.reduce<state>((before, write) => ({ ...before, ...write(before) }), state)

/** The fact an operation already recorded, as the duplicate branch gives it back (DOM-11). */
const already_recorded = <state>(recorded: Recorded<state>): zz.AlreadyRecorded => ({
  outcome: 'recorded',
  position: recorded.position,
  fact: recorded.fact,
})

/** The fact an operation recorded, looked up alone (PER-5): the duplicate branch read before anything is parsed. */
export const recorded =
  <state>(cell: CommandCell<state>): zz.RecordedBy =>
  (operation) => {
    const found = cell.recorded_by(operation)
    return Promise.resolve(found === undefined ? undefined : already_recorded(found))
  }

type Branch<state> = zz.PlannedCommandBranch<Fragment<state>, Write<state>>

/** The branch of the transition each element of a list applies, the first that holds, -1 where none does (SC-54). */
const chosen =
  <state>(state: state) =>
  (branch: Branch<state>): readonly number[] =>
    'elements' in branch
      ? branch.elements.map((element) => element.findIndex((each) => each.condition(state)))
      : []

/** A branch holds: its condition, and, over a list, a branch of the transition on every element (SC-54). */
const holds =
  <state>(state: state) =>
  (branch: Branch<state>): boolean =>
    branch.condition(state) && chosen(state)(branch).every((index) => index !== -1)

/** What a branch writes: a plain branch its own, a branch over a list the library's from the choice (SC-54). */
const written = <state>(
  branch: Branch<state>,
  elements: readonly number[],
): zz.PlannedWrite<Write<state>> => ('elements' in branch ? branch.applies(elements) : branch)

/** Every leaf of a branch: its own, then, over a list, each element's branches' (SC-54). */
const leaves = <state>(branch: Branch<state>): readonly Fragment<state>[] => [
  ...branch.leaves,
  ...('elements' in branch
    ? branch.elements.flatMap((element) => element.flatMap((each) => each.leaves))
    : []),
]

/**
 * A serial writer (DOM-9): the operation looked up, then every branch and
 * every leaf read on one state; the first branch that holds writes; if none
 * does, the leaves name the failures. Nothing awaits between the reads and
 * the write: the outcomes of a serial order, by construction (SC-11). An
 * interpreter rule: the oracle never awaits inside an execution.
 */
export const execute =
  <state>(cell: CommandCell<state>): zz.Execute<Fragment<state>, Write<state>> =>
  (plan) => {
    const found = cell.recorded_by(plan.operation)
    if (found !== undefined) {
      return Promise.resolve<zz.Execution>(already_recorded(found))
    }
    const state = cell.get()
    const applied = plan.branches.findIndex(holds(state))
    const branch = plan.branches[applied]
    if (branch === undefined) {
      return Promise.resolve<zz.Execution>({
        outcome: 'rejected',
        leaves: plan.branches.map((planned) => leaves(planned).map((leaf) => leaf(state))),
      })
    }
    const elements = chosen(state)(branch)
    const write = written(branch, elements)
    cell.record({
      fact: write.fact,
      entries: write.entries,
      state: after_writes(state)(write.writes),
    })
    return Promise.resolve<zz.Execution>({
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
 * The value order of LIB-9, an interpreter rule the other adapters and the
 * UI follow: an absent value after any value, false before true, numbers by
 * value, text by code point. Ascending; a descending field reverses it.
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
 * The comparison with a cursor, a page's (SC-22): a candidate after the
 * order key, the first field that differs deciding, a descending one
 * reversed, in the value order of LIB-9.
 */
export const after =
  <state, candidate>(
    key: readonly zz.OrderKeyValue<Field<state, candidate>>[],
  ): Selection<state, candidate> =>
  (state) =>
  (candidate) =>
    (key
      .map(
        ({ field, direction, value }) =>
          (direction === 'ascending' ? 1 : -1) * compare_values(field(state)(candidate), value),
      )
      .find((comparison) => comparison !== 0) ?? 0) > 0

/** A planned query over the candidates of one subject, its actions' leaves as command fragments (SC-33). */
type Plan<state, candidate> = zz.PlannedQuery<
  Selection<state, candidate>,
  Source<state, candidate>,
  Field<state, candidate>,
  Fragment<state>
>

/** An entry with its identity, read from its identity field. */
interface Identified {
  readonly identity: unknown
  readonly entry: Readonly<Record<string, unknown>>
}

/**
 * The entries of a query on a state: the candidates of the source that the
 * selection keeps, in the order (the identity closes it), each as the entry
 * of its fields, and its actions' values, if any, as one more field (SC-33).
 */
const entries_on =
  <state, candidate>(plan: Plan<state, candidate>) =>
  (state: state): readonly Identified[] => {
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
export const read =
  <state>(cell: ReadCell<state>) =>
  <candidate>(plan: Plan<state, candidate>) =>
    Promise.resolve({
      entries: entries_on(plan)(cell.get()).map((identified) => identified.entry),
      position: cell.position(),
    })

/** A page on one state (SC-22): the entries the page's selection keeps, at most `limit`; the total; the position. */
export const page =
  <state>(cell: ReadCell<state>) =>
  <candidate>(
    plan: zz.PlannedPage<
      Selection<state, candidate>,
      Source<state, candidate>,
      Field<state, candidate>,
      Fragment<state>
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

type Event = zz.StreamEvent<zz.StoredEnvelope, unknown, unknown>

/** Whether two values are the same, field by field and deeply (an interpreter rule, SC-19). */
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

/** Whether a fact is of the domain whose registry is given: a fact is of one domain (DOM-8). */
const is_of_the_domain =
  (registry: zz.Registry) =>
  <state>(recorded: Recorded<state>): boolean =>
    recorded.fact.parts.some((part) => part.path in registry)

/**
 * The events of a fact for a query, the semantics of a stream (DOM-17, V10):
 * the entries before and after the fact, compared by identity and value. An
 * entry kept after it that the fact touches is the fact; one that stays
 * untouched and is no longer the same changed; one that appears untouched
 * entered; one that disappears left, touched or not. Interpreter rule: the
 * events of one fact come in the order of the entries after it, then those
 * that left, in their order before it.
 */
const events_of =
  (registry: zz.Registry) =>
  <state, candidate>(plan: Plan<state, candidate>) =>
  (recorded: Recorded<state>): readonly Event[] => {
    const before = entries_on(plan)(recorded.before)
    const after_it = entries_on(plan)(recorded.after)
    const before_it = (identity: unknown): Identified | undefined =>
      before.find((identified) => identified.identity === identity)
    const among_after = (identity: unknown): boolean =>
      after_it.some((identified) => identified.identity === identity)
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
      ...after_it.flatMap((identified): readonly Event[] =>
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
 * A stream from a position: the events of the facts kept from there, then
 * "caught up", then the events of each new fact; or "position no longer
 * available", when the cell keeps that position no longer (DOM-17).
 */
const stream =
  <state>(cell: ReadCell<state>) =>
  (registry: zz.Registry) =>
  <candidate>(plan: Plan<state, candidate>) =>
  (from: zz.position): AsyncIterable<Event> => {
    const events = events_of(registry)(plan)
    async function* live(position: zz.position): AsyncGenerator<Event> {
      const given = await cell.after(position)
      yield* given.flatMap(events)
      yield* live(given.at(-1)?.position ?? position)
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
 * The fact log of the cell (DOM-17): every fact of every domain of the node,
 * kept in one value; a consumer skips the paths it does not read. The facts
 * kept from a position, then "caught up", then each new one.
 */
export const log =
  <state>(cell: ReadCell<state>): zz.FactLog =>
  (from) => {
    const as_event = (fact: Recorded<state>): zz.LogEvent => ({
      event: 'fact',
      position: fact.position,
      fact: fact.fact,
    })
    async function* live(position: zz.position): AsyncGenerator<zz.LogEvent> {
      const given = await cell.after(position)
      yield* given.map(as_event)
      yield* live(given.at(-1)?.position ?? position)
    }
    async function* from_history(): AsyncGenerator<zz.LogEvent> {
      const history = cell.history(from)
      if (history.history === 'forgotten') {
        yield { event: 'position_unavailable' }
        return
      }
      yield* history.recorded.map(as_event)
      yield { event: 'caught_up', position: history.position }
      yield* live(history.position)
    }
    return from_history()
  }

/** The oracle streams a query natively: exact, the state before and after each fact of the cell. */
export const native =
  <state>(cell: ReadCell<state>) =>
  (registry: zz.Registry) =>
    ({ strategy: 'native', stream: stream(cell)(registry) }) as const

/** A query streamed by the library over the oracle's reads and its fact log (DOM-2), compared with the native stream (D69.3). */
export const composed = <state>(cell: ReadCell<state>) =>
  ({ strategy: 'composed', log: log(cell) }) as const

/** How the oracle's read ports stream: natively, the reference, or composed by the library over its log. */
export type Strategy = 'native' | 'composed'
