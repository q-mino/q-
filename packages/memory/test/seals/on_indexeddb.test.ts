import { fake_primitives } from './primitives.ts'
import { quiet } from './harness.ts'
import { the_kernel_on_indexeddb } from './kernel_on_indexeddb.ts'
import { stories_of_the_safe } from './stories.ts'

// The safe's stories on IndexedDB (TST-1, SEA-8, WEB-13; part 21.2): the
// conformance of the module of `seals` on IndexedDB, the same stories as
// on the oracle (`safe.test.ts`), over the fake primitives port, each safe
// a node's database of its own on fake-indexeddb. Every fact and every
// entry given twice (TST-4) is a decorator of the node's outbox and of its
// log (`kernel_on_indexeddb.ts`). Every story runs here: none of the safe's
// asks for a position the storage forgets.

stories_of_the_safe(
  'on IndexedDB, over the fake primitives port',
  fake_primitives,
  the_kernel_on_indexeddb(quiet),
)
