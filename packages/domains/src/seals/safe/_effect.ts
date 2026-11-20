// generated

// The effects of `seals/safe` from `effect.ts` (DOM-25): the same objects under
// the same names, branded with their path (DOM-24), each schema with its output
// type under the same name, so that one import gives both. Only this module
// imports `effect.ts`.

import { z } from 'zod'
import * as effect from './effect.ts'

/**
 * Draw a seed for the face (SEA-3): 32 random bytes, and the face's keys at
 * index 0 under it (`dsl.a_new_seed_and_its_first_face`). The return,
 * `keep_a_new_seed_and_its_face`, keeps both.
 *
 * @see {@link effect.draw_a_seed_for_the_face}
 */
export const draw_a_seed_for_the_face =
  effect.draw_a_seed_for_the_face.brand<'seals/safe/effect/draw_a_seed_for_the_face'>()
export type draw_a_seed_for_the_face = z.output<typeof draw_a_seed_for_the_face>

/**
 * Draw the mailbox key (SEA-4): a collect secret R of 32 random bytes and its
 * deposit address D (`dsl.a_new_mailbox_key`). The return,
 * `keep_a_mailbox_key`, keeps them.
 *
 * @see {@link effect.draw_the_mailbox_key}
 */
export const draw_the_mailbox_key =
  effect.draw_the_mailbox_key.brand<'seals/safe/effect/draw_the_mailbox_key'>()
export type draw_the_mailbox_key = z.output<typeof draw_the_mailbox_key>
