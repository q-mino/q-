import {
  bonds_ports_on_indexeddb,
  extensions_ports_on_indexeddb,
  post_ports_on_indexeddb,
  seals_ports_on_indexeddb,
  the_partition_of,
  user_ports_on_indexeddb,
  type TheBrowsersStorage,
  type TheNodesStorage,
} from '@q-mino/adapters-web'
import type { PhoneStorage } from '@q-mino/memory'

// The phone's storage on the browser's IndexedDB (WEB-16, PWA-1): each
// kernel domain's module over the node's database, the node's log, outbox
// and consumers' state, and the extensions' partitions of the release's
// size, put together by the configurator (its shape is the configurator's,
// CFG-4), as `memory`'s tests put it together over fake-indexeddb.

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

/** The phone's storage over the node's storage this tab writes. */
export const a_phone_s_storage = (
  opened: TheNodesStorage,
  key_range: TheBrowsersStorage['key_range'],
): PhoneStorage => ({
  stored_versions: opened.stored_versions,
  log: opened.log,
  outbox: opened.outbox,
  executor: opened.executor,
  reactions: opened.reactions,
  held: opened.held,
  safe: (primitives) => seals_ports_on_indexeddb(opened, primitives),
  post: post_ports_on_indexeddb(opened),
  address_book: (primitives) => bonds_ports_on_indexeddb(opened, primitives),
  office: (installed) => extensions_ports_on_indexeddb(opened, installed),
  user: user_ports_on_indexeddb(opened),
  partitions: ({ characters }) => ({
    of: the_partition_of({ database: opened.database, key_range, term: opened.term, characters }),
  }),
})
