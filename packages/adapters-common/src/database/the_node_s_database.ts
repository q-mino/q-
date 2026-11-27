// The node's database as its modules see it (WEB-8, WEB-9; part B2 of the
// assistant, AST-2) [Q, C, 27 Nov 2026]: named stores of records, each
// record under a key in IndexedDB's order, and transactions over a set of
// stores, all or nothing. The browser's IndexedDB is one (`adapters-web`,
// the PWA), SQLite another (`adapters-node`, the assistant's node): the
// modules of the kernel's domains, the node's log, its consumers and the
// extensions' partitions are written once over this surface (ADP-6, ADP-8),
// and each substrate translates it to its technology. Rejected: a SQLite
// copy of each module (two copies of one translation, which would drift).

/**
 * A record's key: a number, a text, or an array of keys. Their order is
 * IndexedDB's: numbers before texts before arrays; numbers by value, texts by
 * UTF-16 code units, arrays part by part, a shorter one first when it is a
 * prefix of the other. A subset of IndexedDB's keys (no dates, no binary).
 */
export type AStoredKey = number | string | AStoredKey[]

/** One end of a range of keys: the key, and whether the range leaves it out (`open`). */
export interface AnEnd {
  readonly key: AStoredKey
  readonly open: boolean
}

/** A range of keys of a store: from an end, to an end, each absent where the range has none. */
export interface ABound {
  readonly lower: AnEnd | undefined
  readonly upper: AnEnd | undefined
}

/** A record read with its key. */
export interface AKept {
  readonly key: AStoredKey
  readonly value: unknown
}

/**
 * A transaction over some stores. Its reads are awaited; its writes are
 * made as they are asked, seen by its later reads, and committed together
 * when its body ends, or none of them if its body throws. Inside it only
 * its own reads are awaited (IndexedDB commits a transaction at the first
 * task with none of its requests pending, WEB-9).
 */
export interface ATransaction {
  readonly get: (store: string, key: AStoredKey) => Promise<unknown>
  /** The records of a range, in the keys' order. */
  readonly within: (store: string, range: ABound) => Promise<readonly AKept[]>
  readonly put: (store: string, key: AStoredKey, value: unknown) => void
  readonly delete: (store: string, key: AStoredKey) => void
}

/** A transaction that only reads (a consistent snapshot, D66), or one that writes. */
export type AMode = 'readonly' | 'readwrite'

/** The node's database: its stores, and a transaction over some of them. */
export interface ANodesDatabase {
  /** The name of every store of the database. */
  readonly stores: () => readonly string[]
  /**
   * A transaction over the stores named, its body run inside it: what it
   * returns once it has committed, or its fault once it has rolled back.
   * The writes of two transactions are never interleaved (DOM-9).
   */
  readonly transaction: <result>(
    stores: readonly string[],
    mode: AMode,
    body: (transaction: ATransaction) => Promise<result>,
  ) => Promise<result>
}

/** A store of the node's database: a business domain's, or an extension's partition (WEB-8). */
export type AStore =
  | { readonly of: 'a_domain'; readonly path: string }
  | { readonly of: 'an_extension'; readonly name: string }

/** The node's own store: the writer's term, the node's counters, the consumers' state (WEB-8). */
export const the_node_s_store = 'node'

/** A store's name in the database, told apart by its kind. */
export const the_name_of = (store: AStore): string =>
  store.of === 'a_domain' ? `domain ${store.path}` : `extension ${store.name}`

/**
 * A substrate's fault when the device has no room for a commit: IndexedDB's
 * `QuotaExceededError`, and SQLite's full disk told by that name.
 */
export const no_room = (fault: unknown): boolean =>
  fault instanceof Error && fault.name === 'QuotaExceededError'

/** The key of the writer's term in the node's store (WEB-10). */
export const the_writer_s_term = 'the_writer_s_term'

/** A commit begun by a writer that is no longer the writer: rolled back, nothing written (WEB-10). */
export class NotTheWriter extends Error {
  constructor() {
    super('this tab is no longer the writer of the node')
    this.name = 'NotTheWriter'
  }
}

/**
 * Inside a commit's transaction, before its writes: the term still this
 * writer's, or `NotTheWriter` thrown, which rolls the transaction back.
 */
export const the_term_holds = async (transaction: ATransaction, term: number): Promise<void> => {
  const now = await transaction.get(the_node_s_store, the_writer_s_term)
  if (now !== term) throw new NotTheWriter()
}

/** A new writer's term in the node's store, one more than the last (WEB-10). */
export const a_new_term = (database: ANodesDatabase): Promise<number> =>
  database.transaction([the_node_s_store], 'readwrite', async (transaction) => {
    const before = await transaction.get(the_node_s_store, the_writer_s_term)
    const term = typeof before === 'number' ? before + 1 : 1
    transaction.put(the_node_s_store, the_writer_s_term, term)
    return term
  })
