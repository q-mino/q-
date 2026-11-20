import { z } from 'zod'
import { fact, value } from './_scope_fact.ts'

// The facts of the safe carry its secrets, since they carry the change of
// its state (DOM-5, V9), which holds them: no more than the state, which
// stays in the node (SEA-7).

/** A face has been asked for (SEA-3): the safe is drawing the seed it will be made from. */
export const a_face_has_been_asked_for = fact({
  payload: z.strictObject({
    face_being_made: value.face_being_made,
  }),
})

/**
 * The safe has drawn a new seed and made the face from it (SEA-2, SEA-3):
 * the seed, which its next face will take at index 1, and the face at
 * index 0, with its keys.
 */
export const a_face_has_been_made_from_a_new_seed = fact({
  payload: z.strictObject({
    new_seed: value.seed,
    made_face: value.made_face,
  }),
})

/** A mailbox key has been asked for (SEA-4): the safe is drawing its collect secret. */
export const a_mailbox_key_has_been_asked_for = fact({
  payload: z.strictObject({
    mailbox_key_being_drawn: value.mailbox_key_being_drawn,
  }),
})

/** The safe has drawn a mailbox key (SEA-4): its collect secret R and its deposit address D. */
export const a_mailbox_key_has_been_drawn = fact({
  payload: z.strictObject({
    drawn_mailbox_key: value.drawn_mailbox_key,
  }),
})
