import { z } from 'zod'
import { effect, id } from './_scope_effect.ts'

/**
 * Wait seven days from the deposit (MBX-2). No world: the executor gives the
 * payload back to its return, `discard_an_envelope`, which throws the
 * envelope away, collected or not: time is not a fact, so an envelope leaves
 * its mailbox only through a command and its fact (D92.4).
 */
export const wait_seven_days_from_the_deposit = effect({
  payload: z.strictObject({
    deposit_id: id.deposit_id,
  }),
})
