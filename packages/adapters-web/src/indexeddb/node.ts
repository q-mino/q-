// The node's storage on IndexedDB, put together (WEB-8..WEB-12, part 21.2):
// the database opened with the stores the release needs, the writer asked
// for, and, in the tab that is the writer, the node's storage over it
// (`adapters-common`, the same over SQLite): what the composition root
// wires the domains' modules and the consumers over. A tab that is not the
// writer gets nothing to compose (WEB-10).

import {
  the_node_s_storage_over,
  type TheNodesStorage,
  type TheNodesStores,
} from '@q-mino/adapters-common'
import { open_the_node_s_database, type AnIndexedDb, type WhyItClosed } from './database.ts'
import { on_indexeddb, type AKeyRange } from './on_indexeddb.ts'
import {
  ask_to_be_the_writer,
  type ALockManager,
  type HowToAsk,
  type WhyNotAnyMore,
} from './the_writer.ts'

/** The browser's objects the node's storage takes (WEB-5). */
export interface TheBrowsersStorage {
  readonly indexed_db: AnIndexedDb
  readonly key_range: AKeyRange
  readonly locks: ALockManager
}

/** The node's storage in the tab that writes it: the node's storage, and its IndexedDB connection. */
export interface TheNodeOnIndexedDb extends TheNodesStorage {
  /** Settles when another tab takes the writer ("use here"), or this one lets it go (WEB-10). */
  readonly lost: Promise<WhyNotAnyMore>
  readonly let_go: () => void
  /** Settles when the database closes under the node (WEB-10). */
  readonly closed: Promise<WhyItClosed>
  /** The IndexedDB connection: closed when the node stops. */
  readonly connection: IDBDatabase
}

/** The node's storage opened: this tab writes it, or another tab does and this one composes nothing (WEB-10). */
export type TheNodeOpened =
  | ({ readonly writer: 'this_tab' } & TheNodeOnIndexedDb)
  | { readonly writer: 'another_tab'; readonly closes: () => void }

/** Opens the node's storage and asks to be its writer, as the tab asks (WEB-10). */
export const the_node_s_storage =
  (browser: TheBrowsersStorage) =>
  async (stores: TheNodesStores, how: HowToAsk): Promise<TheNodeOpened> => {
    const opened = await open_the_node_s_database(browser.indexed_db)(stores.name, [
      ...stores.paths.map((path) => ({ of: 'a_domain', path }) as const),
      ...stores.extensions.map((name) => ({ of: 'an_extension', name }) as const),
    ])
    const writer = await ask_to_be_the_writer(browser.locks, opened.database)(how)
    if (writer.writer === 'another_tab') {
      return {
        writer: 'another_tab',
        closes: () => {
          opened.database.close()
        },
      }
    }
    return {
      writer: 'this_tab',
      ...the_node_s_storage_over(on_indexeddb(opened.database, browser.key_range), {
        term: writer.term,
        paths: stores.paths,
        characters: stores.characters,
      }),
      lost: writer.lost,
      let_go: writer.let_go,
      closed: opened.closed,
      connection: opened.database,
    }
  }
