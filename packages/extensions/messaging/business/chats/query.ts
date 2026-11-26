import { z } from 'zod'
import { query, chat_selection, id, message_selection, value } from './_scope_query.ts'

// The reads of the chats (MSG-7): a chat's messages, and a chat at a glance.

/**
 * Anna's chat with Bruno: its messages, written and received, the newest
 * first, in the order her node filed them (MSG-5), each of hers with its
 * stage (MSG-13), each of his with the time his letter declared.
 */
export const a_chat = query({
  input: z.strictObject({
    bond: id.bond,
  }),
  fields: value.a_message_of_a_chat,
  identity: 'message_id',
  selection: message_selection.the_message_is_of_this_chat,
  order: { place: 'descending' },
  creator: () => (input) => ({
    selection: { bond: input.bond },
  }),
})

/**
 * Anna's chat with Bruno at a glance, for his row in her contacts (MSG-7):
 * the last message, and how many of his she has to read. None before the
 * chat's first message.
 */
export const a_chat_at_a_glance = query({
  input: z.strictObject({
    bond: id.bond,
  }),
  fields: value.a_chat_at_a_glance,
  identity: 'bond',
  selection: chat_selection.the_chat_is_of_this_bond,
  order: { bond: 'ascending' },
  creator: () => (input) => ({
    selection: { bond: input.bond },
  }),
})
