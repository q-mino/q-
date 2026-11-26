// generated

// The predicates of `business/chats` from `predicate.ts` (DOM-25): the same
// objects under the same names, branded with their path (DOM-24), each schema
// with its output type under the same name, so that one import gives both. Only
// this module imports `predicate.ts`.

import { z } from 'zod'
import * as predicate from './predicate.ts'

/**
 * A message with this identity is filed in the bond's chat, written or received.
 *
 * @see {@link predicate.a_message_has_this_id}
 */
export const a_message_has_this_id =
  predicate.a_message_has_this_id.brand<'business/chats/predicate/a_message_has_this_id'>()
export type a_message_has_this_id = z.output<typeof a_message_has_this_id>

/**
 * This message of hers waits for what comes back: written, not closed.
 *
 * @see {@link predicate.the_message_waits}
 */
export const the_message_waits =
  predicate.the_message_waits.brand<'business/chats/predicate/the_message_waits'>()
export type the_message_waits = z.output<typeof the_message_waits>

/**
 * What came back of a message is its receipt: a predicate over what the return is given, its meaning the dsl's.
 *
 * @see {@link predicate.the_message_was_received}
 */
export const the_message_was_received =
  predicate.the_message_was_received.brand<'business/chats/predicate/the_message_was_received'>()
export type the_message_was_received = z.output<typeof the_message_was_received>

/**
 * What came back of a message is no receipt within its wait.
 *
 * @see {@link predicate.the_message_had_no_receipt}
 */
export const the_message_had_no_receipt =
  predicate.the_message_had_no_receipt.brand<'business/chats/predicate/the_message_had_no_receipt'>()
export type the_message_had_no_receipt = z.output<typeof the_message_had_no_receipt>

/**
 * What came back of a message is a peer that cannot receive it.
 *
 * @see {@link predicate.the_peer_cannot_receive_it}
 */
export const the_peer_cannot_receive_it =
  predicate.the_peer_cannot_receive_it.brand<'business/chats/predicate/the_peer_cannot_receive_it'>()
export type the_peer_cannot_receive_it = z.output<typeof the_peer_cannot_receive_it>

/**
 * What came back of a message is its calling off, her own gesture.
 *
 * @see {@link predicate.the_message_was_called_off}
 */
export const the_message_was_called_off =
  predicate.the_message_was_called_off.brand<'business/chats/predicate/the_message_was_called_off'>()
export type the_message_was_called_off = z.output<typeof the_message_was_called_off>

/**
 * The bond's chat is read up to this message of it, or a later one.
 *
 * @see {@link predicate.the_chat_is_read_up_to_it}
 */
export const the_chat_is_read_up_to_it =
  predicate.the_chat_is_read_up_to_it.brand<'business/chats/predicate/the_chat_is_read_up_to_it'>()
export type the_chat_is_read_up_to_it = z.output<typeof the_chat_is_read_up_to_it>
