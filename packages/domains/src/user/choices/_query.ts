// generated

// The queries of `user/choices` from `query.ts` (DOM-25): the same objects
// under the same names, each schema with its output type under the same name,
// so that one import gives both. Only this module imports `query.ts`.

import { z } from 'zod'
import * as query from './query.ts'

/**
 * The active face, if she has chosen one: none before her first face.
 *
 * @see {@link query.the_active_face}
 */
export const the_active_face = query.the_active_face

/**
 * The input of `the_active_face`, declared inline.
 *
 * @see {@link query.the_active_face}
 */
export const the_active_face_input = query.the_active_face.input
export type the_active_face_input = z.output<typeof the_active_face_input>
