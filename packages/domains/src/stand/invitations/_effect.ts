// generated

// The effects of `stand/invitations` from `effect.ts` (DOM-25): the same
// objects under the same names, branded with their path (DOM-24), each schema
// with its output type under the same name, so that one import gives both. Only
// this module imports `effect.ts`.

import { z } from 'zod'
import * as effect from './effect.ts'

/**
 * Wait until the invitation can no longer be taken (INV-4). No world: the
 * executor gives the payload back to its return, `take_away_an_invitation`,
 * which takes it off the stand if nobody took it: time is not a fact, so an
 * invitation leaves its stand only through a command and its fact (D92.4).
 *
 * @see {@link effect.wait_until_it_can_no_longer_be_taken}
 */
export const wait_until_it_can_no_longer_be_taken =
  effect.wait_until_it_can_no_longer_be_taken.brand<'stand/invitations/effect/wait_until_it_can_no_longer_be_taken'>()
export type wait_until_it_can_no_longer_be_taken = z.output<
  typeof wait_until_it_can_no_longer_be_taken
>
