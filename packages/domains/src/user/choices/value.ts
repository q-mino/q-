import { z } from 'zod'
import { date_time } from '../../library/index.ts'
import { _user, id } from './_scope_value.ts'

// The values of the choices (USR-6): the face she acts as (D78.3: the active
// hat is the user domain's).

/** The active face, as the screens read it: which, and since when. */
export const the_active_face = z.strictObject({
  choice: id.choice,
  face: _user.value.a_face,
  since: date_time,
})
