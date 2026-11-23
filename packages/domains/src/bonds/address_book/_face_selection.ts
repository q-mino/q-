// generated

// The selection predicates of `bonds/address_book` from `face_selection.ts`
// (DOM-25): the same objects under the same names, branded with their path
// (DOM-24), each schema with its output type under the same name, so that one
// import gives both. Only this module imports `face_selection.ts`.

import { z } from 'zod'
import * as selection from './face_selection.ts'

/**
 * The face is made: it has its public key.
 *
 * @see {@link selection.the_face_is_made}
 */
export const the_face_is_made =
  selection.the_face_is_made.brand<'bonds/address_book/selection/face/the_face_is_made'>()
export type the_face_is_made = z.output<typeof the_face_is_made>
