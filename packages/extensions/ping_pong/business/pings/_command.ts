// generated

// The commands of `business/pings` from `command.ts` (DOM-25): the same objects
// under the same names, each schema with its output type under the same name,
// so that one import gives both. Only this module imports `command.ts`.

import { z } from 'zod'
import * as command from './command.ts'

/**
 * No ping has this identity: the node has not sent it.
 *
 * @see {@link command.the_ping_is_new}
 */
export const the_ping_is_new = command.the_ping_is_new
export type the_ping_is_new = z.output<typeof the_ping_is_new>

/**
 * Anna pings her bond with Bruno (PNG-2, EXT-16): from the action on their
 * bond's screen, which gives the bond alone, the office sends her ping,
 * named by the operation that sends it, and asks Bruno's node for a pong,
 * waiting 60 seconds. Asked again under the same operation, it is the
 * recorded fact (DOM-11).
 *
 * @see {@link command.send_a_ping}
 */
export const send_a_ping = command.send_a_ping

/**
 * The input of `send_a_ping`, declared inline.
 *
 * @see {@link command.send_a_ping}
 */
export const send_a_ping_input = command.send_a_ping.input
export type send_a_ping_input = z.output<typeof send_a_ping_input>

/**
 * The ping waits, and its pong came back.
 *
 * @see {@link command.the_ping_waits_and_its_pong_came_back}
 */
export const the_ping_waits_and_its_pong_came_back = command.the_ping_waits_and_its_pong_came_back
export type the_ping_waits_and_its_pong_came_back = z.output<
  typeof the_ping_waits_and_its_pong_came_back
>

/**
 * The ping waits, and it had no response within its time.
 *
 * @see {@link command.the_ping_waits_and_had_no_response}
 */
export const the_ping_waits_and_had_no_response = command.the_ping_waits_and_had_no_response
export type the_ping_waits_and_had_no_response = z.output<typeof the_ping_waits_and_had_no_response>

/**
 * The ping waits, and the peer cannot answer it.
 *
 * @see {@link command.the_ping_waits_and_the_peer_cannot_answer}
 */
export const the_ping_waits_and_the_peer_cannot_answer =
  command.the_ping_waits_and_the_peer_cannot_answer
export type the_ping_waits_and_the_peer_cannot_answer = z.output<
  typeof the_ping_waits_and_the_peer_cannot_answer
>

/**
 * The ping waits, and the user called it off.
 *
 * @see {@link command.the_ping_waits_and_was_called_off}
 */
export const the_ping_waits_and_was_called_off = command.the_ping_waits_and_was_called_off
export type the_ping_waits_and_was_called_off = z.output<typeof the_ping_waits_and_was_called_off>

/**
 * What came back of Anna's ping closes it (PNG-2, EXT-12, DOM-13): Bruno's
 * pong; no response within its 60 seconds; a peer that cannot answer it;
 * or her own calling off, ping pong deactivated or withdrawn from the bond
 * while it waited (A, 21 Nov 2026: a meaning, not a fault), each a
 * happening of its own. The return of `ask_for_a_pong`, its
 * input the business's closed set; the branch is chosen by what came back,
 * a predicate over the input, as the office of the extensions learns or
 * has no answer (EXT-8). A ping that waits no more (closed, or never sent)
 * is refused: a dead letter of the executor, shown.
 *
 * @see {@link command.close_a_ping}
 */
export const close_a_ping = command.close_a_ping

/**
 * The input of `close_a_ping`, declared inline.
 *
 * @see {@link command.close_a_ping}
 */
export const close_a_ping_input = command.close_a_ping.input
export type close_a_ping_input = z.output<typeof close_a_ping_input>

/**
 * No pong has this identity: the node has not answered this request.
 *
 * @see {@link command.the_pong_is_new}
 */
export const the_pong_is_new = command.the_pong_is_new
export type the_pong_is_new = z.output<typeof the_pong_is_new>

/**
 * Bruno's node answers Anna's ping with a pong (PNG-3, F7): her ping came
 * on their bond, and the office gives back its pong, named by the
 * operation of her request. Her request sent again is the same operation:
 * the recorded fact, the same pong (DOM-11).
 *
 * @see {@link command.answer_a_ping}
 */
export const answer_a_ping = command.answer_a_ping

/**
 * The input of `answer_a_ping`, declared inline.
 *
 * @see {@link command.answer_a_ping}
 */
export const answer_a_ping_input = command.answer_a_ping.input
export type answer_a_ping_input = z.output<typeof answer_a_ping_input>
