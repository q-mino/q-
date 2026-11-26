// generated

// The selection predicates of `business/chats` from `message_selection.ts`
// (DOM-25): the same objects under the same names, branded with their path
// (DOM-24), each schema with its output type under the same name, so that one
// import gives both. Only this module imports `message_selection.ts`.

import { z } from 'zod'
import * as selection from './message_selection.ts'

/**
 * The message is filed in the chat of this bond.
 *
 * @see {@link selection.the_message_is_of_this_chat}
 */
export const the_message_is_of_this_chat =
  selection.the_message_is_of_this_chat.brand<'business/chats/selection/message/the_message_is_of_this_chat'>()
export type the_message_is_of_this_chat = z.output<typeof the_message_is_of_this_chat>
