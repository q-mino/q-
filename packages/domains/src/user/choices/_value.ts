// generated

// The values of `user/choices` from `value.ts` (DOM-25): the same objects under
// the same names, each schema with its output type under the same name, so that
// one import gives both. Only this module imports `value.ts`.

import { z } from 'zod'
import * as value from './value.ts'

/**
 * The active face, as the screens read it: which, and since when.
 *
 * @see {@link value.the_active_face}
 */
export const the_active_face = value.the_active_face
export type the_active_face = z.output<typeof the_active_face>
