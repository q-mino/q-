// The node's storage over its database (WEB-8..WEB-12, part 21.2; on any
// substrate since part B2 of the assistant) [Q, C, 27 Nov 2026]: what the
// composition root wires the domains' modules and the consumers over, once
// the writer has its term: a business domain's store for its command port
// and its reads, the node's log, the outbox, the executors' and the
// reactions' state, the versions kept, the entries and parts held, an
// extension's partition. The substrate opens the database and decides the
// writer (IndexedDB by the browser's lock, WEB-10; SQLite by the file's).

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
import { a_bell, the_node_s_log } from './log.ts'
import { the_partition_of } from './partition.ts'
import type { ADomainsReads } from './reads.ts'
import type { ANodesDatabase } from './the_node_s_database.ts'

/** A business domain's store, as its module wires its command port and its reads over it. */
export type ADomainsStorage = ADomainsStore & ADomainsReads

/** What a release keeps in the node's database: its business domains, its extensions' partitions and their largest size (WEB-12). */
export interface TheNodesStores {
  readonly name: string
  readonly paths: readonly string[]
  readonly extensions: readonly string[]
  readonly characters: number
}

/** The node's storage, written by its writer. */
export interface TheNodesStorage {
  /** The writer's term (WEB-10). */
  readonly term: number
  readonly database: ANodesDatabase
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

/** The node's storage over its database, for the writer of a term. */
export const the_node_s_storage_over = (
  database: ANodesDatabase,
  node: { readonly term: number; readonly paths: readonly string[]; readonly characters: number },
): TheNodesStorage => {
  const bell = a_bell()
  const consumers: TheNodesConsumers = { database, term: node.term, bell, paths: node.paths }
  return {
    term: node.term,
    database,
    domain: (path) => ({ database, term: node.term, path, committed: bell.ring }),
    log: the_node_s_log({ database, paths: node.paths, bell }),
    outbox: the_node_s_outbox(consumers),
    executor: the_executors_state(consumers),
    reactions: the_reactions_state(consumers),
    stored_versions: the_versions_kept(consumers),
    held: the_entries_held(consumers),
    held_parts: the_parts_held(consumers),
    position: the_node_s_position(consumers),
    partition: the_partition_of({ database, term: node.term, characters: node.characters }),
  }
}
