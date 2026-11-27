import { on_sqlite } from '../sqlite/storage.ts'
import { stories_of_user } from './stories.ts'

// The stories of `user` on SQLite (TST-1; part B2 of the assistant, AST-2):
// the same stories as on the oracle (`user.test.ts`) and on IndexedDB
// (`on_indexeddb.test.ts`), each of the three phones a node's file of its own.

stories_of_user('on SQLite (part B2 of the assistant)', on_sqlite)
