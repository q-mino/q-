// generated

// The facts of `post/requests` from `fact.ts` (DOM-25): the same objects under
// the same names, branded with their path (DOM-24), each schema with its output
// type under the same name, so that one import gives both. Only this module
// imports `fact.ts`.

import { z } from 'zod'
import * as fact from './fact.ts'

/**
 * A request has been sent (PST-5): its letter deposited on the mailbox of the face it goes to, waiting until its time is over.
 *
 * @see {@link fact.a_request_has_been_sent}
 */
export const a_request_has_been_sent =
  fact.a_request_has_been_sent.brand<'post/requests/fact/a_request_has_been_sent'>()
export type a_request_has_been_sent = z.output<typeof a_request_has_been_sent>

/**
 * A request waiting has been sent again (PST-6): the same letter, deposited again.
 *
 * @see {@link fact.a_request_has_been_sent_again}
 */
export const a_request_has_been_sent_again =
  fact.a_request_has_been_sent_again.brand<'post/requests/fact/a_request_has_been_sent_again'>()
export type a_request_has_been_sent_again = z.output<typeof a_request_has_been_sent_again>

/**
 * The time to send a request again came after it closed, or after its time (PST-6): nothing was sent.
 *
 * @see {@link fact.the_time_to_send_again_came_too_late}
 */
export const the_time_to_send_again_came_too_late =
  fact.the_time_to_send_again_came_too_late.brand<'post/requests/fact/the_time_to_send_again_came_too_late'>()
export type the_time_to_send_again_came_too_late = z.output<
  typeof the_time_to_send_again_came_too_late
>

/**
 * A request has been answered (PST-7): the event of the response its face sent.
 *
 * @see {@link fact.a_request_has_been_answered}
 */
export const a_request_has_been_answered =
  fact.a_request_has_been_answered.brand<'post/requests/fact/a_request_has_been_answered'>()
export type a_request_has_been_answered = z.output<typeof a_request_has_been_answered>

/**
 * A request had no response in its time (PST-7, V18).
 *
 * @see {@link fact.a_request_had_no_response}
 */
export const a_request_had_no_response =
  fact.a_request_had_no_response.brand<'post/requests/fact/a_request_had_no_response'>()
export type a_request_had_no_response = z.output<typeof a_request_had_no_response>

/**
 * A request waiting has been called off (F7, EXT-7): the user deactivated
 * its extension, or withdrew its offer from the bond; sent again no more.
 *
 * @see {@link fact.a_request_has_been_called_off}
 */
export const a_request_has_been_called_off =
  fact.a_request_has_been_called_off.brand<'post/requests/fact/a_request_has_been_called_off'>()
export type a_request_has_been_called_off = z.output<typeof a_request_has_been_called_off>

/**
 * The time of a request came after it was called off (PST-7): nothing changes.
 *
 * @see {@link fact.the_call_off_came_before_the_time}
 */
export const the_call_off_came_before_the_time =
  fact.the_call_off_came_before_the_time.brand<'post/requests/fact/the_call_off_came_before_the_time'>()
export type the_call_off_came_before_the_time = z.output<typeof the_call_off_came_before_the_time>

/**
 * The time of a request came after its response (PST-7): nothing changes.
 *
 * @see {@link fact.the_response_came_before_the_time}
 */
export const the_response_came_before_the_time =
  fact.the_response_came_before_the_time.brand<'post/requests/fact/the_response_came_before_the_time'>()
export type the_response_came_before_the_time = z.output<typeof the_response_came_before_the_time>
