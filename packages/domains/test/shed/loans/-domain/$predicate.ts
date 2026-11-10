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
 * @see {@link predicate.the_loan_is_ongoing}
 */
export const the_loan_is_ongoing = z.strictObject({
  $path: z.literal('loans/predicate/the_loan_is_ongoing'),
  ...predicate.the_loan_is_ongoing.shape,
})
export type $the_loan_is_ongoing = z.output<typeof the_loan_is_ongoing>
export const $the_loan_is_ongoing = (v: /*omit the $path!*/ Omit<$the_loan_is_ongoing, '$path'>) =>
  the_loan_is_ongoing.parse({ ...v, $path: 'loans/predicate/the_loan_is_ongoing' })
export const $$the_loan_is_ongoing = (v: unknown) => the_loan_is_ongoing.safeParse(v)
export const $$$the_loan_is_ongoing = (v: unknown) => the_loan_is_ongoing.parse(v)

/**
 * @see {@link predicate.the_loan_is_returned}
 */
export const the_loan_is_returned = z.strictObject({
  $path: z.literal('loans/predicate/the_loan_is_returned'),
  ...predicate.the_loan_is_returned.shape,
})
export type $the_loan_is_returned = z.output<typeof the_loan_is_returned>
export const $the_loan_is_returned = (
  v: /*omit the $path!*/ Omit<$the_loan_is_returned, '$path'>,
) => the_loan_is_returned.parse({ ...v, $path: 'loans/predicate/the_loan_is_returned' })
export const $$the_loan_is_returned = (v: unknown) => the_loan_is_returned.safeParse(v)
export const $$$the_loan_is_returned = (v: unknown) => the_loan_is_returned.parse(v)

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

/**
 * The shed has a tool with this id.
 *
 * @see {@link predicate.a_tool_has_this_id}
 */
export const a_tool_has_this_id = z.strictObject({
  $path: z.literal('loans/predicate/a_tool_has_this_id'),
  ...predicate.a_tool_has_this_id.shape,
})
export type $a_tool_has_this_id = z.output<typeof a_tool_has_this_id>
export const $a_tool_has_this_id = (v: /*omit the $path!*/ Omit<$a_tool_has_this_id, '$path'>) =>
  a_tool_has_this_id.parse({ ...v, $path: 'loans/predicate/a_tool_has_this_id' })
export const $$a_tool_has_this_id = (v: unknown) => a_tool_has_this_id.safeParse(v)
export const $$$a_tool_has_this_id = (v: unknown) => a_tool_has_this_id.parse(v)

/**
 * The tool can go out: it is in service in the shed.
 *
 * @see {@link predicate.the_tool_is_in_service}
 */
export const the_tool_is_in_service = z.strictObject({
  $path: z.literal('loans/predicate/the_tool_is_in_service'),
  ...predicate.the_tool_is_in_service.shape,
})
export type $the_tool_is_in_service = z.output<typeof the_tool_is_in_service>
export const $the_tool_is_in_service = (
  v: /*omit the $path!*/ Omit<$the_tool_is_in_service, '$path'>,
) => the_tool_is_in_service.parse({ ...v, $path: 'loans/predicate/the_tool_is_in_service' })
export const $$the_tool_is_in_service = (v: unknown) => the_tool_is_in_service.safeParse(v)
export const $$$the_tool_is_in_service = (v: unknown) => the_tool_is_in_service.parse(v)
