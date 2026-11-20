// generated

// The commands of `user/choices` from `command.ts` (DOM-25): the same objects
// under the same names, each schema with its output type under the same name,
// so that one import gives both. Only this module imports `command.ts`.

import { z } from 'zod'
import * as command from './command.ts'

/**
 * This face is not the active one: none is chosen, or another.
 *
 * @see {@link command.another_face}
 */
export const another_face = command.another_face
export type another_face = z.output<typeof another_face>

/**
 * Anna makes her first face, F_a, and acts as it; later she changes to another. The same face again changes nothing.
 *
 * @see {@link command.change_face}
 */
export const change_face = command.change_face

/**
 * The input of `change_face`, declared inline.
 *
 * @see {@link command.change_face}
 */
export const change_face_input = command.change_face.input
export type change_face_input = z.output<typeof change_face_input>
