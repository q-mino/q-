// generated

// The selection predicates of `business/tools` from `tool_selection.ts`
// (DOM-25): the same objects under the same names, branded with their path
// (DOM-24), each schema with its output type under the same name, so that one
// import gives both. Only this module imports `tool_selection.ts`.

import { z } from 'zod'
import * as selection from './tool_selection.ts'

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
