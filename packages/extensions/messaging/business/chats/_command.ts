// generated

// The commands of `business/chats` from `command.ts` (DOM-25): the same objects
// under the same names, each schema with its output type under the same name,
// so that one import gives both. Only this module imports `command.ts`.

import { z } from 'zod'
import * as command from './command.ts'

/**
 * No message has this identity in the chat: the node has not recorded it.
 *
 * @see {@link command.the_message_is_new}
 */
export const the_message_is_new = command.the_message_is_new
export type the_message_is_new = z.output<typeof the_message_is_new>

/**
 * Anna writes «Ciao Bruno» in her chat with Bruno (MSG-2, F4): the office
 * files her message, named by the operation that writes it, and delivers it
 * on their bond, waiting seven days for its receipt. Written again under the
 * same operation, it is the recorded fact (DOM-11); «Invia di nuovo» is a
 * new operation, a message of its own (MSG-13).
 *
 * @see {@link command.write_a_message}
 */
export const write_a_message = command.write_a_message

/**
 * The input of `write_a_message`, declared inline.
 *
 * @see {@link command.write_a_message}
 */
export const write_a_message_input = command.write_a_message.input
export type write_a_message_input = z.output<typeof write_a_message_input>

/**
 * The message waits, and it was received.
 *
 * @see {@link command.the_message_waits_and_was_received}
 */
export const the_message_waits_and_was_received = command.the_message_waits_and_was_received
export type the_message_waits_and_was_received = z.output<typeof the_message_waits_and_was_received>

/**
 * The message waits, and it had no receipt within its wait.
 *
 * @see {@link command.the_message_waits_and_had_no_receipt}
 */
export const the_message_waits_and_had_no_receipt = command.the_message_waits_and_had_no_receipt
export type the_message_waits_and_had_no_receipt = z.output<
  typeof the_message_waits_and_had_no_receipt
>

/**
 * The message waits, and the peer cannot receive it.
 *
 * @see {@link command.the_message_waits_and_the_peer_cannot_receive_it}
 */
export const the_message_waits_and_the_peer_cannot_receive_it =
  command.the_message_waits_and_the_peer_cannot_receive_it
export type the_message_waits_and_the_peer_cannot_receive_it = z.output<
  typeof the_message_waits_and_the_peer_cannot_receive_it
>

/**
 * The message waits, and she called it off.
 *
 * @see {@link command.the_message_waits_and_was_called_off}
 */
export const the_message_waits_and_was_called_off = command.the_message_waits_and_was_called_off
export type the_message_waits_and_was_called_off = z.output<
  typeof the_message_waits_and_was_called_off
>

/**
 * What came back of Anna's message closes it (MSG-2, EXT-12, DOM-13):
 * Bruno's receipt; no receipt within its seven days; a peer that cannot
 * receive it; or her own calling off, messaging deactivated or withdrawn
 * from the bond while it waited, each a happening of its own, with the
 * instant her node learned it. The return of `deliver_a_message`, its input
 * the office's closed set; the branch is chosen by what came back, a
 * predicate over the input, as PNG-2. A message that waits no more (closed,
 * or never written) is refused: a dead letter of the executor, shown.
 *
 * @see {@link command.close_a_message}
 */
export const close_a_message = command.close_a_message

/**
 * The input of `close_a_message`, declared inline.
 *
 * @see {@link command.close_a_message}
 */
export const close_a_message_input = command.close_a_message.input
export type close_a_message_input = z.output<typeof close_a_message_input>

/**
 * Bruno's node receives Anna's message on their bond (MSG-3, MSG-6, F7):
 * the office files it in their chat with the time her letter declares and
 * the instant his node received it, named by the operation of her request.
 * Her request sent again is the same operation: the recorded fact, one
 * message, one receipt (DOM-11).
 *
 * @see {@link command.receive_a_message}
 */
export const receive_a_message = command.receive_a_message

/**
 * The input of `receive_a_message`, declared inline.
 *
 * @see {@link command.receive_a_message}
 */
export const receive_a_message_input = command.receive_a_message.input
export type receive_a_message_input = z.output<typeof receive_a_message_input>

/**
 * The message is of the chat, and the chat is not yet read up to it.
 *
 * @see {@link command.the_message_is_after_what_she_read}
 */
export const the_message_is_after_what_she_read = command.the_message_is_after_what_she_read
export type the_message_is_after_what_she_read = z.output<typeof the_message_is_after_what_she_read>

/**
 * The message is of the chat, and the chat is read up to it already, or past it.
 *
 * @see {@link command.the_chat_is_read_up_to_it_already}
 */
export const the_chat_is_read_up_to_it_already = command.the_chat_is_read_up_to_it_already
export type the_chat_is_read_up_to_it_already = z.output<typeof the_chat_is_read_up_to_it_already>

/**
 * Anna reads her chat with Bruno up to the last message the conversation
 * showed her (MSG-7): his messages after it stay to read. Up to the same
 * message again, or one before, it is read again: nothing changes (DOM-6).
 * A message that is not of the chat is refused: no branch reaches it.
 *
 * @see {@link command.read_a_chat}
 */
export const read_a_chat = command.read_a_chat

/**
 * The input of `read_a_chat`, declared inline.
 *
 * @see {@link command.read_a_chat}
 */
export const read_a_chat_input = command.read_a_chat.input
export type read_a_chat_input = z.output<typeof read_a_chat_input>
