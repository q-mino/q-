// generated

// The queries of `seals/safe` from `query.ts` (DOM-25): the same objects under
// the same names, each schema with its output type under the same name, so that
// one import gives both. Only this module imports `query.ts`.

import { z } from 'zod'
import * as query from './query.ts'

/**
 * The face is the one named, and made.
 *
 * @see {@link query.the_face_is_made_under_this_id}
 */
export const the_face_is_made_under_this_id = query.the_face_is_made_under_this_id
export type the_face_is_made_under_this_id = z.output<typeof the_face_is_made_under_this_id>

/**
 * The mailbox key is the one named, and drawn.
 *
 * @see {@link query.the_mailbox_key_is_drawn_under_this_id}
 */
export const the_mailbox_key_is_drawn_under_this_id = query.the_mailbox_key_is_drawn_under_this_id
export type the_mailbox_key_is_drawn_under_this_id = z.output<
  typeof the_mailbox_key_is_drawn_under_this_id
>

/**
 * `post` brings the safe a content to sign with Anna's face (SEA-6): the face,
 * its public key and its signature over the content; nothing is recorded,
 * and the private key stays in the safe. No entry if the face is not made.
 *
 * @see {@link query.a_content_signed_by_a_face}
 */
export const a_content_signed_by_a_face = query.a_content_signed_by_a_face

/**
 * The input of `a_content_signed_by_a_face`, declared inline.
 *
 * @see {@link query.a_content_signed_by_a_face}
 */
export const a_content_signed_by_a_face_input = query.a_content_signed_by_a_face.input
export type a_content_signed_by_a_face_input = z.output<typeof a_content_signed_by_a_face_input>

/**
 * `post` brings the safe a sealed content come for Anna's face (SEA-6): the
 * face, its public key and the content opened, or not opened.
 *
 * @see {@link query.a_sealed_content_opened_by_a_face}
 */
export const a_sealed_content_opened_by_a_face = query.a_sealed_content_opened_by_a_face

/**
 * The input of `a_sealed_content_opened_by_a_face`, declared inline.
 *
 * @see {@link query.a_sealed_content_opened_by_a_face}
 */
export const a_sealed_content_opened_by_a_face_input = query.a_sealed_content_opened_by_a_face.input
export type a_sealed_content_opened_by_a_face_input = z.output<
  typeof a_sealed_content_opened_by_a_face_input
>

/**
 * Who collects from the relay asks the safe for a mailbox's key (SEA-4, V5):
 * its collect secret R, to show, and its deposit address D, to name.
 *
 * @see {@link query.the_key_of_a_mailbox}
 */
export const the_key_of_a_mailbox = query.the_key_of_a_mailbox

/**
 * The input of `the_key_of_a_mailbox`, declared inline.
 *
 * @see {@link query.the_key_of_a_mailbox}
 */
export const the_key_of_a_mailbox_input = query.the_key_of_a_mailbox.input
export type the_key_of_a_mailbox_input = z.output<typeof the_key_of_a_mailbox_input>
