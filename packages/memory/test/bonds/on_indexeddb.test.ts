import { fake_primitives } from '../seals/primitives.ts'
import { quiet } from '../seals/harness.ts'
import { the_kernel_on_indexeddb } from '../seals/kernel_on_indexeddb.ts'
import { stories_of_the_address_book } from './stories.ts'

// The address book's stories on IndexedDB (TST-1, BND-13, WEB-13; part
// 21.2): the conformance of the modules of `bonds` and `seals` on
// IndexedDB, the same stories as on the oracle (`address_book.test.ts`),
// over the fake primitives port, each phone a node's database of its own on
// fake-indexeddb, its reactions and its executors over the node's log and
// outbox. Every story runs here: none of the address book's injects a
// deviation of the storage (TST-4).

stories_of_the_address_book(
  'on IndexedDB, over the fake primitives port',
  fake_primitives,
  the_kernel_on_indexeddb(quiet),
)
