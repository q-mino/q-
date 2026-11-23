// generated

// The facts of `user/choices` from `fact.ts` (DOM-25): the same objects under
// the same names, branded with their path (DOM-24), each schema with its output
// type under the same name, so that one import gives both. Only this module
// imports `fact.ts`.

import { z } from 'zod'
import * as fact from './fact.ts'

/**
 * The active face has been changed: she acts as another face (Cambia volto).
 *
 * @see {@link fact.the_active_face_has_been_changed}
 */
export const the_active_face_has_been_changed =
  fact.the_active_face_has_been_changed.brand<'user/choices/fact/the_active_face_has_been_changed'>()
export type the_active_face_has_been_changed = z.output<typeof the_active_face_has_been_changed>

/**
 * The active face has been changed again to the face it is: nothing changes (DOM-6).
 *
 * @see {@link fact.the_active_face_has_been_changed_again}
 */
export const the_active_face_has_been_changed_again =
  fact.the_active_face_has_been_changed_again.brand<'user/choices/fact/the_active_face_has_been_changed_again'>()
export type the_active_face_has_been_changed_again = z.output<
  typeof the_active_face_has_been_changed_again
>
