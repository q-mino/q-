// generated

// The selection predicates of the subject `business/tools/selection/line`, branded with
// their path (DOM-24): the same objects as in `line_selection.ts`, nominal in
// the types. Only this module imports it.

import { z } from 'zod'
import * as selection from './line_selection.ts'

/**
 * The line is on the sheet being loaded.
 *
 * @see {@link selection.the_line_is_on_the_sheet}
 */
export const the_line_is_on_the_sheet =
  selection.the_line_is_on_the_sheet.brand<'business/tools/selection/line/the_line_is_on_the_sheet'>()
export type the_line_is_on_the_sheet = z.output<typeof the_line_is_on_the_sheet>
