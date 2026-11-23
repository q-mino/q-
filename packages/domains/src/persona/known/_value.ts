// generated

// The values of `persona/known` from `value.ts` (DOM-25): the same objects
// under the same names, each schema with its output type under the same name,
// so that one import gives both. Only this module imports `value.ts`.

import { z } from 'zod'
import * as value from './value.ts'

/**
 * A major of an extension's surface on `known` (PER-17).
 *
 * @see {@link value.major}
 */
export const major = value.major
export type major = z.output<typeof major>

/**
 * The majors of an extension's surface on `known`.
 *
 * @see {@link value.majors}
 */
export const majors = value.majors
export type majors = z.output<typeof majors>

/**
 * An extension a side offers the other, with the majors of its surface on `known`: greetings, at major 1.
 *
 * @see {@link value.offered_extension}
 */
export const offered_extension = value.offered_extension
export type offered_extension = z.output<typeof offered_extension>

/**
 * The extensions the asker says its node offers (EXT-8): a claim (F2), each named once.
 *
 * @see {@link value.offered_extensions}
 */
export const offered_extensions = value.offered_extensions
export type offered_extensions = z.output<typeof offered_extensions>
