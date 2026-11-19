import type { Resource } from './envelope.ts'
import { is_a_record } from './runtime.ts'
import type { ReadFailure } from './state_adapter.ts'
import type { TracedFailure } from './trace.ts'

// What the durable consumers share (DOM-14, DOM-16; parts 7.2, 7.3): the
// effect executor and the consumers of the reactions hold, per resource,
// what follows a dead letter (SC-42, SC-53), and serve an operator from the
// unit that delivers, between two deliveries. Mechanisms of no kind: they
// know resources, held items and requests, never a domain.

/** Whether two lists of resources share one, by path and value (DOM-10). */
export const share =
  (some: readonly Resource[]) =>
  (others: readonly Resource[]): boolean =>
    some.some((one) => others.some((other) => one.path === other.path && one.value === other.value))

/** What a consumer holds, an ADT: a dead letter, or an item waiting behind one. */
export interface HeldItem {
  readonly held: 'dead_letter' | 'waiting'
}

/**
 * The items waiting that go on once a letter is resolved (SC-42, SC-53): in
 * the order the state keeps them, each one that no dead letter holds and
 * that shares no resource with an item waiting before it, gone on or not, so
 * that the order per resource holds among them too.
 */
export const freed_in =
  <held extends HeldItem>(resources_of: (each: held) => readonly Resource[]) =>
  (held: readonly held[]): readonly Extract<held, { readonly held: 'waiting' }>[] => {
    const letters = held.flatMap((each) => (each.held === 'dead_letter' ? resources_of(each) : []))
    return held
      .filter(
        (each): each is Extract<held, { readonly held: 'waiting' }> => each.held === 'waiting',
      )
      .reduce<{
        readonly ahead: readonly Resource[]
        readonly freed: readonly Extract<held, { readonly held: 'waiting' }>[]
      }>(
        (walked, each) => ({
          ahead: [...walked.ahead, ...resources_of(each)],
          freed:
            share(letters)(resources_of(each)) || share(walked.ahead)(resources_of(each))
              ? walked.freed
              : [...walked.freed, each],
        }),
        { ahead: [], freed: [] },
      ).freed
  }

/** A request of an operator, served by its unit (SC-42, SC-53); refused if the unit has stopped. */
interface Asked {
  readonly serve: () => Promise<void>
  readonly refuse: (error: Error) => void
}

/**
 * A unit as an operator reaches it (SC-42, SC-53): what is asked of one of
 * its letters, served between two deliveries, so that the unit delivers one
 * item at a time, in its own order; and why it no longer serves.
 */
export interface Lane {
  readonly asked: Asked[]
  wake: () => void
  closed: Error | undefined
}

/** The lanes of a consumer's units, one per unit, by its name (an effect's path, a reaction's). */
export const lanes_of = (units: readonly string[]) => {
  const lanes = new Map<string, Lane>(
    units.map((unit) => [unit, { asked: [], wake: () => undefined, closed: undefined }]),
  )
  return {
    lanes,
    /** A lane's next request: woken when an operator asks. */
    asked_on: (lane: Lane): Promise<'asked'> =>
      new Promise((resolve) => {
        lane.wake = () => {
          resolve('asked')
        }
      }),
    /**
     * What an operator asks of a letter, served by its unit between two
     * deliveries; refused once the unit has stopped or fallen; `undefined`
     * for a unit the consumer does not run.
     */
    served: <answer>(unit: string, ask: () => Promise<answer>): Promise<answer> | undefined => {
      const lane = lanes.get(unit)
      if (lane === undefined) return undefined
      if (lane.closed !== undefined) return Promise.reject(lane.closed)
      return new Promise<answer>((resolve, refuse) => {
        lane.asked.push({ serve: () => ask().then(resolve, refuse), refuse })
        lane.wake()
      })
    },
    /** A unit closed, stopped or fallen: what is asked of it from now on is refused, with why. */
    close: (lane: Lane, closed: Error): void => {
      lane.closed = closed
      for (const ask of lane.asked.splice(0)) ask.refuse(closed)
    },
  }
}

/** Whether a value is a stream of events, as a port gives them. */
const is_a_stream = (value: unknown): value is AsyncIterable<unknown> =>
  typeof value === 'object' && value !== null && Symbol.asyncIterator in value

/** A command use case's outcome: the first event of its port's stream (DOM-2). */
export const outcome_of = async (events: unknown): Promise<unknown> => {
  if (!is_a_stream(events)) throw new Error("a use case's port gives no stream of events (DOM-2)")
  for await (const event of events) return event
  throw new Error("a use case's port gave no outcome (DOM-2)")
}

/**
 * What a rejection names (DOM-6), as the library knows it at runtime: the
 * predicates, by their paths, as the trace of a tree names them
 * (`TracedFailure`); a step's read, by its path (`ReadFailure`, DOM-20). A
 * dead letter is of no domain's type.
 */
export const failures_of = (failures: unknown): readonly (TracedFailure | ReadFailure)[] =>
  Array.isArray(failures)
    ? failures.flatMap((failure: unknown): readonly (TracedFailure | ReadFailure)[] => {
        if (!is_a_record(failure)) return []
        const { branch, components, predicate, read } = failure
        if (typeof read === 'string') return [{ read }]
        if (typeof predicate !== 'string' || !Array.isArray(components)) return []
        return [
          {
            ...(typeof branch === 'string' ? { branch } : {}),
            components: components.filter((name: unknown) => typeof name === 'string'),
            predicate,
          },
        ]
      })
    : []

/** The predicates a rejection names, by their paths: a return's, which no step is (DOM-13). */
export const predicates_of = (failures: unknown): readonly TracedFailure[] =>
  failures_of(failures).flatMap((failure) => ('predicate' in failure ? [failure] : []))
