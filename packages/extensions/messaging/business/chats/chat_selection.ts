import { z } from 'zod'
import { selection, id } from './_scope_selection.ts'

// The selection predicates over the chats, one per bond (DOM-18).

/** The chat is the one of this bond. */
export const the_chat_is_of_this_bond = selection({
  subject: 'chat',
  parameters: z.strictObject({
    bond: id.bond,
  }),
})
