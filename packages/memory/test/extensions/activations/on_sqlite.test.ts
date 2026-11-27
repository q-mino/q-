import {
  bonds_ports_on_the_node_s_database,
  extensions_ports_on_the_node_s_database,
} from '@q-mino/adapters-common'
import { fake_primitives } from '../../seals/primitives.ts'
import { a_node_on_sqlite } from '../../sqlite/storage.ts'
import {
  the_address_book_made_through_its_commands,
  type AFactory,
  type AStorageUnderTest,
} from './harness.ts'
import { stories_of_the_extensions_office } from './stories.ts'

// The stories of the extensions' office on SQLite (TST-1; part B2 of the
// assistant, AST-2): the same stories as on the oracle and on IndexedDB
// (`on_indexeddb.test.ts`), each phone a node's file of its own, the
// office's ports and the address book's over it (GR-3), the address book
// made through its commands.

/** A phone's storage on a new node's file, with the story's address book. */
const on_sqlite: AFactory = async (start) => {
  const node = await a_node_on_sqlite()
  const storage: AStorageUnderTest = {
    stored_versions: node.stored_versions,
    log: node.log,
    outbox: node.outbox,
    executor: node.executor,
    held: node.held,
    office: (installed) => extensions_ports_on_the_node_s_database(node, installed),
    address_book: bonds_ports_on_the_node_s_database(node, fake_primitives),
    at_work: node.at_work,
  }
  await the_address_book_made_through_its_commands(storage, start)
  return storage
}

stories_of_the_extensions_office('on SQLite', on_sqlite)
