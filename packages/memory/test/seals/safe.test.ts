import { libsodium_primitives } from '@q-mino/adapters-common'
import { fake_primitives } from './primitives.ts'
import { stories_of_the_safe } from './stories.ts'

// The safe's stories on q-'s oracle (TST-1, TST-3, SEA-8): over the fake
// primitives port, and over libsodium's adapter, the real machine (SEA-9),
// whose SLIP-0010 vectors are its own tests (`adapters-common`).

stories_of_the_safe('over the fake primitives port', fake_primitives)
stories_of_the_safe('over libsodium', await libsodium_primitives())
