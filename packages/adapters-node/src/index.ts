// adapters-node: one folder per adapter, each imported only through its index.ts.
// The relay's: its storage on SQLite (`sqlite/`) and its HTTP interface through `desk` (`hono/`).
export { the_relays_storage, type TheRelaysStorage } from './sqlite/index.ts'
export {
  the_desks_http_interface,
  type HashOfACollectSecret,
  type TheDesk,
  type TheDesksHttpInterface,
} from './hono/index.ts'
