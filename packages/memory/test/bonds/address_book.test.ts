import { fake_primitives } from '../seals/primitives.ts'
import { stories_of_the_address_book } from './stories.ts'

// The address book's stories on q-'s oracle over the safe's fake primitives
// port (TST-1, TST-3, SEA-8): libsodium's adapter runs the same suite from
// step 18.

stories_of_the_address_book('over the fake primitives port', fake_primitives)
