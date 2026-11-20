import { z } from 'zod'
import { predicate, _user } from './_scope_predicate.ts'

// The predicates of the choices (USR-6).

/** This face is the active one. */
export const this_face_is_the_active_one = predicate({
  parameters: z.strictObject({
    face: _user.value.a_face,
  }),
})
