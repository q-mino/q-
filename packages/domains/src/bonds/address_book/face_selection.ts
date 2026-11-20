import { z } from 'zod'
import { selection } from './_scope_selection.ts'

// The selections over a face, the subject of this file (DOM-18): predicates
// over the face a query looks at, which they do not name. Their value is
// the adapters'.

/** The face is made: it has its public key. */
export const the_face_is_made = selection({
  subject: 'face',
  parameters: z.strictObject({}),
})
