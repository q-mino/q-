// A node's storage on SQLite (part B2 of the assistant, AST-2) [Q, C, 27 Nov
// 2026]: the file held by this process, the writer's new term in it, and the
// node's storage over it (`adapters-common`, the same as over IndexedDB),
// which `memory`'s `on_the_node_s_database` turns into a phone's storage.
// Rejected: `a_phone_s_storage_on_sqlite`, the phone's storage made here
// (README of the assistant, part B2: a type of the `memory` configurator,
// which an adapter does not import, CFG-4).

import {
  a_new_term,
  the_node_s_storage_over,
  type TheNodesStorage,
  type TheNodesStores,
} from '@q-mino/adapters-common'
import { hold_the_file, on_sqlite, type WhenItSyncs } from './database.ts'

/** The node's storage on SQLite, in the process that holds its file. */
export type { WhenItSyncs } from './database.ts'

export interface TheNodeOnSqlite extends TheNodesStorage {
  /** Whether a transaction is in flight or waits for its turn (TST-11: a story waits until it is quiet). */
  readonly at_work: () => boolean
  /** Lets the file go: once the node has stopped, after the last transaction. */
  readonly close: () => Promise<void>
}

/** The node's storage opened: this process holds the file, or another connection does and nothing is composed (DOM-9). */
export type TheNodeOpenedOnSqlite =
  | ({ readonly writer: 'this_process' } & TheNodeOnSqlite)
  | { readonly writer: 'another_connection' }

/**
 * Opens the node's storage in a file (its folder made if missing), with the
 * domains and the partitions' size of the release; synced to the disk at
 * each commit, unless a suite asks for WAL's checkpoints only.
 */
export const the_node_s_storage_on_sqlite =
  (location: string, syncs: WhenItSyncs = 'each_commit') =>
  async (stores: Pick<TheNodesStores, 'paths' | 'characters'>): Promise<TheNodeOpenedOnSqlite> => {
    const file = hold_the_file(location, syncs)
    if (file.held === 'elsewhere') return { writer: 'another_connection' }
    const database = on_sqlite(file.database, stores.paths)
    const term = await a_new_term(database)
    return {
      writer: 'this_process',
      ...the_node_s_storage_over(database, {
        term,
        paths: stores.paths,
        characters: stores.characters,
      }),
      at_work: database.at_work,
      close: async () => {
        await database.transaction([], 'readonly', () => Promise.resolve(undefined))
        file.database.close()
      },
    }
  }
