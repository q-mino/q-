import { z } from 'zod'
import { predicate, id, value } from './_scope_predicate.ts'

// The vocabulary of the conditions. A predicate declares its parameters;
// its value is the adapters', helped by dsl.ts. A message is found in its
// chat's folder: the bond and the message (MSG-1).

/** A message with this identity is filed in the bond's chat, written or received. */
export const a_message_has_this_id = predicate({
  parameters: z.strictObject({
    bond: id.bond,
    message_id: id.message_id,
  }),
})

/** This message of hers waits for what comes back: written, not closed. */
export const the_message_waits = predicate({
  parameters: z.strictObject({
    bond: id.bond,
    message_id: id.message_id,
  }),
})

/** What came back of a message is its receipt: a predicate over what the return is given, its meaning the dsl's. */
export const the_message_was_received = predicate({
  parameters: z.strictObject({
    what_came_back: value.what_came_back,
  }),
})

/** What came back of a message is no receipt within its wait. */
export const the_message_had_no_receipt = predicate({
  parameters: z.strictObject({
    what_came_back: value.what_came_back,
  }),
})

/** What came back of a message is a peer that cannot receive it. */
export const the_peer_cannot_receive_it = predicate({
  parameters: z.strictObject({
    what_came_back: value.what_came_back,
  }),
})

/** What came back of a message is its calling off, her own gesture. */
export const the_message_was_called_off = predicate({
  parameters: z.strictObject({
    what_came_back: value.what_came_back,
  }),
})

/** The bond's chat is read up to this message of it, or a later one. */
export const the_chat_is_read_up_to_it = predicate({
  parameters: z.strictObject({
    bond: id.bond,
    message_id: id.message_id,
  }),
})
