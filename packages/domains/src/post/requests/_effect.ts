// generated

// The effects of `post/requests` from `effect.ts` (DOM-25): the same objects
// under the same names, branded with their path (DOM-24), each schema with its
// output type under the same name, so that one import gives both. Only this
// module imports `effect.ts`.

import { z } from 'zod'
import * as effect from './effect.ts'

/**
 * Deposit a letter on the mailbox it is for, on its relays (PST-6): the
 * post's machine signs it with the face and seals it for theirs
 * (`dsl.a_letter_in_an_envelope` of the post), the mailbox port deposits it
 * (GR-6). Its key is the request's identity and the attempt. No return: a
 * key that takes no seal, or a relay that refuses the envelope, is a dead
 * letter, shown (DOM-15, F6). Its deposits reach the world in any order,
 * copies of one letter: a dead letter holds none behind it (SC-56).
 *
 * @see {@link effect.deposit_a_letter}
 */
export const deposit_a_letter =
  effect.deposit_a_letter.brand<'post/requests/effect/deposit_a_letter'>()
export type deposit_a_letter = z.output<typeof deposit_a_letter>

/**
 * Wait for the next quarter of a request's time (PST-6): no world, the
 * executor gives the payload back to its return, `send_a_request_again`,
 * which sends it again if it still waits.
 *
 * @see {@link effect.wait_to_send_again}
 */
export const wait_to_send_again =
  effect.wait_to_send_again.brand<'post/requests/effect/wait_to_send_again'>()
export type wait_to_send_again = z.output<typeof wait_to_send_again>

/**
 * Wait until a request's time is over (PST-7, V18): no world, the executor
 * gives the payload back to its return, `close_a_request_with_no_response`,
 * which closes it if no response came.
 *
 * @see {@link effect.wait_for_the_response}
 */
export const wait_for_the_response =
  effect.wait_for_the_response.brand<'post/requests/effect/wait_for_the_response'>()
export type wait_for_the_response = z.output<typeof wait_for_the_response>
