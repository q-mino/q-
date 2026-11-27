// adapters-node: one folder per adapter, each imported only through its index.ts.
// The relay's: its storage on SQLite (`sqlite/`, and a node's since part B2 of the assistant), its HTTP interface through `desk` and its stands' pages (`hono/`),
// and the room on its disk (`disk/`, REL-3).
export {
  the_node_s_storage_on_sqlite,
  the_relays_storage,
  type TheNodeOnSqlite,
  type TheNodeOpenedOnSqlite,
  type TheRelaysStorage,
  type WhenItSyncs,
} from './sqlite/index.ts'
export {
  always_room,
  the_free_space_kept,
  the_room_of,
  the_room_on_the_disk,
  type FreeSpaceKept,
  type ReadTheVolume,
  type RoomForADeposit,
  type RoomOnTheDisk,
  type TheVolume,
} from './disk/index.ts'
export {
  the_desks_http_interface,
  type AboutTheRelay,
  type AStandServed,
  type AStandsPage,
  type DrawAStandsPage,
  type TheInviterSigned,
  type HashOfACollectSecret,
  type TheDesk,
  type TheDesksHttpInterface,
} from './hono/index.ts'
