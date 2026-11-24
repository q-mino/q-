import { fake_primitives } from '../seals/primitives.ts'
import { the_kernel_on_indexeddb } from '../seals/kernel_on_indexeddb.ts'
import { stories_of_the_post } from './stories.ts'

// The post's stories on IndexedDB (TST-1, PST-13, WEB-13; part 21.2): the
// conformance of the modules of `post` and `seals` on IndexedDB, the same
// stories as on the oracle (`post.test.ts`), over the fake primitives port,
// each phone a node's database of its own on fake-indexeddb, the relay the
// oracle's. Every fact and every entry given twice (TST-4) is a decorator
// of the node's outbox and of its log (`../seals/kernel_on_indexeddb.ts`);
// the faults of the transport are the harness's, as on the oracle. Every
// story runs here: none of the post's asks for a position the storage
// forgets.

stories_of_the_post(
  'on IndexedDB, over the fake primitives port',
  fake_primitives,
  the_kernel_on_indexeddb,
)
