// generated

// The selection predicates of the subject `business/tools/selection/tool`, branded with
// their path (DOM-24): the same objects as in `@tool_selection.ts`, nominal in
// the types. Only this module imports it.

import { z } from 'zod'
import * as selection from './@tool_selection.ts'

/**
 * @see {@link selection.the_tool_is_in_service}
 */
export const the_tool_is_in_service =
  selection.the_tool_is_in_service.brand<'business/tools/selection/tool/the_tool_is_in_service'>()
export type the_tool_is_in_service = z.output<typeof the_tool_is_in_service>

/**
 * @see {@link selection.the_tool_is_in_one_of_these_categories}
 */
export const the_tool_is_in_one_of_these_categories =
  selection.the_tool_is_in_one_of_these_categories.brand<'business/tools/selection/tool/the_tool_is_in_one_of_these_categories'>()
export type the_tool_is_in_one_of_these_categories = z.output<
  typeof the_tool_is_in_one_of_these_categories
>
