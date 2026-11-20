// generated

// The commands of `post/requests` from `command.ts` (DOM-25): the same objects
// under the same names, each schema with its output type under the same name,
// so that one import gives both. Only this module imports `command.ts`.

import { z } from 'zod'
import * as command from './command.ts'

/**
 * No request has this identity: the port has not sent it.
 *
 * @see {@link command.the_request_is_new}
 */
export const the_request_is_new = command.the_request_is_new
export type the_request_is_new = z.output<typeof the_request_is_new>

/**
 * Anna's ping pong asks Bruno for a pong (F7, PST-5): the kernel's port of
 * requests sends the request on their bond, its identity the one the kernel
 * composed (`dsl.the_identity_of_a_request` of the post), from Anna's face
 * to Bruno's mailbox, for the time her extension waits. The letter is
 * deposited, sent again at each quarter of its time while it waits, and
 * closed with no response when its time is over. Called again under its
 * identity, after a fall, it is the recorded fact (DOM-11): the time stays
 * the one of the first call.
 *
 * @see {@link command.send_a_request}
 */
export const send_a_request = command.send_a_request

/**
 * The input of `send_a_request`, declared inline.
 *
 * @see {@link command.send_a_request}
 */
export const send_a_request_input = command.send_a_request.input
export type send_a_request_input = z.output<typeof send_a_request_input>

/**
 * The request waits for its response, and its time is not over.
 *
 * @see {@link command.the_request_waits_within_its_time}
 */
export const the_request_waits_within_its_time = command.the_request_waits_within_its_time
export type the_request_waits_within_its_time = z.output<typeof the_request_waits_within_its_time>

/**
 * The request waits no more: it closed, or its time is over.
 *
 * @see {@link command.the_request_waits_no_more}
 */
export const the_request_waits_no_more = command.the_request_waits_no_more
export type the_request_waits_no_more = z.output<typeof the_request_waits_no_more>

/**
 * A quarter of the request's time has passed with no response (PST-6): the
 * post deposits the same letter again, under the same identity, so that a
 * response lost on its way comes again (F7: the peer answers from its
 * recorded fact), and waits for the next quarter. Closed, or its time over,
 * nothing is sent. Its input is the payload of the wait; its operation is
 * the entry's (DOM-14).
 *
 * @see {@link command.send_a_request_again}
 */
export const send_a_request_again = command.send_a_request_again

/**
 * The input of `send_a_request_again`, declared inline.
 *
 * @see {@link command.send_a_request_again}
 */
export const send_a_request_again_input = command.send_a_request_again.input
export type send_a_request_again_input = z.output<typeof send_a_request_again_input>

/**
 * The request is closed: answered, since only this command closes it otherwise.
 *
 * @see {@link command.the_request_is_closed}
 */
export const the_request_is_closed = command.the_request_is_closed
export type the_request_is_closed = z.output<typeof the_request_is_closed>

/**
 * Bruno's phone stayed off for the 60 seconds of Anna's ping (PST-7, V18):
 * her request's time is over with no response, which the port gives the
 * delivery as `no_response`. A response came first: nothing changes. Its
 * input is the payload of the wait; its operation is the entry's (DOM-14).
 *
 * @see {@link command.close_a_request_with_no_response}
 */
export const close_a_request_with_no_response = command.close_a_request_with_no_response

/**
 * The input of `close_a_request_with_no_response`, declared inline.
 *
 * @see {@link command.close_a_request_with_no_response}
 */
export const close_a_request_with_no_response_input = command.close_a_request_with_no_response.input
export type close_a_request_with_no_response_input = z.output<
  typeof close_a_request_with_no_response_input
>

/**
 * The request waits, and it went to the face that answers.
 *
 * @see {@link command.the_request_waits_for_this_face}
 */
export const the_request_waits_for_this_face = command.the_request_waits_for_this_face
export type the_request_waits_for_this_face = z.output<typeof the_request_waits_for_this_face>

/**
 * Bruno's pong comes back to Anna's phone (F7, PST-7): a response from the
 * face her request went to, while it waits, answers it with its event,
 * which the port gives the delivery. The kernel's entry invokes it with an
 * opened response signed by a face (`a_face`), under the response's
 * identity: the same response again is the recorded fact (DOM-11). A second
 * response that differs, a late one, one to no request of the node's or
 * from another face is refused, and the kernel's trace keeps it (EXT-6): no
 * fact of the feature (F2, F6).
 *
 * @see {@link command.take_a_response}
 */
export const take_a_response = command.take_a_response

/**
 * The input of `take_a_response`, declared inline.
 *
 * @see {@link command.take_a_response}
 */
export const take_a_response_input = command.take_a_response.input
export type take_a_response_input = z.output<typeof take_a_response_input>
