import { vi } from 'vitest'
import { fake_primitives } from '../seals/primitives.ts'
import { on_sqlite } from '../sqlite/storage.ts'
import { on_the_oracle } from './harness.ts'
import { stories_of_the_stack } from './stories.ts'

// The scenarios of stage 1 with every phone on SQLite (part B2 of the
// assistant; STK-6, TST-1, AST-2): the conformance of the node's storage on
// SQLite, the same seven scenarios as on the oracle (`stack.test.ts`) and
// on IndexedDB (`on_indexeddb.test.ts`), under both fault plans, each
// phone a file of its own.
vi.setConfig({ testTimeout: 15_000 })

stories_of_the_stack('on SQLite, fake primitives', {
  ...on_the_oracle(fake_primitives),
  storage: on_sqlite,
})
