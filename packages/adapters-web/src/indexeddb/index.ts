// The node's storage on IndexedDB (step 21; WEB-8..WEB-12).
export {
  open_the_node_s_database,
  the_name_of,
  the_node_s_store,
  type AStore,
  type AnIndexedDb,
  type TheNodesDatabase,
  type WhyItClosed,
} from './database.ts'
export {
  ask_to_be_the_writer,
  the_term_holds,
  the_writer_s_lock,
  NotTheWriter,
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
export { the_partition_of, type TheNodesPartitions } from './partition.ts'
export {
  execute_in,
  recorded_in,
  the_keys,
  the_operators,
  type ADomainsStore,
  type AKey,
  type APut,
  type Fragment,
  type Records,
  type Write,
} from './command.ts'
export { a_bell, the_node_s_log, type ABell, type TheNodesFacts } from './log.ts'
export {
  read_in,
  the_range_of,
  type ARange,
  type ARead,
} from './command.ts'
export {
  deleted,
  every_parsed,
  on_a_record,
  on_the_records,
  parsed,
  set,
  the_records_of_a_domain,
  the_store_of,
} from './records.ts'
export {
  after,
  compare_values,
  reads_in,
  selection_operators,
  type ADomainsReads,
  type Field,
  type Selection,
  type Source,
} from './reads.ts'
export {
  the_entries_held,
  the_executors_state,
  the_node_s_outbox,
  the_node_s_position,
  the_parts_held,
  the_reactions_state,
  the_versions_kept,
  type TheNodesConsumers,
} from './consumers.ts'
export {
  the_node_s_storage,
  type ADomainsStorage,
  type TheBrowsersStorage,
  type TheNodeOpened,
  type TheNodesStorage,
  type TheNodesStores,
} from './node.ts'
export * from './domains/index.ts'
