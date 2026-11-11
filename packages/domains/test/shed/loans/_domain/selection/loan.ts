// generated

// The selection predicates of the subject `loans/selection/loan`, branded with
// their path (DOM-24): the same objects as in `loan.ts`, nominal in the types.
// Only this module imports `loan.ts`.

import { z } from 'zod'
import * as selection from './_loan.ts'

/**
 * @see {@link selection.the_loan_is_ongoing}
 */
export const the_loan_is_ongoing =
  selection.the_loan_is_ongoing.brand<'loans/selection/loan/the_loan_is_ongoing'>()
export type the_loan_is_ongoing = z.output<typeof the_loan_is_ongoing>

/**
 * @see {@link selection.the_loan_is_of_this_member}
 */
export const the_loan_is_of_this_member =
  selection.the_loan_is_of_this_member.brand<'loans/selection/loan/the_loan_is_of_this_member'>()
export type the_loan_is_of_this_member = z.output<typeof the_loan_is_of_this_member>
