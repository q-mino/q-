// generated

// The value schemas of `visitor` under their names, with their output types
// under the same names: one import gives both.

import { z } from 'zod'
import * as value from './value.ts'

/**
 * A shelf of the shed, as the visitor browses it.
 *
 * @see {@link value.category}
 */
export const category = value.category
export type category = z.output<typeof category>

/**
 * The shelves a visitor browses: at least one.
 *
 * @see {@link value.categories}
 */
export const categories = value.categories
export type categories = z.output<typeof categories>

/**
 * The name of a tool, as the visitor reads it.
 *
 * @see {@link value.tool_name}
 */
export const tool_name = value.tool_name
export type tool_name = z.output<typeof tool_name>
