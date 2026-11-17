// generated

// The calculations of the subject `business/loans/calculation/tool`, branded
// with their path (DOM-24): the same objects as in `tool_calculation.ts`,
// nominal in the types. Only this module imports it.

import { z } from 'zod'
import * as calculation from './tool_calculation.ts'

/**
 * How many loans of the tool started between these days, both included, each on its day as written.
 *
 * @see {@link calculation.the_loans_of_the_tool_between_these_days}
 */
export const the_loans_of_the_tool_between_these_days =
  calculation.the_loans_of_the_tool_between_these_days.brand<'business/loans/calculation/tool/the_loans_of_the_tool_between_these_days'>()
export type the_loans_of_the_tool_between_these_days = z.output<
  typeof the_loans_of_the_tool_between_these_days
>
