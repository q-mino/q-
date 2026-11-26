import { command_use_case, read_use_case, command, effect, query } from './_scope_usecase.ts'

// The use cases of `chats`, its only entry (DOM-2): the leaves of its
// personas reach those of its door; the effect executor brings back what
// came of a message (DOM-14).

/** A message is written on a bond, and delivered there. */
export const write_a_message = command_use_case({ command: command.write_a_message })

/** A message is closed with what came back: the return of its delivery. */
export const close_a_message = command_use_case({
  command: command.close_a_message,
  returns_from: effect.deliver_a_message,
})

/** A bond's message is received. */
export const receive_a_message = command_use_case({ command: command.receive_a_message })

/** A chat is read up to a message. */
export const read_a_chat = command_use_case({ command: command.read_a_chat })

/** A chat's messages, the newest first. */
export const a_chat = read_use_case({ query: query.a_chat })

/** A chat at a glance: its last message, how many to read. */
export const a_chat_at_a_glance = read_use_case({ query: query.a_chat_at_a_glance })
