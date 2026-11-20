import { z } from 'zod'
import { effect, id } from './_scope_effect.ts'

// The safe's effects go to its machine, the primitives port (SEA-5): what a
// command cannot do, since its creator is pure and is given no randomness
// (GR-8), the world does, and gives back to the effect's return.

/**
 * Draw a seed for the face (SEA-3): 32 random bytes, and the face's keys at
 * index 0 under it (`dsl.a_new_seed_and_its_first_face`). The return,
 * `keep_a_new_seed_and_its_face`, keeps both.
 */
export const draw_a_seed_for_the_face = effect({
  payload: z.strictObject({
    face_id: id.face_id,
  }),
})

/**
 * Draw the mailbox key (SEA-4): a collect secret R of 32 random bytes and its
 * deposit address D (`dsl.a_new_mailbox_key`). The return,
 * `keep_a_mailbox_key`, keeps them.
 */
export const draw_the_mailbox_key = effect({
  payload: z.strictObject({
    mailbox_key_id: id.mailbox_key_id,
  }),
})
