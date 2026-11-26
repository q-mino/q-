// generated

// The use cases of `persona/self` from `usecase.ts` (DOM-25): the same objects
// under the same names, each schema with its output type under the same name,
// so that one import gives both. Only this module imports `usecase.ts`.

import { z } from 'zod'
import * as usecase from './usecase.ts'

/**
 * Anna writes «Ciao Bruno» in her chat with Bruno and taps «Invia» (MSG-2):
 * her message is written, and on its way. «Invia di nuovo» is this leaf
 * again with the same text, under a new operation: a message of its own
 * (MSG-13).
 *
 * @see {@link usecase.write_a_message}
 */
export const write_a_message = usecase.write_a_message

/**
 * The input of `write_a_message`, declared inline.
 *
 * @see {@link usecase.write_a_message}
 */
export const write_a_message_input = usecase.write_a_message.input
export type write_a_message_input = z.output<typeof write_a_message_input>

/**
 * The conversation shows Anna Bruno's messages and marks the chat read up
 * to the last one it showed (MSG-7): a part acting with no tap of hers,
 * told at activation (EXT-16). Up to it again, nothing changes.
 *
 * @see {@link usecase.read_a_chat}
 */
export const read_a_chat = usecase.read_a_chat

/**
 * The input of `read_a_chat`, declared inline.
 *
 * @see {@link usecase.read_a_chat}
 */
export const read_a_chat_input = usecase.read_a_chat.input
export type read_a_chat_input = z.output<typeof read_a_chat_input>

/**
 * Anna's conversation with Bruno (MSG-7): its messages, the newest first,
 * then each change as it comes, while the part shows it: a message written,
 * delivered, received.
 *
 * @see {@link usecase.a_chat}
 */
export const a_chat = usecase.a_chat

/**
 * The input of `a_chat`, declared inline.
 *
 * @see {@link usecase.a_chat}
 */
export const a_chat_input = usecase.a_chat.input
export type a_chat_input = z.output<typeof a_chat_input>

/**
 * Bruno's row in Anna's contacts (MSG-7, MSG-15): their chat's last message
 * and how many of his are to read, then each change as it comes; nothing
 * before their first message.
 *
 * @see {@link usecase.a_chat_at_a_glance}
 */
export const a_chat_at_a_glance = usecase.a_chat_at_a_glance

/**
 * The input of `a_chat_at_a_glance`, declared inline.
 *
 * @see {@link usecase.a_chat_at_a_glance}
 */
export const a_chat_at_a_glance_input = usecase.a_chat_at_a_glance.input
export type a_chat_at_a_glance_input = z.output<typeof a_chat_at_a_glance_input>
