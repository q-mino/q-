// generated

// The selection predicates of `business/loans` from `tool_selection.ts`
// (DOM-25): the same objects under the same names, branded with their path
// (DOM-24), each schema with its output type under the same name, so that one
// import gives both. Only this module imports `tool_selection.ts`.

import { z } from 'zod'
import * as selection from './tool_selection.ts'

/**
 * The tool is still in the shed: in service or in the workshop, not retired.
 *
 * @see {@link selection.the_tool_is_still_in_the_shed}
 */
export const the_tool_is_still_in_the_shed =
  selection.the_tool_is_still_in_the_shed.brand<'business/loans/selection/tool/the_tool_is_still_in_the_shed'>()
export type the_tool_is_still_in_the_shed = z.output<typeof the_tool_is_still_in_the_shed>
