import { z } from 'zod'
import {
  command,
  identity_of,
  AND,
  NOT,
  pick,
  dsl,
  effect,
  fact,
  id,
  predicate,
  value,
} from './_scope_command.ts'

/** No message has this identity in the chat: the node has not recorded it. */
export const the_message_is_new = NOT(predicate.a_message_has_this_id)

/**
 * Anna writes «Ciao Bruno» in her chat with Bruno (MSG-2, F4): the office
 * files her message, named by the operation that writes it, and delivers it
 * on their bond, waiting seven days for its receipt. Written again under the
 * same operation, it is the recorded fact (DOM-11); «Invia di nuovo» is a
 * new operation, a message of its own (MSG-13).
 */
export const write_a_message = command({
  input: z.strictObject({
    bond: id.bond,
    text: value.text,
  }),
  outcomes: {
    the_message_is_new_so_it_is_written: [
      the_message_is_new,
      fact.a_message_has_been_written,
      pick(effect, 'deliver_a_message'),
    ],
  },
  creator: (context) => (input) => {
    const message_id = identity_of(id.message_id)(context.operation)
    return {
      the_message_is_new_so_it_is_written: [
        { bond: input.bond, message_id },
        {
          message: {
            id: message_id,
            bond: input.bond,
            text: input.text,
            written_at: context.now,
            waits: dsl.a_message_waits,
          },
        },
        {
          deliver_a_message: {
            id: message_id,
            payload: {
              message_id,
              bond: input.bond,
              text: input.text,
              waits: dsl.a_message_waits,
            },
          },
        },
      ],
    }
  },
})

/** The message waits, and it was received. */
export const the_message_waits_and_was_received = AND({
  the_message_waits: predicate.the_message_waits,
  it_was_received: predicate.the_message_was_received,
})

/** The message waits, and it had no receipt within its wait. */
export const the_message_waits_and_had_no_receipt = AND({
  the_message_waits: predicate.the_message_waits,
  it_had_no_receipt: predicate.the_message_had_no_receipt,
})

/** The message waits, and the peer cannot receive it. */
export const the_message_waits_and_the_peer_cannot_receive_it = AND({
  the_message_waits: predicate.the_message_waits,
  the_peer_cannot_receive_it: predicate.the_peer_cannot_receive_it,
})

/** The message waits, and she called it off. */
export const the_message_waits_and_was_called_off = AND({
  the_message_waits: predicate.the_message_waits,
  it_was_called_off: predicate.the_message_was_called_off,
})

/**
 * What came back of Anna's message closes it (MSG-2, EXT-12, DOM-13):
 * Bruno's receipt; no receipt within its seven days; a peer that cannot
 * receive it; or her own calling off, messaging deactivated or withdrawn
 * from the bond while it waited, each a happening of its own, with the
 * instant her node learned it. The return of `deliver_a_message`, its input
 * the office's closed set; the branch is chosen by what came back, a
 * predicate over the input, as PNG-2. A message that waits no more (closed,
 * or never written) is refused: a dead letter of the executor, shown.
 */
export const close_a_message = command({
  input: z.strictObject({
    bond: id.bond,
    message_id: id.message_id,
    what_came_back: value.what_came_back,
  }),
  outcomes: {
    the_message_was_received_so_it_is_delivered: [
      the_message_waits_and_was_received,
      fact.a_message_has_been_delivered,
    ],
    no_receipt_came_so_the_message_had_none: [
      the_message_waits_and_had_no_receipt,
      fact.a_message_has_had_no_receipt,
    ],
    the_peer_cannot_receive_it_so_it_could_not_be_delivered: [
      the_message_waits_and_the_peer_cannot_receive_it,
      fact.a_message_could_not_be_delivered,
    ],
    the_message_was_called_off_so_it_is_closed: [
      the_message_waits_and_was_called_off,
      fact.a_message_has_been_called_off,
    ],
  },
  creator: (context) => (input) => {
    const the_message_waits = { bond: input.bond, message_id: input.message_id }
    const what_came_back = { what_came_back: input.what_came_back }
    const closed = { bond: input.bond, message_id: input.message_id, at: context.now }
    return {
      the_message_was_received_so_it_is_delivered: [
        { the_message_waits, it_was_received: what_came_back },
        closed,
      ],
      no_receipt_came_so_the_message_had_none: [
        { the_message_waits, it_had_no_receipt: what_came_back },
        closed,
      ],
      the_peer_cannot_receive_it_so_it_could_not_be_delivered: [
        { the_message_waits, the_peer_cannot_receive_it: what_came_back },
        closed,
      ],
      the_message_was_called_off_so_it_is_closed: [
        { the_message_waits, it_was_called_off: what_came_back },
        closed,
      ],
    }
  },
})

/**
 * Bruno's node receives Anna's message on their bond (MSG-3, MSG-6, F7):
 * the office files it in their chat with the time her letter declares and
 * the instant his node received it, named by the operation of her request.
 * Her request sent again is the same operation: the recorded fact, one
 * message, one receipt (DOM-11).
 */
export const receive_a_message = command({
  input: z.strictObject({
    bond: id.bond,
    text: value.text,
    declared_at: value.instant,
  }),
  outcomes: {
    the_message_is_new_so_it_is_received: [the_message_is_new, fact.a_message_has_been_received],
  },
  creator: (context) => (input) => {
    const message_id = identity_of(id.message_id)(context.operation)
    return {
      the_message_is_new_so_it_is_received: [
        { bond: input.bond, message_id },
        {
          message: {
            id: message_id,
            bond: input.bond,
            text: input.text,
            declared_at: input.declared_at,
            received_at: context.now,
          },
        },
      ],
    }
  },
})

/** The message is of the chat, and the chat is not yet read up to it. */
export const the_message_is_after_what_she_read = AND({
  the_message_is_of_the_chat: predicate.a_message_has_this_id,
  it_is_not_read_yet: NOT(predicate.the_chat_is_read_up_to_it),
})

/** The message is of the chat, and the chat is read up to it already, or past it. */
export const the_chat_is_read_up_to_it_already = AND({
  the_message_is_of_the_chat: predicate.a_message_has_this_id,
  it_is_read: predicate.the_chat_is_read_up_to_it,
})

/**
 * Anna reads her chat with Bruno up to the last message the conversation
 * showed her (MSG-7): his messages after it stay to read. Up to the same
 * message again, or one before, it is read again: nothing changes (DOM-6).
 * A message that is not of the chat is refused: no branch reaches it.
 */
export const read_a_chat = command({
  input: z.strictObject({
    bond: id.bond,
    up_to: id.message_id,
  }),
  outcomes: {
    the_message_is_after_what_she_read_so_the_chat_is_read: [
      the_message_is_after_what_she_read,
      fact.a_chat_has_been_read,
    ],
    the_chat_is_read_up_to_it_already_so_it_is_read_again: [
      the_chat_is_read_up_to_it_already,
      fact.a_chat_has_been_read_again,
    ],
  },
  creator: (context) => (input) => {
    const the_message = { bond: input.bond, message_id: input.up_to }
    return {
      the_message_is_after_what_she_read_so_the_chat_is_read: [
        { the_message_is_of_the_chat: the_message, it_is_not_read_yet: the_message },
        { bond: input.bond, up_to: input.up_to, at: context.now },
      ],
      the_chat_is_read_up_to_it_already_so_it_is_read_again: [
        { the_message_is_of_the_chat: the_message, it_is_read: the_message },
        { bond: input.bond, up_to: input.up_to },
      ],
    }
  },
})
