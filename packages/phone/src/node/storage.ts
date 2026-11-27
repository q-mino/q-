import type { TheNodesStorage } from '@q-mino/adapters-common'
import { on_the_node_s_database, type PhoneStorage } from '@q-mino/memory'

// The phone's storage on the browser's IndexedDB (WEB-16, PWA-1): each
// kernel domain's module over the node's database, the node's log, outbox
// and consumers' state, and the extensions' partitions of the release's
// size, put together by the configurator (its shape is the configurator's,
// CFG-4: `memory`'s `on_the_node_s_database`, the same over SQLite).

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
export const a_phone_s_storage = (opened: TheNodesStorage): PhoneStorage =>
  on_the_node_s_database(opened)
