import { z } from 'zod'
import { fact, id, value } from './_scope_fact.ts'

// The facts of `chats` (MSG-2, MSG-3, MSG-7; DOM-6: each names a
// happening). A message is written; it closes with one of four happenings,
// one fact each, since the office speaks of them as different happenings
// (DOM-6's criterion, as PNG-2); a message of a bond's is received; a chat
// is read up to a message. Each closing names the chat with the message:
// the office finds a message in its chat's folder (MSG-1).

/** A message has been written on a bond (F4, MSG-2): on its way, waiting for its receipt. */
export const a_message_has_been_written = fact({
  payload: z.strictObject({
    message: value.a_message_written,
  }),
})

/** A message has been delivered: the peer's node received it, and its response is the receipt (MSG-3). */
export const a_message_has_been_delivered = fact({
  payload: z.strictObject({
    bond: id.bond,
    message_id: id.message_id,
    at: value.instant,
  }),
})

/**
 * A message has had no receipt within its wait: the peer's node was off for
 * seven days, did not have messaging for the bond, or a letter was lost
 * (F8). Never "not received" (MSG-12).
 */
export const a_message_has_had_no_receipt = fact({
  payload: z.strictObject({
    bond: id.bond,
    message_id: id.message_id,
    at: value.instant,
  }),
})

/** A message could not be delivered: the peer's node answered with no receipt (it does not know the bond, or speaks no version of the message). */
export const a_message_could_not_be_delivered = fact({
  payload: z.strictObject({
    bond: id.bond,
    message_id: id.message_id,
    at: value.instant,
  }),
})

/** A message has been called off: she deactivated messaging, or withdrew it from the bond, while it waited (EXT-12, F7). */
export const a_message_has_been_called_off = fact({
  payload: z.strictObject({
    bond: id.bond,
    message_id: id.message_id,
    at: value.instant,
  }),
})

/** A bond's message has been received (MSG-3, MSG-6), with what her node can tell of it. */
export const a_message_has_been_received = fact({
  payload: z.strictObject({
    message: value.a_message_received,
  }),
})

/** A chat has been read up to a message of it (MSG-7): theirs after it are to read. */
export const a_chat_has_been_read = fact({
  payload: z.strictObject({
    bond: id.bond,
    up_to: id.message_id,
    at: value.instant,
  }),
})

/** A chat has been read again up to a message it was read up to already, or one before (DOM-6): nothing changes. */
export const a_chat_has_been_read_again = fact({
  payload: z.strictObject({
    bond: id.bond,
    up_to: id.message_id,
  }),
})
