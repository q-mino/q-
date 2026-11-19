import { z } from 'zod'
import * as zz from '../../../../src/library/index.ts'
import { calculation, value } from './_scope_calculation.ts'

// The calculations over a tool of the shed as the desk sees it, the subject of
// this file (DOM-18, SC-21): values of the tool that depend on the parameters
// of a read, words of the desk whose meaning is the adapters', as the
// selections'.

/** How many loans of the tool started between these days, both included, each on its day as written. */
export const the_loans_of_the_tool_between_these_days = calculation({
  subject: 'tool',
  parameters: z.strictObject({
    first_day: zz.day,
    last_day: zz.day,
  }),
  value: value.number_of_loans,
})
