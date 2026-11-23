// generated

// The predicates of `seals/safe` from `predicate.ts` (DOM-25): the same objects
// under the same names, branded with their path (DOM-24), each schema with its
// output type under the same name, so that one import gives both. Only this
// module imports `predicate.ts`.

import { z } from 'zod'
import * as predicate from './predicate.ts'

/**
 * A face with this id is in the safe, being made or made.
 *
 * @see {@link predicate.a_face_has_this_id}
 */
export const a_face_has_this_id =
  predicate.a_face_has_this_id.brand<'seals/safe/predicate/a_face_has_this_id'>()
export type a_face_has_this_id = z.output<typeof a_face_has_this_id>

/**
 * This face is being made: its seed is being drawn.
 *
 * @see {@link predicate.the_face_is_being_made}
 */
export const the_face_is_being_made =
  predicate.the_face_is_being_made.brand<'seals/safe/predicate/the_face_is_being_made'>()
export type the_face_is_being_made = z.output<typeof the_face_is_being_made>

/**
 * A mailbox key with this id is in the safe, being drawn or drawn.
 *
 * @see {@link predicate.a_mailbox_key_has_this_id}
 */
export const a_mailbox_key_has_this_id =
  predicate.a_mailbox_key_has_this_id.brand<'seals/safe/predicate/a_mailbox_key_has_this_id'>()
export type a_mailbox_key_has_this_id = z.output<typeof a_mailbox_key_has_this_id>

/**
 * This mailbox key is being drawn: its collect secret is not in the safe yet.
 *
 * @see {@link predicate.the_mailbox_key_is_being_drawn}
 */
export const the_mailbox_key_is_being_drawn =
  predicate.the_mailbox_key_is_being_drawn.brand<'seals/safe/predicate/the_mailbox_key_is_being_drawn'>()
export type the_mailbox_key_is_being_drawn = z.output<typeof the_mailbox_key_is_being_drawn>
