// generated

// The calculations of `business/loans` from `tool_calculation.ts` (DOM-25): the
// same objects under the same names, branded with their path (DOM-24), each
// schema with its output type under the same name, so that one import gives
// both. Only this module imports `tool_calculation.ts`.

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
