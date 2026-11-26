// generated

// The facts of `business/chats` from `fact.ts` (DOM-25): the same objects under
// the same names, branded with their path (DOM-24), each schema with its output
// type under the same name, so that one import gives both. Only this module
// imports `fact.ts`.

import { z } from 'zod'
import * as fact from './fact.ts'

/**
 * A message has been written on a bond (F4, MSG-2): on its way, waiting for its receipt.
 *
 * @see {@link fact.a_message_has_been_written}
 */
export const a_message_has_been_written =
  fact.a_message_has_been_written.brand<'business/chats/fact/a_message_has_been_written'>()
export type a_message_has_been_written = z.output<typeof a_message_has_been_written>

/**
 * A message has been delivered: the peer's node received it, and its response is the receipt (MSG-3).
 *
 * @see {@link fact.a_message_has_been_delivered}
 */
export const a_message_has_been_delivered =
  fact.a_message_has_been_delivered.brand<'business/chats/fact/a_message_has_been_delivered'>()
export type a_message_has_been_delivered = z.output<typeof a_message_has_been_delivered>

/**
 * A message has had no receipt within its wait: the peer's node was off for
 * seven days, did not have messaging for the bond, or a letter was lost
 * (F8). Never "not received" (MSG-12).
 *
 * @see {@link fact.a_message_has_had_no_receipt}
 */
export const a_message_has_had_no_receipt =
  fact.a_message_has_had_no_receipt.brand<'business/chats/fact/a_message_has_had_no_receipt'>()
export type a_message_has_had_no_receipt = z.output<typeof a_message_has_had_no_receipt>

/**
 * A message could not be delivered: the peer's node answered with no receipt (it does not know the bond, or speaks no version of the message).
 *
 * @see {@link fact.a_message_could_not_be_delivered}
 */
export const a_message_could_not_be_delivered =
  fact.a_message_could_not_be_delivered.brand<'business/chats/fact/a_message_could_not_be_delivered'>()
export type a_message_could_not_be_delivered = z.output<typeof a_message_could_not_be_delivered>

/**
 * A message has been called off: she deactivated messaging, or withdrew it from the bond, while it waited (EXT-12, F7).
 *
 * @see {@link fact.a_message_has_been_called_off}
 */
export const a_message_has_been_called_off =
  fact.a_message_has_been_called_off.brand<'business/chats/fact/a_message_has_been_called_off'>()
export type a_message_has_been_called_off = z.output<typeof a_message_has_been_called_off>

/**
 * A bond's message has been received (MSG-3, MSG-6), with what her node can tell of it.
 *
 * @see {@link fact.a_message_has_been_received}
 */
export const a_message_has_been_received =
  fact.a_message_has_been_received.brand<'business/chats/fact/a_message_has_been_received'>()
export type a_message_has_been_received = z.output<typeof a_message_has_been_received>

/**
 * A chat has been read up to a message of it (MSG-7): theirs after it are to read.
 *
 * @see {@link fact.a_chat_has_been_read}
 */
export const a_chat_has_been_read =
  fact.a_chat_has_been_read.brand<'business/chats/fact/a_chat_has_been_read'>()
export type a_chat_has_been_read = z.output<typeof a_chat_has_been_read>

/**
 * A chat has been read again up to a message it was read up to already, or one before (DOM-6): nothing changes.
 *
 * @see {@link fact.a_chat_has_been_read_again}
 */
export const a_chat_has_been_read_again =
  fact.a_chat_has_been_read_again.brand<'business/chats/fact/a_chat_has_been_read_again'>()
export type a_chat_has_been_read_again = z.output<typeof a_chat_has_been_read_again>
