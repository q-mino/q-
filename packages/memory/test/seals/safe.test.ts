import { fake_primitives } from './primitives.ts'
import { stories_of_the_safe } from './stories.ts'

// The safe's stories on q-'s oracle over the fake primitives port (TST-1,
// TST-3): the real machine, libsodium's adapter, runs the same suite from
// step 18, with the SLIP-0010 vectors.

stories_of_the_safe('over the fake primitives port', fake_primitives)
