// generated

// The predicates of `user/choices` from `predicate.ts` (DOM-25): the same
// objects under the same names, branded with their path (DOM-24), each schema
// with its output type under the same name, so that one import gives both. Only
// this module imports `predicate.ts`.

import { z } from 'zod'
import * as predicate from './predicate.ts'

/**
 * This face is the active one.
 *
 * @see {@link predicate.this_face_is_the_active_one}
 */
export const this_face_is_the_active_one =
  predicate.this_face_is_the_active_one.brand<'user/choices/predicate/this_face_is_the_active_one'>()
export type this_face_is_the_active_one = z.output<typeof this_face_is_the_active_one>
