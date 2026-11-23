// The kernel's storage of the domains' suites on IndexedDB (TST-1, TST-4,
// WEB-13; part 21.2): a node's storage on fake-indexeddb with every kernel
// store (`../indexeddb/storage.ts`), the ports of its domains as the
// phone's storage wires them, for the stories of the safe, the address
// book and the post (`on_indexeddb.test.ts` of each folder). What the
// oracle's cell injects, every fact and every entry given twice (TST-4),
// is a decorator of the node's outbox and of its log (ADP-5), as the
// executors and the log's readers meet them. The entries queued are read
// where the node's outbox reads them, each business domain's store, in the
// node's order of entries (DOM-14). Its time to run its course is rounds
// of the harness's quiet, over when two rounds in a row change nothing the
// node shows: a commit of IndexedDB takes turns of the event loop that the
// oracle's cell does not.

import { read_in, the_store_of, type TheNodesStorage } from '@q-mino/adapters-web'
import type * as zz from '@q-mino/domains/library'
import { IDBKeyRange } from 'fake-indexeddb'
import {
  a_node_on_indexeddb,
  a_phone_s_storage,
  the_kernel_s_domains,
} from '../indexeddb/storage.ts'
import type { AKernelsStorage, Start } from './harness.ts'

/** Every value of a stream given twice, in its order (TST-4). */
export const twice = <event>(given: AsyncIterable<event>): AsyncIterable<event> => ({
  async *[Symbol.asyncIterator]() {
    for await (const each of given) {
      yield each
      yield each
    }
  },
})

/** The position an entry is kept at, the last part of its key (`['entry', effect, position]`). */
const the_position_of = (key: IDBValidKey): number => {
  const position = Array.isArray(key) ? key[2] : undefined
  if (typeof position !== 'number') throw new Error('an entry kept under a key out of form')
  return position
}

/** The entries every kernel domain's commands queued, in the node's order of entries (DOM-14). */
const the_entries_queued =
  (node: TheNodesStorage) => async (): Promise<readonly zz.StoredEntry[]> => {
    const ranges = the_kernel_s_domains.map((path) => ({
      store: the_store_of(path),
      prefix: ['entry'],
    }))
    const transaction = node.database.transaction(
      ranges.map((range) => range.store),
      'readonly',
    )
    const read = await read_in(transaction, IDBKeyRange, ranges)
    return ranges
      .flatMap((range) => read.kept_under(range))
      .toSorted((a, b) => the_position_of(a.key) - the_position_of(b.key))
      .map(
        // cast: the adapter's own records, written under an entry's key by its command (`execute_in`)
        (kept) => kept.value as zz.StoredEntry,
      )
  }

/**
 * What the node shows between two rounds: its position, its entries queued,
 * each one's effect's position, the entries and the parts held. A delivery
 * landed moves its effect's position; a command applied, the node's.
 */
const what_it_shows = async (
  node: TheNodesStorage,
  queued: () => Promise<readonly zz.StoredEntry[]>,
): Promise<string> => {
  const entries = await queued()
  const effects = [...new Set(entries.map((entry) => entry.effect))]
  return JSON.stringify([
    await node.position(),
    entries,
    await Promise.all(effects.map((effect) => node.executor.position(effect))),
    await node.held(),
    await node.held_parts(),
  ])
}

/**
 * The kernel's storage on a new node of IndexedDB, its rounds the harness's
 * quiet (`round`), every fact and every entry given twice if asked (TST-4).
 */
export const the_kernel_on_indexeddb =
  (round: () => Promise<void>) =>
  async (start: Start = {}): Promise<AKernelsStorage> => {
    const node = await a_node_on_indexeddb()
    const storage = a_phone_s_storage(node)
    const queued = the_entries_queued(node)
    const outbox: zz.Outbox = (effect) => (from) => twice(storage.outbox(effect)(from))
    const log: zz.FactLog = (from) => twice(storage.log(from))
    /** Rounds of the harness's quiet, until two in a row change nothing the node shows; at most 60. */
    const quiet = async (): Promise<void> => {
      let still = 0
      for (let rounds = 0; rounds < 60; rounds += 1) {
        const before = await what_it_shows(node, queued)
        await round()
        still = (await what_it_shows(node, queued)) === before ? still + 1 : 0
        if (still >= 2) return
      }
      throw new Error('the node did not settle in 60 rounds')
    }
    return {
      stored_versions: storage.stored_versions,
      log: start.redelivered === true ? log : storage.log,
      outbox: start.redelivered === true ? outbox : storage.outbox,
      executor: storage.executor,
      reactions: storage.reactions,
      held: storage.held,
      safe: storage.safe,
      address_book: storage.address_book,
      post: storage.post,
      queued,
      held_parts: node.held_parts,
      quiet,
    }
  }
