// A phone's storage on IndexedDB, for the suites (TST-1, WEB-13; part
// 21.2): the node's database on fake-indexeddb, in Node, with Node's Web
// Locks; each kernel domain's ports over it, as the PWA's composition root
// will wire them (step 25). One database per phone, named apart, so that
// every phone is its own node with its own writer (WEB-10).

import type { TheNodesStorage } from '@q-mino/adapters-common'
import {
  the_node_s_storage,
  type AnIndexedDb,
  type TheNodeOnIndexedDb,
} from '@q-mino/adapters-web'
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { on_the_node_s_database, type PhoneStorage } from '../../src/index.ts'
import type { AStorageUnderTest } from '../stack/harness.ts'

/** The kernel's business domains, a store each (WEB-8). */
export const the_kernel_s_domains = [
  'seals/safe',
  'post/requests',
  'bonds/address_book',
  'extensions/activations',
  'user/activities',
  'user/drafts',
  'user/choices',
] as const

/** The extensions the suites' apps carry, a partition each (WEB-12). */
export const the_extensions_carried = ['ping_pong', 'greetings'] as const

/** The phone's storage over a node's storage on IndexedDB: the five modules, the consumers, the partitions. */
export const a_phone_s_storage = (opened: TheNodesStorage): PhoneStorage =>
  on_the_node_s_database(opened)

/** A node's storage opened on a browser's IndexedDB, as its only tab: the writer. */
export const a_node_on_indexeddb = async (
  indexed_db: AnIndexedDb = new IDBFactory(),
  name = `cumino ${crypto.randomUUID()}`,
): Promise<TheNodeOnIndexedDb> => {
  const opened = await the_node_s_storage({
    indexed_db,
    key_range: IDBKeyRange,
    locks: navigator.locks,
  })(
    {
      name,
      paths: the_kernel_s_domains,
      extensions: the_extensions_carried,
      characters: 1_000_000,
    },
    'if_no_tab_is',
  )
  if (opened.writer !== 'this_tab') throw new Error(`another tab writes ${name}`)
  return opened
}

/**
 * A browser's IndexedDB that knows whether it is at work (TST-11): each
 * connection opened through it has its transactions counted from their
 * start to their `complete` or `abort`, wrapped as the connection opens,
 * before the adapter sees it. The adapter is the release's: it takes any
 * `AnIndexedDb`. On fake-indexeddb every step of a transaction is a task of
 * its own (`setImmediate`), so a node whose consumers wait on the log's
 * bell, the story's clock or a stop has none in flight.
 */
export const an_indexeddb_that_knows_its_work = (indexed_db: AnIndexedDb = new IDBFactory()) => {
  let in_flight = 0
  const counted = (database: IDBDatabase): void => {
    const transaction = database.transaction.bind(database)
    database.transaction = (...asked: Parameters<IDBDatabase['transaction']>) => {
      const begun = transaction(...asked)
      in_flight += 1
      const over = (): void => {
        in_flight -= 1
      }
      begun.addEventListener('complete', over)
      begun.addEventListener('abort', over)
      return begun
    }
  }
  const watched: AnIndexedDb = {
    open: (...asked: Parameters<AnIndexedDb['open']>) => {
      const request = indexed_db.open(...asked)
      request.addEventListener('success', () => {
        counted(request.result)
      })
      return request
    },
    deleteDatabase: (...asked: Parameters<AnIndexedDb['deleteDatabase']>) =>
      indexed_db.deleteDatabase(...asked),
  }
  return { indexed_db: watched, at_work: (): boolean => in_flight > 0 }
}

/** A phone of a story on a new browser's IndexedDB (the stack's factory, STK-6). */
export const on_indexeddb = async (): Promise<AStorageUnderTest> => {
  const browser = an_indexeddb_that_knows_its_work()
  const opened = await a_node_on_indexeddb(browser.indexed_db)
  return {
    storage: a_phone_s_storage(opened),
    position: opened.position,
    held: opened.held,
    held_parts: opened.held_parts,
    at_work: browser.at_work,
  }
}
