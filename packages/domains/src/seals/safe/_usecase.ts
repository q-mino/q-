// generated

// The use cases of `seals/safe` from `usecase.ts` (DOM-25): the same objects
// under the same names, each schema with its output type under the same name,
// so that one import gives both. Only this module imports `usecase.ts`.

import * as usecase from './usecase.ts'

/**
 * A face is asked for, its seed drawn for it: the first face of the node.
 *
 * @see {@link usecase.make_a_face_from_a_new_seed}
 */
export const make_a_face_from_a_new_seed = usecase.make_a_face_from_a_new_seed

/**
 * The safe keeps the seed drawn and the face made from it: the return of the draw.
 *
 * @see {@link usecase.keep_a_new_seed_and_its_face}
 */
export const keep_a_new_seed_and_its_face = usecase.keep_a_new_seed_and_its_face

/**
 * A mailbox key is asked for, its collect secret drawn.
 *
 * @see {@link usecase.draw_a_mailbox_key}
 */
export const draw_a_mailbox_key = usecase.draw_a_mailbox_key

/**
 * The safe keeps the collect secret drawn and its deposit address: the return of the draw.
 *
 * @see {@link usecase.keep_a_mailbox_key}
 */
export const keep_a_mailbox_key = usecase.keep_a_mailbox_key

/**
 * A content signed by a face of the node's user.
 *
 * @see {@link usecase.a_content_signed_by_a_face}
 */
export const a_content_signed_by_a_face = usecase.a_content_signed_by_a_face

/**
 * A sealed content opened by a face of the node's user.
 *
 * @see {@link usecase.a_sealed_content_opened_by_a_face}
 */
export const a_sealed_content_opened_by_a_face = usecase.a_sealed_content_opened_by_a_face

/**
 * The key of a mailbox of the node's, for the relay.
 *
 * @see {@link usecase.the_key_of_a_mailbox}
 */
export const the_key_of_a_mailbox = usecase.the_key_of_a_mailbox
