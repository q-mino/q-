// generated

// The facts of `seals/safe` from `fact.ts` (DOM-25): the same objects under the
// same names, branded with their path (DOM-24), each schema with its output
// type under the same name, so that one import gives both. Only this module
// imports `fact.ts`.

import { z } from 'zod'
import * as fact from './fact.ts'

/**
 * A face has been asked for (SEA-3): the safe is drawing the seed it will be made from.
 *
 * @see {@link fact.a_face_has_been_asked_for}
 */
export const a_face_has_been_asked_for =
  fact.a_face_has_been_asked_for.brand<'seals/safe/fact/a_face_has_been_asked_for'>()
export type a_face_has_been_asked_for = z.output<typeof a_face_has_been_asked_for>

/**
 * The safe has drawn a new seed and made the face from it (SEA-2, SEA-3):
 * the seed, which its next face will take at index 1, and the face at
 * index 0, with its keys.
 *
 * @see {@link fact.a_face_has_been_made_from_a_new_seed}
 */
export const a_face_has_been_made_from_a_new_seed =
  fact.a_face_has_been_made_from_a_new_seed.brand<'seals/safe/fact/a_face_has_been_made_from_a_new_seed'>()
export type a_face_has_been_made_from_a_new_seed = z.output<
  typeof a_face_has_been_made_from_a_new_seed
>

/**
 * A mailbox key has been asked for (SEA-4): the safe is drawing its collect secret.
 *
 * @see {@link fact.a_mailbox_key_has_been_asked_for}
 */
export const a_mailbox_key_has_been_asked_for =
  fact.a_mailbox_key_has_been_asked_for.brand<'seals/safe/fact/a_mailbox_key_has_been_asked_for'>()
export type a_mailbox_key_has_been_asked_for = z.output<typeof a_mailbox_key_has_been_asked_for>

/**
 * The safe has drawn a mailbox key (SEA-4): its collect secret R and its deposit address D.
 *
 * @see {@link fact.a_mailbox_key_has_been_drawn}
 */
export const a_mailbox_key_has_been_drawn =
  fact.a_mailbox_key_has_been_drawn.brand<'seals/safe/fact/a_mailbox_key_has_been_drawn'>()
export type a_mailbox_key_has_been_drawn = z.output<typeof a_mailbox_key_has_been_drawn>
