// generated

// The selection predicates of `business/chats` from `chat_selection.ts`
// (DOM-25): the same objects under the same names, branded with their path
// (DOM-24), each schema with its output type under the same name, so that one
// import gives both. Only this module imports `chat_selection.ts`.

import { z } from 'zod'
import * as selection from './chat_selection.ts'

/**
 * The chat is the one of this bond.
 *
 * @see {@link selection.the_chat_is_of_this_bond}
 */
export const the_chat_is_of_this_bond =
  selection.the_chat_is_of_this_bond.brand<'business/chats/selection/chat/the_chat_is_of_this_bond'>()
export type the_chat_is_of_this_bond = z.output<typeof the_chat_is_of_this_bond>
