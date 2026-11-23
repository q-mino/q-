import { libsodium_primitives } from '@q-mino/adapters-common'
import { fake_primitives } from '../seals/primitives.ts'
import { stories_of_the_post } from './stories.ts'

// The post's stories on q-'s oracle (TST-1, TST-3, PST-13): over the safe's
// fake primitives port, and over libsodium's adapter (SEA-9).

stories_of_the_post('over the fake primitives port', fake_primitives)
stories_of_the_post('over libsodium', await libsodium_primitives())
