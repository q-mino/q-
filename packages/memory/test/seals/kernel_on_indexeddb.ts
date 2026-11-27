// The kernel's storage of the domains' suites on IndexedDB (TST-1, TST-4,
// WEB-13; part 21.2): a node's storage on fake-indexeddb with every kernel
// store (`../indexeddb/storage.ts`), the ports of its domains as the
// phone's storage wires them, for the stories of the safe, the address
// book and the post (`on_indexeddb.test.ts` of each folder). What the
// oracle's cell injects, every fact and every entry given twice (TST-4),
// is a decorator of the node's outbox and of its log (ADP-5), as the
// executors and the log's readers meet them. The entries queued are read
// where the node's outbox reads them, each business domain's store, in the
// node's order of entries (DOM-14). Its time to run its course is until no
// transaction of its IndexedDB is in flight (TST-11, `../quiet.ts`): a
// commit of IndexedDB takes turns of the event loop that the oracle's cell
// does not, and how many depends on the machine's load.

import {
  read_in,
  the_store_of,
  type AStoredKey,
  type TheNodesStorage,
} from '@q-mino/adapters-common'
import type * as zz from '@q-mino/domains/library'
import {
  a_node_on_indexeddb,
  a_phone_s_storage,
  an_indexeddb_that_knows_its_work,
  the_kernel_s_domains,
} from '../indexeddb/storage.ts'
import { until_quiet } from '../quiet.ts'
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
const the_position_of = (key: AStoredKey): number => {
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
    const read = await node.database.transaction(
      ranges.map((range) => range.store),
      'readonly',
      (transaction) => read_in(transaction, ranges),
    )
    return ranges
      .flatMap((range) => read.kept_under(range))
      .toSorted((a, b) => the_position_of(a.key) - the_position_of(b.key))
      .map(
        // cast: the adapter's own records, written under an entry's key by its command (`execute_in`)
        (kept) => kept.value as zz.StoredEntry,
      )
  }

/**
 * The kernel's storage over a node's storage, on IndexedDB or on SQLite,
 * quiet once its substrate is (`quiet`), every fact and every entry given
 * twice if asked (TST-4).
 */
export const the_kernel_over = (
  node: TheNodesStorage,
  quiet: () => Promise<void>,
  start: Start = {},
): AKernelsStorage => {
  const storage = a_phone_s_storage(node)
  const queued = the_entries_queued(node)
  const outbox: zz.Outbox = (effect) => (from) => twice(storage.outbox(effect)(from))
  const log: zz.FactLog = (from) => twice(storage.log(from))
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

/**
 * The kernel's storage on a new node of IndexedDB, quiet once no
 * transaction of it is in flight, every fact and every entry given twice if
 * asked (TST-4).
 */
export const the_kernel_on_indexeddb = async (start: Start = {}): Promise<AKernelsStorage> => {
  const browser = an_indexeddb_that_knows_its_work()
  const node = await a_node_on_indexeddb(browser.indexed_db)
  /** Until no transaction of its IndexedDB is in flight, seen from a turn of the event loop. */
  const quiet = (): Promise<void> => until_quiet(browser.at_work, 'the node on IndexedDB quiet')
  return the_kernel_over(node, quiet, start)
}
