import { vi } from 'vitest'
import { fake_primitives } from '../seals/primitives.ts'
import { on_indexeddb } from '../indexeddb/storage.ts'
import { on_the_oracle } from './harness.ts'
import { stories_of_the_stack } from './stories.ts'

// The scenarios of stage 1 with every phone on IndexedDB (step 21; STK-6,
// TST-1, WEB-13): the conformance of the node's storage, the same seven
// scenarios as on the oracle (`stack.test.ts`), under both fault plans, each
// phone its own database on fake-indexeddb, its writer by Node's Web Locks.
vi.setConfig({ testTimeout: 15_000 })

stories_of_the_stack('on IndexedDB, fake primitives', {
  ...on_the_oracle(fake_primitives),
  storage: on_indexeddb,
})
