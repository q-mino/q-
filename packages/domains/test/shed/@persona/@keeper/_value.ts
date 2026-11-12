// generated

// The value schemas of `keeper` under their names, with their output types
// under the same names: one import gives both.

import { z } from 'zod'
import * as value from './value.ts'

/**
 * Why the keeper takes a tool off the shelf.
 *
 * @see {@link value.retirement_reason}
 */
export const retirement_reason = value.retirement_reason
export type retirement_reason = z.output<typeof retirement_reason>

/**
 * What the keeper writes down about a tool.
 *
 * @see {@link value.notes}
 */
export const notes = value.notes
export type notes = z.output<typeof notes>
