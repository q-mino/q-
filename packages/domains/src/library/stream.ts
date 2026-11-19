import type { cursor, position } from './format.ts'
import type { StoredEnvelope } from './envelope.ts'
import type { Queries } from './query.ts'
import type { PlannedQuery } from './read_adapter.ts'

// Streams (DOM-17): a query read as a stream of facts, from a position (D64.3).
// An adapter's stream has no snapshot inside; the read use case composes the
// read at P and the stream from P (D72). A stream ends when its consumer
// stops, or on a terminal event.

/**
 * The outcome of a read, one page (SC-22): its entries, typed by the query's
 * entry; the position read at; how many entries the selection keeps there,
 * the total; and, if another page follows, its cursor (D72.4). A read whole
 * is one page: every entry, its count, no cursor.
 */
export interface Snapshot<entry> {
  readonly entries: readonly entry[]
  readonly position: position
  readonly total: number
  readonly next?: cursor
}

/**
 * The events of a stream, a closed ADT (DOM-3). Every event but the terminal
 * one carries the position of the fact that caused it; resume is inclusive,
 * so a consumer deduplicates by position and identity (DOM-17).
 * - `fact`: a fact of the query's domain touched a candidate that the
 *   selection keeps after it:
 *   the fact in its envelope, the entry as it is after it (D72). A candidate
 *   that comes in through a fact that touches it comes this way, not as
 *   `entered`.
 * - `entered`: a candidate the fact did not touch now satisfies the
 *   selection, because a selection predicate reads another instance: its entry.
 * - `changed`: a candidate the fact did not touch stays in the selection,
 *   and its entry is no longer the same, because a field reads another
 *   instance (`tool_name`, read from `tools`' catalogue): its entry (SC-19).
 * - `left`: a candidate, touched or not, no longer satisfies the selection:
 *   its identity only (D72.5).
 * - `caught_up`: the end of the historical part, once (D72.5).
 * - `position_unavailable`, terminal: the adapter no longer keeps the
 *   position; read the query again, then stream from its position (D73.3).
 */
export type StreamEvent<envelope, entry, identity> =
  | {
      readonly event: 'fact'
      readonly position: position
      readonly identity: identity
      readonly fact: envelope
      readonly entry: entry
    }
  | {
      readonly event: 'entered'
      readonly position: position
      readonly identity: identity
      readonly entry: entry
    }
  | {
      readonly event: 'changed'
      readonly position: position
      readonly identity: identity
      readonly entry: entry
    }
  | { readonly event: 'left'; readonly position: position; readonly identity: identity }
  | { readonly event: 'caught_up'; readonly position: position }
  | { readonly event: 'position_unavailable' }

/**
 * The adapter's stream of a planned query, from a position: the events with
 * the entries and the facts as stored (the library parses them with the
 * query's fields and, by path, the registry).
 */
export type Stream<selection, source, field, condition = never> = (
  plan: PlannedQuery<selection, source, field, condition>,
) => (from: position) => AsyncIterable<StreamEvent<StoredEnvelope, unknown, unknown>>

/**
 * An event of the fact log, an ADT: a fact recorded at its position; the end
 * of what was recorded when the log was opened, once; or, terminal, a
 * position the adapter keeps no longer (D73.3).
 */
export type LogEvent =
  | { readonly event: 'fact'; readonly position: position; readonly fact: StoredEnvelope }
  | { readonly event: 'caught_up'; readonly position: position }
  | { readonly event: 'position_unavailable' }

/**
 * The adapter's fact log (DOM-17): the facts it records with their writes
 * (DOM-8), from a position on, inclusive, then each new one as it is
 * recorded; from the first it keeps, with no position. The library reads
 * it to compose streams and to deliver facts to reactions (DOM-16).
 */
export type FactLog = (from: position | undefined) => AsyncIterable<LogEvent>

/**
 * How an adapter streams a query (LIB-8), declared query by query, since
 * whether a stream scales depends on the technology and the data, not on the
 * business:
 * - `native`: the adapter's own stream (the oracle, a replication);
 * - `composed`: the library composes it from the adapter's read and fact
 *   log. For each fact after P, of any domain, it reads the query again and
 *   compares the entries with the previous ones by identity and value, as
 *   the oracle does (DOM-17): an entry that a fact of the query's domain
 *   touches and that stays is the fact, an untouched one that stays and is
 *   no longer the same changed, a new untouched one entered, a missing one
 *   left. A whole read per fact of the node: the adapter's author chooses it
 *   for the queries where that is cheap.
 * A query with no strategy is only read. Either way a query's stream carries
 * only the facts of its domain (`fact`), as if each had a log of its own
 * (DOM-8, D64.3), so that a fact of `loans` holding the drill's id touches
 * no entry of `tools`' catalogue (A, 16 Nov 2026 (6)); a fact of another
 * domain counts for what it changes of the entries, which read that
 * domain's state through the adapter (GR-3): Luca renames the drill, and
 * Marta's row of the loan of the drill changed (SC-19). A native stream
 * finds the entries such a fact may change as it can, by crossing the
 * fact's resources with the identities its entries hold (the drill's
 * `tool_id`), and is compared with the oracle (TST-2).
 */
export type StreamStrategy<selection, source, field, condition = never> =
  | { readonly strategy: 'native'; readonly stream: Stream<selection, source, field, condition> }
  | { readonly strategy: 'composed'; readonly log: FactLog }

/** The stream strategies of a set of queries, by name: a query may have none. */
export type Streams<queries extends Queries, selection, source, field, condition = never> = {
  readonly [name in keyof queries]?: StreamStrategy<selection, source, field, condition>
}
