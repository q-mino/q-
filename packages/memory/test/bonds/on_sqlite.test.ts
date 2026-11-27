import { fake_primitives } from '../seals/primitives.ts'
import { the_kernel_on_sqlite } from '../seals/kernel_on_sqlite.ts'
import { stories_of_the_address_book } from './stories.ts'

// The same stories as on the oracle and on IndexedDB (`on_indexeddb.test.ts`),
// on SQLite (TST-1; part B2 of the assistant, AST-2): each node a file of
// its own, every fact and entry given twice where a story asks (TST-4).

stories_of_the_address_book(
  'on SQLite, over the fake primitives port',
  fake_primitives,
  the_kernel_on_sqlite,
)
