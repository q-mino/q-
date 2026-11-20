import { z } from 'zod'
import { selection, id } from './_scope_selection.ts'

// The selections over a face, the subject of this file (DOM-18): predicates
// over the face a query looks at, which they do not name. Their value is
// the adapters'.

/** The face has this id. */
export const the_face_has_this_id = selection({
  subject: 'face',
  parameters: z.strictObject({
    face_id: id.face_id,
  }),
})

/** The face is made: it has its keys. */
export const the_face_is_made = selection({
  subject: 'face',
  parameters: z.strictObject({}),
})
