// generated

// The commands of `seals/safe` from `command.ts` (DOM-25): the same objects
// under the same names, each schema with its output type under the same name,
// so that one import gives both. Only this module imports `command.ts`.

import { z } from 'zod'
import * as command from './command.ts'

/**
 * No face has the id the asker gives this one.
 *
 * @see {@link command.the_face_is_new}
 */
export const the_face_is_new = command.the_face_is_new
export type the_face_is_new = z.output<typeof the_face_is_new>

/**
 * No mailbox key has the id the asker gives this one.
 *
 * @see {@link command.the_mailbox_key_is_new}
 */
export const the_mailbox_key_is_new = command.the_mailbox_key_is_new
export type the_mailbox_key_is_new = z.output<typeof the_mailbox_key_is_new>

/**
 * Anna's phone needs her first face (SEA-3): the safe files it under the id
 * `bonds` gives, and draws a new seed to make it from. Reached by a reaction
 * only (PER-21). A face after the first, from a seed in use, comes with
 * stage 2 (SEA-2).
 *
 * @see {@link command.make_a_face_from_a_new_seed}
 */
export const make_a_face_from_a_new_seed = command.make_a_face_from_a_new_seed

/**
 * The input of `make_a_face_from_a_new_seed`, declared inline.
 *
 * @see {@link command.make_a_face_from_a_new_seed}
 */
export const make_a_face_from_a_new_seed_input = command.make_a_face_from_a_new_seed.input
export type make_a_face_from_a_new_seed_input = z.output<typeof make_a_face_from_a_new_seed_input>

/**
 * The safe keeps the seed its machine drew and the face made from it at its
 * first index (SEA-2, SEA-3): the return of the draw. The seed's id is the
 * operation's (D75.8): a redelivery is the duplicate branch, one seed.
 *
 * @see {@link command.keep_a_new_seed_and_its_face}
 */
export const keep_a_new_seed_and_its_face = command.keep_a_new_seed_and_its_face

/**
 * The input of `keep_a_new_seed_and_its_face`, declared inline.
 *
 * @see {@link command.keep_a_new_seed_and_its_face}
 */
export const keep_a_new_seed_and_its_face_input = command.keep_a_new_seed_and_its_face.input
export type keep_a_new_seed_and_its_face_input = z.output<typeof keep_a_new_seed_and_its_face_input>

/**
 * Anna's phone needs a mailbox of its own for a bond (SEA-4): the safe files
 * its key under the id `bonds` gives, and draws its collect secret. Reached
 * by a reaction only (PER-21).
 *
 * @see {@link command.draw_a_mailbox_key}
 */
export const draw_a_mailbox_key = command.draw_a_mailbox_key

/**
 * The input of `draw_a_mailbox_key`, declared inline.
 *
 * @see {@link command.draw_a_mailbox_key}
 */
export const draw_a_mailbox_key_input = command.draw_a_mailbox_key.input
export type draw_a_mailbox_key_input = z.output<typeof draw_a_mailbox_key_input>

/**
 * The safe keeps the collect secret its machine drew and the deposit address
 * that hashes it (SEA-4): the return of the draw.
 *
 * @see {@link command.keep_a_mailbox_key}
 */
export const keep_a_mailbox_key = command.keep_a_mailbox_key

/**
 * The input of `keep_a_mailbox_key`, declared inline.
 *
 * @see {@link command.keep_a_mailbox_key}
 */
export const keep_a_mailbox_key_input = command.keep_a_mailbox_key.input
export type keep_a_mailbox_key_input = z.output<typeof keep_a_mailbox_key_input>
