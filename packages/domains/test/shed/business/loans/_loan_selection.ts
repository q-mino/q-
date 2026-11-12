// generated

// The selection predicates of the subject `business/loans/selection/loan`, branded with
// their path (DOM-24): the same objects as in `@loan_selection.ts`, nominal in
// the types. Only this module imports it.

import { z } from 'zod'
import * as selection from './@loan_selection.ts'

/**
 * @see {@link selection.the_loan_is_ongoing}
 */
export const the_loan_is_ongoing =
  selection.the_loan_is_ongoing.brand<'business/loans/selection/loan/the_loan_is_ongoing'>()
export type the_loan_is_ongoing = z.output<typeof the_loan_is_ongoing>

/**
 * @see {@link selection.the_loan_is_of_this_member}
 */
export const the_loan_is_of_this_member =
  selection.the_loan_is_of_this_member.brand<'business/loans/selection/loan/the_loan_is_of_this_member'>()
export type the_loan_is_of_this_member = z.output<typeof the_loan_is_of_this_member>
