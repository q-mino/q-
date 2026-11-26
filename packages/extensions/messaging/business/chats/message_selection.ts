import { z } from 'zod'
import { selection, id } from './_scope_selection.ts'

// The selection predicates over the messages of the chats (DOM-18).

/** The message is filed in the chat of this bond. */
export const the_message_is_of_this_chat = selection({
  subject: 'message',
  parameters: z.strictObject({
    bond: id.bond,
  }),
})
