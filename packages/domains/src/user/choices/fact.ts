import { z } from 'zod'
import { fact, _user, value } from './_scope_fact.ts'

// The facts of the choices (USR-6).

/** The active face has been changed: she acts as another face (Cambia volto). */
export const the_active_face_has_been_changed = fact({
  payload: z.strictObject({
    active_face: value.the_active_face,
  }),
})

/** The active face has been changed again to the face it is: nothing changes (DOM-6). */
export const the_active_face_has_been_changed_again = fact({
  payload: z.strictObject({
    face: _user.value.a_face,
  }),
})
