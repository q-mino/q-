import { z } from 'zod'
import { command_use_case_over, read_use_case_over, chats, value } from './_scope_usecase.ts'

// The use cases of `self`, the leaves messaging adds to the local user's
// persona (EXT-1, EXT-16, MSG-7), below the kernel's node, which gives the
// root's context alone (EXT-11): what its part, the chat, invokes and
// follows. Each command answers in one event: her chat follows the
// messages through its read, not through the leaf that wrote them.

/** A message of a chat, as the part reads it. */
const a_message = z.strictObject({
  message_id: chats.id.message_id,
  place: value.place,
  text: value.text,
  at: value.instant,
  whose: value.whose,
})

/**
 * Anna writes «Ciao Bruno» in her chat with Bruno and taps «Invia» (MSG-2):
 * her message is written, and on its way. «Invia di nuovo» is this leaf
 * again with the same text, under a new operation: a message of its own
 * (MSG-13).
 */
export const write_a_message = command_use_case_over({
  use_case: chats.usecase.write_a_message,
  input: z.strictObject({ bond: chats.id.bond, text: value.text }),
  creator: () => (input) => ({ bond: input.bond, text: input.text }),
  events: {
    the_message_is_written: z.strictObject({ message_id: chats.id.message_id }),
    /** Never in messaging: a message is named by its operation; a leaf still names its rejection. */
    the_message_cannot_be_written: z.strictObject({}),
  },
  projection: {
    the_message_is_new_so_it_is_written: (fact) => ({
      event: 'the_message_is_written',
      payload: { message_id: fact.message.id },
    }),
    rejected: () => ({ event: 'the_message_cannot_be_written', payload: {} }),
  },
})

/**
 * The conversation shows Anna Bruno's messages and marks the chat read up
 * to the last one it showed (MSG-7): a part acting with no tap of hers,
 * told at activation (EXT-16). Up to it again, nothing changes.
 */
export const read_a_chat = command_use_case_over({
  use_case: chats.usecase.read_a_chat,
  input: z.strictObject({ bond: chats.id.bond, up_to: chats.id.message_id }),
  creator: () => (input) => ({ bond: input.bond, up_to: input.up_to }),
  events: {
    the_chat_is_read: z.strictObject({}),
    /** A message that is not of the chat: the chat is not read. */
    the_chat_cannot_be_read: z.strictObject({}),
  },
  projection: {
    the_message_is_after_what_she_read_so_the_chat_is_read: () => ({
      event: 'the_chat_is_read',
      payload: {},
    }),
    the_chat_is_read_up_to_it_already_so_it_is_read_again: () => ({
      event: 'the_chat_is_read',
      payload: {},
    }),
    rejected: () => ({ event: 'the_chat_cannot_be_read', payload: {} }),
  },
})

/**
 * Anna's conversation with Bruno (MSG-7): its messages, the newest first,
 * then each change as it comes, while the part shows it: a message written,
 * delivered, received.
 */
export const a_chat = read_use_case_over({
  use_case: chats.usecase.a_chat,
  input: z.strictObject({ bond: chats.id.bond }),
  creator: () => (input) => ({ query: { bond: input.bond } }),
  entry: a_message,
  projection: (entry) => ({
    message_id: entry.message_id,
    place: entry.place,
    text: entry.text,
    at: entry.at,
    whose: entry.whose,
  }),
  stream: { identity: 'message_id' },
})

/**
 * Bruno's row in Anna's contacts (MSG-7, MSG-15): their chat's last message
 * and how many of his are to read, then each change as it comes; nothing
 * before their first message.
 */
export const a_chat_at_a_glance = read_use_case_over({
  use_case: chats.usecase.a_chat_at_a_glance,
  input: z.strictObject({ bond: chats.id.bond }),
  creator: () => (input) => ({ query: { bond: input.bond } }),
  entry: z.strictObject({
    bond: chats.id.bond,
    the_last_message: a_message,
    to_read: value.to_read,
  }),
  projection: (entry) => ({
    bond: entry.bond,
    the_last_message: {
      message_id: entry.the_last_message.message_id,
      place: entry.the_last_message.place,
      text: entry.the_last_message.text,
      at: entry.the_last_message.at,
      whose: entry.the_last_message.whose,
    },
    to_read: entry.to_read,
  }),
  stream: { identity: 'bond' },
})
