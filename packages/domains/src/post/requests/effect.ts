import { z } from 'zod'
import { effect, id, value } from './_scope_effect.ts'

/**
 * Deposit a letter on the mailbox it is for, on its relays (PST-6): the
 * post's machine signs it with the face and seals it for theirs
 * (`dsl.a_letter_in_an_envelope` of the post), the mailbox port deposits it
 * (GR-6). Its key is the request's identity and the attempt. No return: a
 * key that takes no seal, or a relay that refuses the envelope, is a dead
 * letter, shown (DOM-15, F6). Its deposits reach the world in any order,
 * copies of one letter: a dead letter holds none behind it (SC-56).
 */
export const deposit_a_letter = effect({
  payload: value.deposit,
  order: 'any',
})

/**
 * Wait for the next quarter of a request's time (PST-6): no world, the
 * executor gives the payload back to its return, `send_a_request_again`,
 * which sends it again if it still waits.
 */
export const wait_to_send_again = effect({
  payload: value.sending_again,
})

/**
 * Wait until a request's time is over (PST-7, V18): no world, the executor
 * gives the payload back to its return, `close_a_request_with_no_response`,
 * which closes it if no response came.
 */
export const wait_for_the_response = effect({
  payload: z.strictObject({
    request_id: id.request_id,
  }),
})
