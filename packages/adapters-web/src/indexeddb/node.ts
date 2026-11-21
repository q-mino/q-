// The node's storage on IndexedDB, put together (WEB-8..WEB-12, part 21.2):
// the database opened with the stores the release needs, the writer asked
// for, and, in the tab that is the writer, what the composition root wires
// the domains' modules and the consumers over: a business domain's store
// for its command port and its reads, the node's log, the outbox, the
// executors' and the reactions' state, the versions kept, an extension's
// partition. A tab that is not the writer gets nothing to compose (WEB-10).

import type * as zz from '@q-mino/domains/library'
import type { ADomainsStore } from './command.ts'
import {
  the_entries_held,
  the_executors_state,
  the_node_s_outbox,
  the_node_s_position,
  the_parts_held,
  the_reactions_state,
  the_versions_kept,
  type TheNodesConsumers,
} from './consumers.ts'
import { open_the_node_s_database, type AnIndexedDb, type WhyItClosed } from './database.ts'
import { a_bell, the_node_s_log } from './log.ts'
import { the_partition_of } from './partition.ts'
import type { ADomainsReads } from './reads.ts'
import {
  ask_to_be_the_writer,
  type ALockManager,
  type HowToAsk,
  type WhyNotAnyMore,
} from './the_writer.ts'

/** The browser's objects the node's storage takes (WEB-5). */
export interface TheBrowsersStorage {
  readonly indexed_db: AnIndexedDb
  readonly key_range: Pick<typeof IDBKeyRange, 'bound' | 'lowerBound' | 'upperBound'>
  readonly locks: ALockManager
}

/** What a release keeps in the node's database: its business domains, its extensions' partitions and their largest size (WEB-12). */
export interface TheNodesStores {
  readonly name: string
  readonly paths: readonly string[]
  readonly extensions: readonly string[]
  readonly characters: number
}

/** A business domain's store, as its module wires its command port and its reads over it. */
export type ADomainsStorage = ADomainsStore & ADomainsReads

/** The node's storage in the tab that writes it. */
export interface TheNodesStorage {
  readonly term: number
  /** Settles when another tab takes the writer ("use here"), or this one lets it go (WEB-10). */
  readonly lost: Promise<WhyNotAnyMore>
  readonly let_go: () => void
  /** Settles when the database closes under the node (WEB-10). */
  readonly closed: Promise<WhyItClosed>
  readonly database: IDBDatabase
  readonly domain: (path: string) => ADomainsStorage
  readonly log: zz.FactLog
  readonly outbox: zz.Outbox
  readonly executor: zz.ExecutorState
  readonly reactions: zz.ReactionState
  readonly stored_versions: zz.StoredVersions
  readonly held: () => Promise<readonly zz.HeldEntry[]>
  readonly held_parts: () => Promise<readonly zz.HeldPart[]>
  readonly position: () => Promise<zz.position>
  readonly partition: ReturnType<typeof the_partition_of>
}

/** The node's storage opened: this tab writes it, or another tab does and this one composes nothing (WEB-10). */
export type TheNodeOpened =
  | ({ readonly writer: 'this_tab' } & TheNodesStorage)
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
    const bell = a_bell()
    const node: TheNodesConsumers = {
      database: opened.database,
      key_range: browser.key_range,
      term: writer.term,
      bell,
      paths: stores.paths,
    }
    return {
      writer: 'this_tab',
      term: writer.term,
      lost: writer.lost,
      let_go: writer.let_go,
      closed: opened.closed,
      database: opened.database,
      domain: (path) => ({
        database: opened.database,
        key_range: browser.key_range,
        term: writer.term,
        path,
        committed: bell.ring,
      }),
      log: the_node_s_log({
        database: opened.database,
        key_range: browser.key_range,
        paths: stores.paths,
        bell,
      }),
      outbox: the_node_s_outbox(node),
      executor: the_executors_state(node),
      reactions: the_reactions_state(node),
      stored_versions: the_versions_kept(node),
      held: the_entries_held(node),
      held_parts: the_parts_held(node),
      position: the_node_s_position(node),
      partition: the_partition_of({
        database: opened.database,
        key_range: browser.key_range,
        term: writer.term,
        characters: stores.characters,
      }),
    }
  }
