// generated

// The values of `post/requests` from `value.ts` (DOM-25): the same objects
// under the same names, each schema with its output type under the same name,
// so that one import gives both. Only this module imports `value.ts`.

import { z } from 'zod'
import * as value from './value.ts'

/**
 * How long a request waits for its response, in seconds (F7, V18): the
 * asker's, a value of its business (ping pong's 60 seconds); at most the
 * seven days a relay keeps its letter (MBX-2).
 *
 * @see {@link value.waiting_time}
 */
export const waiting_time = value.waiting_time
export type waiting_time = z.output<typeof waiting_time>

/**
 * A letter to deposit (PST-6): the letter, the face of the node's user that
 * signs it, the key of the face it is sealed for, and the relays of the
 * mailbox it is for. All a deposit needs, since a creator reads no state:
 * the same letter every time it is sent.
 *
 * @see {@link value.deposit}
 */
export const deposit = value.deposit
export type deposit = z.output<typeof deposit>

/**
 * The next sending of a request that waits (PST-6): the attempt it is, the
 * instant its time is over, and the letter to deposit again.
 *
 * @see {@link value.sending_again}
 */
export const sending_again = value.sending_again
export type sending_again = z.output<typeof sending_again>

/**
 * A request waiting for its response (PST-5): sent, sent again while it waits within its time.
 *
 * @see {@link value.waiting_request}
 */
export const waiting_request = value.waiting_request
export type waiting_request = z.output<typeof waiting_request>

/**
 * A request answered (PST-7): the event of the response its face sent, the first that came.
 *
 * @see {@link value.answered_request}
 */
export const answered_request = value.answered_request
export type answered_request = z.output<typeof answered_request>

/**
 * A request whose time was over with no response (PST-7, V18).
 *
 * @see {@link value.request_with_no_response}
 */
export const request_with_no_response = value.request_with_no_response
export type request_with_no_response = z.output<typeof request_with_no_response>

/**
 * A request of the port, in its states.
 *
 * @see {@link value.request}
 */
export const request = value.request
export type request = z.output<typeof request>

/**
 * The answer the port keeps under a request's identity (F7, PST-8): still
 * waiting, the response's event, or no response; kept as long as the
 * request, forever in the prototype (DOM-11).
 *
 * @see {@link value.answer}
 */
export const answer = value.answer
export type answer = z.output<typeof answer>

/**
 * A request as the port reads it: its identity and its answer.
 *
 * @see {@link value.request_card}
 */
export const request_card = value.request_card
export type request_card = z.output<typeof request_card>
