// The node's storage on IndexedDB (step 21; WEB-8..WEB-12): the database, its
// writer, the storage kept, and the substrate the modules of the node's
// database run on (`adapters-common`, part B2 of the assistant).
export {
  delete_the_node_s_database,
  open_the_node_s_database,
  type AnIndexedDb,
  type TheNodesDatabase,
  type WhyItClosed,
} from './database.ts'
export {
  ask_to_be_the_writer,
  the_writer_s_lock,
  type ALockManager,
  type HowToAsk,
  type TheWriter,
  type WhyNotAnyMore,
} from './the_writer.ts'
export {
  ask_to_keep_the_storage,
  type AStorageManager,
  type TheStorage,
} from './the_storage_kept.ts'
export { on_indexeddb, type AKeyRange } from './on_indexeddb.ts'
export {
  the_node_s_storage,
  type TheBrowsersStorage,
  type TheNodeOnIndexedDb,
  type TheNodeOpened,
} from './node.ts'
