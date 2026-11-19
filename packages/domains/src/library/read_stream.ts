import type { position } from './format.ts'
import type { Envelope, PartFields, StoredEnvelope } from './envelope.ts'
import type { PlannedQuery } from './read_adapter.ts'
import type { FactLog, StreamEvent, StreamStrategy } from './stream.ts'
import { same_value } from './runtime.ts'

// The stream of a read use case (DOM-2, DOM-17, part 5.2), which the read
// port composes after its snapshot, or gives alone from a position (a
// resume): over the adapter's own stream (`native`), its events parsed; or
// composed by the library from the adapter's read and its fact log
// (`composed`), the query read again after each fact of the log and its
// entries compared with the previous ones by identity and value, as the
// oracle defines the events of a fact (DOM-17, V10). Internal: the read port
// is its one user.

/** A stream's event as the port gives it: the fact's parts parsed, at the current shape (DOM-22). */
export type RuntimeStreamEvent = StreamEvent<Envelope<readonly PartFields[]>, unknown, unknown>

/** An entry, parsed by the query's fields, with its identity, read from its identity field. */
interface Identified {
  readonly identity: unknown
  readonly entry: unknown
}

/** What a query's stream needs of its port, wired: its plan, the adapter's read, and how stored data is parsed. */
export interface StreamWiring<selection, source, field> {
  /** The use case's path, which a fault names. */
  readonly path: string
  readonly plan: PlannedQuery<selection, source, field, unknown>
  readonly read: (
    plan: PlannedQuery<selection, source, field, unknown>,
  ) => Promise<{ readonly entries: readonly unknown[]; readonly position: position }>
  /** An entry as stored, parsed by the fields read and calculated; one they do not parse is the adapter's fault. */
  readonly entry_of: (stored: unknown) => unknown
  /** An identity as stored, parsed by the schema of the identity field. */
  readonly identity_of: (stored: unknown) => unknown
  /** The identity of an entry already parsed. */
  readonly identity_in: (entry: unknown) => unknown
  /** Whether a fact as stored is of the query's domain: its parts' paths in the domain's registry, the same in every major (DOM-24). */
  readonly of_the_domain: (fact: StoredEnvelope) => boolean
  /** A fact of the domain as stored, its parts at the current shape (DOM-22): it stops (throws) on a version it does not know. */
  readonly envelope_of: (fact: StoredEnvelope) => Envelope<readonly PartFields[]>
}

/**
 * Whether a fact touches an entry (DOM-17): the entry's identity, by the
 * path of the query's identity, among the resources of one of its parts
 * (DOM-10), the resources as the part was written.
 */
export const touches =
  (identity_path: string) =>
  (fact: Envelope<readonly PartFields[]>) =>
  (identity: unknown): boolean =>
    fact.parts.some((part) =>
      part.resources.some(
        (resource) => resource.path === identity_path && resource.value === identity,
      ),
    )

/**
 * The events of one fact for a query, from the entries before it and after
 * it (DOM-17), as the oracle defines them (V10): an entry after it that the
 * fact touches, a fact of the query's domain, is the fact, with the entry; an
 * untouched one that was not there entered; an untouched one that stays and
 * is no longer the same, compared by value, changed (SC-19); one there before
 * and not after left, touched or not, its identity only; an untouched one
 * that stays the same gives nothing. In the order of the entries after it,
 * then those that left, in their order before it (the interpreter's order).
 * A fact of another domain (`fact` absent) touches no entry (D64.3), and
 * counts for what it changes of them (GR-3).
 */
const events_of =
  (identity_path: string) =>
  (
    at: position,
    fact: Envelope<readonly PartFields[]> | undefined,
    before: readonly Identified[],
    after: readonly Identified[],
  ): readonly RuntimeStreamEvent[] => {
    const before_it = new Map(before.map((each) => [each.identity, each.entry]))
    const after_it = new Set(after.map((each) => each.identity))
    const touched = fact === undefined ? () => false : touches(identity_path)(fact)
    return [
      ...after.flatMap(({ identity, entry }): readonly RuntimeStreamEvent[] => {
        if (fact !== undefined && touched(identity)) {
          return [{ event: 'fact', position: at, identity, fact, entry }]
        }
        if (!before_it.has(identity)) return [{ event: 'entered', position: at, identity, entry }]
        return same_value(before_it.get(identity), entry)
          ? []
          : [{ event: 'changed', position: at, identity, entry }]
      }),
      ...before
        .filter(({ identity }) => !after_it.has(identity))
        .map(({ identity }): RuntimeStreamEvent => ({ event: 'left', position: at, identity })),
    ]
  }

/** An event of the adapter's own stream, parsed: its entry, its identity, its fact's parts (DOM-22). */
const parsed =
  <selection, source, field>(wiring: StreamWiring<selection, source, field>) =>
  (event: StreamEvent<StoredEnvelope, unknown, unknown>): RuntimeStreamEvent => {
    switch (event.event) {
      case 'fact': {
        if (!wiring.of_the_domain(event.fact)) {
          throw new Error(
            `${wiring.path}: the adapter's stream gives a fact of another domain, ${event.fact.parts.map((part) => part.path).join(', ')}: a stream carries its domain's facts alone (DOM-17)`,
          )
        }
        return {
          event: 'fact',
          position: event.position,
          identity: wiring.identity_of(event.identity),
          fact: wiring.envelope_of(event.fact),
          entry: wiring.entry_of(event.entry),
        }
      }
      case 'entered':
      case 'changed':
        return {
          event: event.event,
          position: event.position,
          identity: wiring.identity_of(event.identity),
          entry: wiring.entry_of(event.entry),
        }
      case 'left':
        return {
          event: 'left',
          position: event.position,
          identity: wiring.identity_of(event.identity),
        }
      case 'caught_up':
      case 'position_unavailable':
        return event
    }
  }

/**
 * Whether an event is of the fact at a position, which a snapshot read at
 * that position already holds: `caught_up` is not, nor the terminal.
 */
const of_the_fact_at = (at: position | undefined) => (event: RuntimeStreamEvent) =>
  at !== undefined && event.event !== 'caught_up' && 'position' in event && event.position === at

/**
 * The adapter's own stream (`native`), from a position, inclusive, its events
 * parsed; after a snapshot, those of the fact at the snapshot's position
 * left out, which the snapshot holds (no double, D72). It ends after
 * `position_unavailable`, terminal.
 */
async function* native<selection, source, field>(
  wiring: StreamWiring<selection, source, field>,
  stream: Extract<
    StreamStrategy<selection, source, field, unknown>,
    { strategy: 'native' }
  >['stream'],
  from: position,
  after_a_snapshot: boolean,
): AsyncGenerator<RuntimeStreamEvent> {
  const held = of_the_fact_at(after_a_snapshot ? from : undefined)
  for await (const stored of stream(wiring.plan)(from)) {
    const event = parsed(wiring)(stored)
    if (held(event)) continue
    yield event
    if (event.event === 'position_unavailable') return
  }
}

/**
 * The stream composed by the library (`composed`), after a snapshot: the
 * fact log from the snapshot's position, inclusive, the fact at it left out
 * (the snapshot holds it); for each later fact of the log, of any domain, the
 * query read again and its entries compared with the previous ones (the
 * snapshot's first), the events of the fact (`events_of`); `caught_up` and
 * `position_unavailable` as the log gives them, the second terminal. A fact
 * delivered again is read again: nothing changed, and an entry it touches is
 * its `fact` again, at its position, which the consumer deduplicates (DOM-17).
 * An entry is as it is when read again, at least up to the fact's position:
 * one that a later fact changes may change on an earlier one, the state the
 * events rebuild the same (D69.3).
 */
async function* composed<selection, source, field>(
  wiring: StreamWiring<selection, source, field>,
  log: FactLog,
  snapshot: { readonly position: position; readonly entries: readonly unknown[] } | undefined,
): AsyncGenerator<RuntimeStreamEvent> {
  // A resume: the state before the position is gone (`stream_from`).
  if (snapshot === undefined) {
    yield { event: 'position_unavailable' }
    return
  }
  const identified = (entry: unknown): Identified => ({
    identity: wiring.identity_in(entry),
    entry,
  })
  const events = events_of(wiring.plan.identity.path)
  let previous = snapshot.entries.map(identified)
  for await (const logged of log(snapshot.position)) {
    switch (logged.event) {
      case 'fact': {
        if (logged.position === snapshot.position) break
        const fact = wiring.of_the_domain(logged.fact) ? wiring.envelope_of(logged.fact) : undefined
        const read = await wiring.read(wiring.plan)
        const next = read.entries.map((entry) => identified(wiring.entry_of(entry)))
        yield* events(logged.position, fact, previous, next)
        previous = next
        break
      }
      case 'caught_up':
        yield logged
        break
      case 'position_unavailable':
        yield logged
        return
    }
  }
}

/**
 * The stream of a query after its snapshot (DOM-2): the snapshot at P, then
 * the events from P, no gap and no double (D72), by the query's strategy.
 */
export const stream_after = <selection, source, field>(
  wiring: StreamWiring<selection, source, field>,
  strategy: StreamStrategy<selection, source, field, unknown>,
  snapshot: { readonly position: position; readonly entries: readonly unknown[] },
): AsyncIterable<RuntimeStreamEvent> =>
  strategy.strategy === 'native'
    ? native(wiring, strategy.stream, snapshot.position, true)
    : composed(wiring, strategy.log, snapshot)

/**
 * A resume (DOM-2, DOM-17): the stream alone from a position, inclusive,
 * which the consumer deduplicates by position and identity. A native stream
 * gives its events from there. A composed one cannot: it compares each read
 * with the one before, and the state before a position it did not read at
 * is gone, so it gives `position_unavailable`, terminal, and the consumer
 * reads again, then streams from the snapshot (D73.3): an entry that left
 * on a fact of another domain while the consumer was away would otherwise
 * stay on its screen (SC-20).
 */
export const stream_from = <selection, source, field>(
  wiring: StreamWiring<selection, source, field>,
  strategy: StreamStrategy<selection, source, field, unknown>,
  from: position,
): AsyncIterable<RuntimeStreamEvent> =>
  strategy.strategy === 'native'
    ? native(wiring, strategy.stream, from, false)
    : composed(wiring, strategy.log, undefined)
