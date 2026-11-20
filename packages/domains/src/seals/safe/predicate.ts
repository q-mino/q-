import { z } from 'zod'
import { predicate, id } from './_scope_predicate.ts'

// The vocabulary of the conditions. A predicate declares its parameters;
// its value is the adapters', helped by dsl.ts.

/** A face with this id is in the safe, being made or made. */
export const a_face_has_this_id = predicate({
  parameters: z.strictObject({
    face_id: id.face_id,
  }),
})

/** This face is being made: its seed is being drawn. */
export const the_face_is_being_made = predicate({
  parameters: z.strictObject({
    face_id: id.face_id,
  }),
})

/** A mailbox key with this id is in the safe, being drawn or drawn. */
export const a_mailbox_key_has_this_id = predicate({
  parameters: z.strictObject({
    mailbox_key_id: id.mailbox_key_id,
  }),
})

/** This mailbox key is being drawn: its collect secret is not in the safe yet. */
export const the_mailbox_key_is_being_drawn = predicate({
  parameters: z.strictObject({
    mailbox_key_id: id.mailbox_key_id,
  }),
})
