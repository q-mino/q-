// generated

// The selection predicates of `tools`, branded with their path (DOM-24): the
// same objects as in `selection.ts`, nominal in the types. Only this module
// imports `selection.ts`.

import { z } from 'zod'
import * as selection from './_selection.ts'

/**
 * @see {@link selection.the_tool_is_in_service}
 */
export const the_tool_is_in_service =
  selection.the_tool_is_in_service.brand<'tools/selection/the_tool_is_in_service'>()
export type the_tool_is_in_service = z.output<typeof the_tool_is_in_service>

/**
 * @see {@link selection.the_tool_is_in_one_of_these_categories}
 */
export const the_tool_is_in_one_of_these_categories =
  selection.the_tool_is_in_one_of_these_categories.brand<'tools/selection/the_tool_is_in_one_of_these_categories'>()
export type the_tool_is_in_one_of_these_categories = z.output<
  typeof the_tool_is_in_one_of_these_categories
>
