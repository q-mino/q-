// generated

// The selection predicates of `business/loans` from `loan_selection.ts`
// (DOM-25): the same objects under the same names, branded with their path
// (DOM-24), each schema with its output type under the same name, so that one
// import gives both. Only this module imports `loan_selection.ts`.

import { z } from 'zod'
import * as selection from './loan_selection.ts'

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
