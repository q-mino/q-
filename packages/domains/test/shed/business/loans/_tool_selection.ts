// generated

// The selection predicates of the subject `business/loans/selection/tool`,
// branded with their path (DOM-24): the same objects as in
// `tool_selection.ts`, nominal in the types. Only this module imports it.

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
