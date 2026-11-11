// generated

import { z } from 'zod'
import * as selection from './loan.ts'

/**
 * @see {@link selection.the_loan_is_ongoing}
 */
export const the_loan_is_ongoing = z.strictObject({
  $path: z.literal('loans/selection/loan/the_loan_is_ongoing'),
  ...selection.the_loan_is_ongoing.shape,
})
export type $the_loan_is_ongoing = z.output<typeof the_loan_is_ongoing>
/** No parameters: the parse takes nothing. */
export const $the_loan_is_ongoing = () =>
  the_loan_is_ongoing.parse({ $path: 'loans/selection/loan/the_loan_is_ongoing' })
export const $$the_loan_is_ongoing = (v: unknown) => the_loan_is_ongoing.safeParse(v)
export const $$$the_loan_is_ongoing = (v: unknown) => the_loan_is_ongoing.parse(v)

/**
 * @see {@link selection.the_loan_is_of_this_member}
 */
export const the_loan_is_of_this_member = z.strictObject({
  $path: z.literal('loans/selection/loan/the_loan_is_of_this_member'),
  ...selection.the_loan_is_of_this_member.shape,
})
export type $the_loan_is_of_this_member = z.output<typeof the_loan_is_of_this_member>
export const $the_loan_is_of_this_member = (
  v: /*omit the $path!*/ Omit<$the_loan_is_of_this_member, '$path'>,
) =>
  the_loan_is_of_this_member.parse({
    ...v,
    $path: 'loans/selection/loan/the_loan_is_of_this_member',
  })
export const $$the_loan_is_of_this_member = (v: unknown) => the_loan_is_of_this_member.safeParse(v)
export const $$$the_loan_is_of_this_member = (v: unknown) => the_loan_is_of_this_member.parse(v)
