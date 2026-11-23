import { on_indexeddb } from '../indexeddb/storage.ts'
import { stories_of_user } from './stories.ts'

// The stories of `user` on IndexedDB (TST-1, WEB-8, WEB-13; part 21.2): the
// conformance of its module, the same stories over a node as on the oracle
// (`user.test.ts`), each of the three phones a node's database of its own
// on fake-indexeddb, every kernel domain's ports over it as the PWA's
// composition root wires them, its writer by Node's Web Locks. The stories
// inject no deviation of the storage (TST-4): the partition's refusals are
// the release's, the same on both.

stories_of_user('on IndexedDB (part 21.2)', on_indexeddb)
