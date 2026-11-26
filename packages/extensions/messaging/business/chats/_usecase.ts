// generated

// The use cases of `business/chats` from `usecase.ts` (DOM-25): the same
// objects under the same names, each schema with its output type under the same
// name, so that one import gives both. Only this module imports `usecase.ts`.

import * as usecase from './usecase.ts'

/**
 * A message is written on a bond, and delivered there.
 *
 * @see {@link usecase.write_a_message}
 */
export const write_a_message = usecase.write_a_message

/**
 * A message is closed with what came back: the return of its delivery.
 *
 * @see {@link usecase.close_a_message}
 */
export const close_a_message = usecase.close_a_message

/**
 * A bond's message is received.
 *
 * @see {@link usecase.receive_a_message}
 */
export const receive_a_message = usecase.receive_a_message

/**
 * A chat is read up to a message.
 *
 * @see {@link usecase.read_a_chat}
 */
export const read_a_chat = usecase.read_a_chat

/**
 * A chat's messages, the newest first.
 *
 * @see {@link usecase.a_chat}
 */
export const a_chat = usecase.a_chat

/**
 * A chat at a glance: its last message, how many to read.
 *
 * @see {@link usecase.a_chat_at_a_glance}
 */
export const a_chat_at_a_glance = usecase.a_chat_at_a_glance
