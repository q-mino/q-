import { bonds_ports_on_indexeddb, extensions_ports_on_indexeddb } from '@q-mino/adapters-web'
import { a_node_on_indexeddb, an_indexeddb_that_knows_its_work } from '../../indexeddb/storage.ts'
import { fake_primitives } from '../../seals/primitives.ts'
import {
  the_address_book_made_through_its_commands,
  type AFactory,
  type AStorageUnderTest,
} from './harness.ts'
import { stories_of_the_extensions_office } from './stories.ts'

// The stories of the extensions' office on IndexedDB (TST-1, WEB-8, WEB-13;
// part 21.2): the conformance of its module, the same stories as on the
// oracle (`activations.test.ts`), each phone a node's database of its own on
// fake-indexeddb, the office's ports and the address book's over it (GR-3:
// the office reads the address book's store for `the_bond_exists`). The
// address book cannot be written as its state there: it is made through
// its commands (`the_address_book_made_through_its_commands`), its facts
// before the story. The stories inject no deviation (TST-4) of the storage.

/** A phone's storage on a new node's database on IndexedDB, with the story's address book. */
const on_indexeddb: AFactory = async (start) => {
  const browser = an_indexeddb_that_knows_its_work()
  const node = await a_node_on_indexeddb(browser.indexed_db)
  const storage: AStorageUnderTest = {
    stored_versions: node.stored_versions,
    log: node.log,
    outbox: node.outbox,
    executor: node.executor,
    held: node.held,
    office: (installed) => extensions_ports_on_indexeddb(node, installed),
    address_book: bonds_ports_on_indexeddb(node, fake_primitives),
    at_work: browser.at_work,
  }
  await the_address_book_made_through_its_commands(storage, start)
  return storage
}

stories_of_the_extensions_office('on IndexedDB', on_indexeddb)
