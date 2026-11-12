// generated

// The selection predicates of the subject `tools/selection/tool`, branded with
// their path (DOM-24): the same objects as in `_tool.ts`, nominal in the types.
// Only this module imports `_tool.ts`.

import { z } from 'zod'
import * as selection from './_tool.ts'

/**
 * @see {@link selection.the_tool_is_in_service}
 */
export const the_tool_is_in_service =
  selection.the_tool_is_in_service.brand<'tools/selection/tool/the_tool_is_in_service'>()
export type the_tool_is_in_service = z.output<typeof the_tool_is_in_service>

/**
 * @see {@link selection.the_tool_is_in_one_of_these_categories}
 */
export const the_tool_is_in_one_of_these_categories =
  selection.the_tool_is_in_one_of_these_categories.brand<'tools/selection/tool/the_tool_is_in_one_of_these_categories'>()
export type the_tool_is_in_one_of_these_categories = z.output<
  typeof the_tool_is_in_one_of_these_categories
>
