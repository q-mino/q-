// The node's database (WEB-8..WEB-16; on any substrate since part B2 of the
// assistant, AST-2) [Q, C, 27 Nov 2026]: the kernel's domains' modules, the
// node's log, its consumers and the extensions' partitions, written once
// over named stores of records and their transactions; IndexedDB's
// substrate in `adapters-web`, SQLite's in `adapters-node`.
export {
  a_new_term,
  no_room,
  the_name_of,
  the_node_s_store,
  the_term_holds,
  the_writer_s_term,
  NotTheWriter,
  type ABound,
  type AKept,
  type AMode,
  type AnEnd,
  type ANodesDatabase,
  type AStore,
  type AStoredKey,
  type ATransaction,
} from './the_node_s_database.ts'
export {
  execute_in,
  read_in,
  recorded_in,
  the_keys,
  the_operators,
  the_range_of,
  type ADomainsStore,
  type AKey,
  type APut,
  type ARange,
  type ARead,
  type Fragment,
  type Records,
  type RecordsRead,
  type Write,
} from './command.ts'
export { a_bell, the_node_s_log, type ABell, type TheNodesFacts } from './log.ts'
export {
  ARecordOutOfItsForm,
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
export { the_partition_of, type TheNodesPartitions } from './partition.ts'
export {
  the_node_s_storage_over,
  type ADomainsStorage,
  type TheNodesStorage,
  type TheNodesStores,
} from './node.ts'
export * from './domains/index.ts'
