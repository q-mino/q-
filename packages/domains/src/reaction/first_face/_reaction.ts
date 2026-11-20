// generated

// The reactions of `reaction/first_face` from `reaction.ts` (DOM-25): the same
// objects under the same names, each schema with its output type under the same
// name, so that one import gives both. Only this module imports `reaction.ts`.

import * as reaction from './reaction.ts'

/**
 * When the address book asks for Anna's first face, the safe makes it from
 * a new seed, under the same id (SEA-3, BND-2).
 *
 * @see {@link reaction.the_safe_makes_the_first_face}
 */
export const the_safe_makes_the_first_face = reaction.the_safe_makes_the_first_face

/**
 * When the safe has made a face from a new seed, the address book keeps its
 * public key: of the safe's fact, the face's id and its public key only,
 * never its secrets (SEA-7).
 *
 * @see {@link reaction.the_address_book_keeps_the_key_of_the_face}
 */
export const the_address_book_keeps_the_key_of_the_face =
  reaction.the_address_book_keeps_the_key_of_the_face
