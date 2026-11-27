import { z } from 'zod'
import { effect, id } from './_scope_effect.ts'

/**
 * Wait until the invitation can no longer be taken (INV-4). No world: the
 * executor gives the payload back to its return, `take_away_an_invitation`,
 * which takes it off the stand if nobody took it: time is not a fact, so an
 * invitation leaves its stand only through a command and its fact (D92.4).
 */
export const wait_until_it_can_no_longer_be_taken = effect({
  payload: z.strictObject({
    invitation_id: id.invitation_id,
  }),
})
