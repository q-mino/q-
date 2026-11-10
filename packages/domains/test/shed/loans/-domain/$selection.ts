// generated

import { z } from 'zod'
import * as selection from './selection.ts'

/**
 * @see {@link selection.the_loan_is_ongoing}
 */
export const the_loan_is_ongoing = z.strictObject({
  $path: z.literal('loans/selection/the_loan_is_ongoing'),
  ...selection.the_loan_is_ongoing.shape,
})
export type $the_loan_is_ongoing = z.output<typeof the_loan_is_ongoing>
/** No parameters: the parse takes nothing. */
export const $the_loan_is_ongoing = () =>
  the_loan_is_ongoing.parse({ $path: 'loans/selection/the_loan_is_ongoing' })
export const $$the_loan_is_ongoing = (v: unknown) => the_loan_is_ongoing.safeParse(v)
export const $$$the_loan_is_ongoing = (v: unknown) => the_loan_is_ongoing.parse(v)

/**
 * @see {@link selection.the_loan_is_of_this_member}
 */
export const the_loan_is_of_this_member = z.strictObject({
  $path: z.literal('loans/selection/the_loan_is_of_this_member'),
  ...selection.the_loan_is_of_this_member.shape,
})
export type $the_loan_is_of_this_member = z.output<typeof the_loan_is_of_this_member>
export const $the_loan_is_of_this_member = (
  v: /*omit the $path!*/ Omit<$the_loan_is_of_this_member, '$path'>,
) => the_loan_is_of_this_member.parse({ ...v, $path: 'loans/selection/the_loan_is_of_this_member' })
export const $$the_loan_is_of_this_member = (v: unknown) => the_loan_is_of_this_member.safeParse(v)
export const $$$the_loan_is_of_this_member = (v: unknown) => the_loan_is_of_this_member.parse(v)

/**
 * @see {@link selection.the_reservation_is_booked}
 */
export const the_reservation_is_booked = z.strictObject({
  $path: z.literal('loans/selection/the_reservation_is_booked'),
  ...selection.the_reservation_is_booked.shape,
})
export type $the_reservation_is_booked = z.output<typeof the_reservation_is_booked>
/** No parameters: the parse takes nothing. */
export const $the_reservation_is_booked = () =>
  the_reservation_is_booked.parse({ $path: 'loans/selection/the_reservation_is_booked' })
export const $$the_reservation_is_booked = (v: unknown) => the_reservation_is_booked.safeParse(v)
export const $$$the_reservation_is_booked = (v: unknown) => the_reservation_is_booked.parse(v)

/**
 * @see {@link selection.the_reservation_is_of_this_member}
 */
export const the_reservation_is_of_this_member = z.strictObject({
  $path: z.literal('loans/selection/the_reservation_is_of_this_member'),
  ...selection.the_reservation_is_of_this_member.shape,
})
export type $the_reservation_is_of_this_member = z.output<typeof the_reservation_is_of_this_member>
export const $the_reservation_is_of_this_member = (
  v: /*omit the $path!*/ Omit<$the_reservation_is_of_this_member, '$path'>,
) =>
  the_reservation_is_of_this_member.parse({
    ...v,
    $path: 'loans/selection/the_reservation_is_of_this_member',
  })
export const $$the_reservation_is_of_this_member = (v: unknown) =>
  the_reservation_is_of_this_member.safeParse(v)
export const $$$the_reservation_is_of_this_member = (v: unknown) =>
  the_reservation_is_of_this_member.parse(v)

/**
 * The reserved day is this day or a later one.
 *
 * @see {@link selection.the_reservation_is_from_this_day_on}
 */
export const the_reservation_is_from_this_day_on = z.strictObject({
  $path: z.literal('loans/selection/the_reservation_is_from_this_day_on'),
  ...selection.the_reservation_is_from_this_day_on.shape,
})
export type $the_reservation_is_from_this_day_on = z.output<
  typeof the_reservation_is_from_this_day_on
>
export const $the_reservation_is_from_this_day_on = (
  v: /*omit the $path!*/ Omit<$the_reservation_is_from_this_day_on, '$path'>,
) =>
  the_reservation_is_from_this_day_on.parse({
    ...v,
    $path: 'loans/selection/the_reservation_is_from_this_day_on',
  })
export const $$the_reservation_is_from_this_day_on = (v: unknown) =>
  the_reservation_is_from_this_day_on.safeParse(v)
export const $$$the_reservation_is_from_this_day_on = (v: unknown) =>
  the_reservation_is_from_this_day_on.parse(v)
