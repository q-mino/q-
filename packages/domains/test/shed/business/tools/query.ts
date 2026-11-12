// generated

// The queries of `tools` under their names, each schema with its output type
// under the same name: one import gives both.

import { z } from 'zod'
import * as query from './_query.ts'

/**
 * The tool is in service and in a chosen category.
 *
 * @see {@link query.the_tool_is_shown_in_the_catalogue}
 */
export const the_tool_is_shown_in_the_catalogue = query.the_tool_is_shown_in_the_catalogue
export type the_tool_is_shown_in_the_catalogue = z.output<typeof the_tool_is_shown_in_the_catalogue>

/**
 * The tools a visitor can see: in service, in the chosen categories (every
 * category, if none is chosen), by category and name; the id, the entry's
 * identity, closes the order.
 *
 * @see {@link query.the_catalogue}
 */
export const the_catalogue = query.the_catalogue

/**
 * The input of `the_catalogue`, declared inline.
 *
 * @see {@link query.the_catalogue}
 */
export const the_catalogue_input = query.the_catalogue.input
export type the_catalogue_input = z.output<typeof the_catalogue_input>
