// generated

// The selection predicates of `business/tools` from `line_selection.ts`
// (DOM-25): the same objects under the same names, branded with their path
// (DOM-24), each schema with its output type under the same name, so that one
// import gives both. Only this module imports `line_selection.ts`.

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
