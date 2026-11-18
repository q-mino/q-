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

/**
 * The name of a tool, as the keeper reads it on the shelf.
 *
 * @see {@link value.tool_name}
 */
export const tool_name = value.tool_name
export type tool_name = z.output<typeof tool_name>

/**
 * The shelf a tool goes on, as the keeper sorts the shed.
 *
 * @see {@link value.category}
 */
export const category = value.category
export type category = z.output<typeof category>

/**
 * How many times a tool went out.
 *
 * @see {@link value.number_of_loans}
 */
export const number_of_loans = value.number_of_loans
export type number_of_loans = z.output<typeof number_of_loans>
