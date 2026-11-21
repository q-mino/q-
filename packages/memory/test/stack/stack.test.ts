import { libsodium_primitives } from '@q-mino/adapters-common'
import { fake_primitives } from '../seals/primitives.ts'
import { on_the_oracle } from './harness.ts'
import { stories_of_the_stack } from './stories.ts'

// The scenarios of stage 1 on the `memory` stack (step 17; TST-1, TST-4,
// SEA-9): on q-'s oracle over the safe's fake primitives port, under both
// fault plans; over libsodium's adapter, under the lossy plan.

stories_of_the_stack('on the oracle, fake primitives', on_the_oracle(fake_primitives))
stories_of_the_stack('on the oracle, libsodium', on_the_oracle(await libsodium_primitives()), [
  'lossy',
])
