// generated

import { z } from 'zod'
import * as predicate from './predicate.ts'

/**
 * @see {@link predicate.a_loan_has_this_id}
 */
export const a_loan_has_this_id = z.strictObject({
  $path: z.literal('loans/predicate/a_loan_has_this_id'),
  ...predicate.a_loan_has_this_id.shape,
})
export type $a_loan_has_this_id = z.output<typeof a_loan_has_this_id>
export const $a_loan_has_this_id = (v: /*omit the $path!*/ Omit<$a_loan_has_this_id, '$path'>) =>
  a_loan_has_this_id.parse({ ...v, $path: 'loans/predicate/a_loan_has_this_id' })
export const $$a_loan_has_this_id = (v: unknown) => a_loan_has_this_id.safeParse(v)
export const $$$a_loan_has_this_id = (v: unknown) => a_loan_has_this_id.parse(v)

/**
 * The tool is with a member, whoever it is.
 *
 * @see {@link predicate.the_tool_is_on_loan}
 */
export const the_tool_is_on_loan = z.strictObject({
  $path: z.literal('loans/predicate/the_tool_is_on_loan'),
  ...predicate.the_tool_is_on_loan.shape,
})
export type $the_tool_is_on_loan = z.output<typeof the_tool_is_on_loan>
export const $the_tool_is_on_loan = (v: /*omit the $path!*/ Omit<$the_tool_is_on_loan, '$path'>) =>
  the_tool_is_on_loan.parse({ ...v, $path: 'loans/predicate/the_tool_is_on_loan' })
export const $$the_tool_is_on_loan = (v: unknown) => the_tool_is_on_loan.safeParse(v)
export const $$$the_tool_is_on_loan = (v: unknown) => the_tool_is_on_loan.parse(v)

/**
 * The tool is with this member.
 *
 * @see {@link predicate.the_tool_is_on_loan_to_this_member}
 */
export const the_tool_is_on_loan_to_this_member = z.strictObject({
  $path: z.literal('loans/predicate/the_tool_is_on_loan_to_this_member'),
  ...predicate.the_tool_is_on_loan_to_this_member.shape,
})
export type $the_tool_is_on_loan_to_this_member = z.output<
  typeof the_tool_is_on_loan_to_this_member
>
export const $the_tool_is_on_loan_to_this_member = (
  v: /*omit the $path!*/ Omit<$the_tool_is_on_loan_to_this_member, '$path'>,
) =>
  the_tool_is_on_loan_to_this_member.parse({
    ...v,
    $path: 'loans/predicate/the_tool_is_on_loan_to_this_member',
  })
export const $$the_tool_is_on_loan_to_this_member = (v: unknown) =>
  the_tool_is_on_loan_to_this_member.safeParse(v)
export const $$$the_tool_is_on_loan_to_this_member = (v: unknown) =>
  the_tool_is_on_loan_to_this_member.parse(v)

/**
 * @see {@link predicate.a_reservation_has_this_id}
 */
export const a_reservation_has_this_id = z.strictObject({
  $path: z.literal('loans/predicate/a_reservation_has_this_id'),
  ...predicate.a_reservation_has_this_id.shape,
})
export type $a_reservation_has_this_id = z.output<typeof a_reservation_has_this_id>
export const $a_reservation_has_this_id = (
  v: /*omit the $path!*/ Omit<$a_reservation_has_this_id, '$path'>,
) => a_reservation_has_this_id.parse({ ...v, $path: 'loans/predicate/a_reservation_has_this_id' })
export const $$a_reservation_has_this_id = (v: unknown) => a_reservation_has_this_id.safeParse(v)
export const $$$a_reservation_has_this_id = (v: unknown) => a_reservation_has_this_id.parse(v)

/**
 * The tool is booked for the day, by whoever.
 *
 * @see {@link predicate.the_tool_is_booked_for_the_day}
 */
export const the_tool_is_booked_for_the_day = z.strictObject({
  $path: z.literal('loans/predicate/the_tool_is_booked_for_the_day'),
  ...predicate.the_tool_is_booked_for_the_day.shape,
})
export type $the_tool_is_booked_for_the_day = z.output<typeof the_tool_is_booked_for_the_day>
export const $the_tool_is_booked_for_the_day = (
  v: /*omit the $path!*/ Omit<$the_tool_is_booked_for_the_day, '$path'>,
) =>
  the_tool_is_booked_for_the_day.parse({
    ...v,
    $path: 'loans/predicate/the_tool_is_booked_for_the_day',
  })
export const $$the_tool_is_booked_for_the_day = (v: unknown) =>
  the_tool_is_booked_for_the_day.safeParse(v)
export const $$$the_tool_is_booked_for_the_day = (v: unknown) =>
  the_tool_is_booked_for_the_day.parse(v)

/**
 * The tool is booked for the day by this member.
 *
 * @see {@link predicate.the_tool_is_booked_for_the_day_by_this_member}
 */
export const the_tool_is_booked_for_the_day_by_this_member = z.strictObject({
  $path: z.literal('loans/predicate/the_tool_is_booked_for_the_day_by_this_member'),
  ...predicate.the_tool_is_booked_for_the_day_by_this_member.shape,
})
export type $the_tool_is_booked_for_the_day_by_this_member = z.output<
  typeof the_tool_is_booked_for_the_day_by_this_member
>
export const $the_tool_is_booked_for_the_day_by_this_member = (
  v: /*omit the $path!*/ Omit<$the_tool_is_booked_for_the_day_by_this_member, '$path'>,
) =>
  the_tool_is_booked_for_the_day_by_this_member.parse({
    ...v,
    $path: 'loans/predicate/the_tool_is_booked_for_the_day_by_this_member',
  })
export const $$the_tool_is_booked_for_the_day_by_this_member = (v: unknown) =>
  the_tool_is_booked_for_the_day_by_this_member.safeParse(v)
export const $$$the_tool_is_booked_for_the_day_by_this_member = (v: unknown) =>
  the_tool_is_booked_for_the_day_by_this_member.parse(v)
