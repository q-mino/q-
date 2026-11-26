// generated

// The values of `persona/self` from `value.ts` (DOM-25): the same objects under
// the same names, each schema with its output type under the same name, so that
// one import gives both. Only this module imports `value.ts`.

import { z } from 'zod'
import * as value from './value.ts'

/**
 * An instant as her node tells it: ISO 8601 in UTC, to the millisecond.
 *
 * @see {@link value.instant}
 */
export const instant = value.instant
export type instant = z.output<typeof instant>

/**
 * The text of a message, as she writes it (MSG-4).
 *
 * @see {@link value.text}
 */
export const text = value.text
export type text = z.output<typeof text>

/**
 * Where her message stands (MSG-13), as the chat tells it.
 *
 * @see {@link value.stage}
 */
export const stage = value.stage
export type stage = z.output<typeof stage>

/**
 * Whose a message is: hers, with its stage, or theirs, with the time its letter declares (MSG-6).
 *
 * @see {@link value.whose}
 */
export const whose = value.whose
export type whose = z.output<typeof whose>

/**
 * Where a message is filed in its chat (MSG-5).
 *
 * @see {@link value.place}
 */
export const place = value.place
export type place = z.output<typeof place>

/**
 * How many messages of theirs are to read.
 *
 * @see {@link value.to_read}
 */
export const to_read = value.to_read
export type to_read = z.output<typeof to_read>
