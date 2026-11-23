// generated

// The effects of `mailbox/deposits` from `effect.ts` (DOM-25): the same objects
// under the same names, branded with their path (DOM-24), each schema with its
// output type under the same name, so that one import gives both. Only this
// module imports `effect.ts`.

import { z } from 'zod'
import * as effect from './effect.ts'

/**
 * Wait seven days from the deposit (MBX-2). No world: the executor gives the
 * payload back to its return, `discard_an_envelope`, which throws the
 * envelope away, collected or not: time is not a fact, so an envelope leaves
 * its mailbox only through a command and its fact (D92.4).
 *
 * @see {@link effect.wait_seven_days_from_the_deposit}
 */
export const wait_seven_days_from_the_deposit =
  effect.wait_seven_days_from_the_deposit.brand<'mailbox/deposits/effect/wait_seven_days_from_the_deposit'>()
export type wait_seven_days_from_the_deposit = z.output<typeof wait_seven_days_from_the_deposit>
