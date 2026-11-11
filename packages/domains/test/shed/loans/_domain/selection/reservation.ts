// generated

// The selection predicates of the subject `loans/selection/reservation`,
// branded with their path (DOM-24): the same objects as in `reservation.ts`,
// nominal in the types. Only this module imports `reservation.ts`.

import { z } from 'zod'
import * as selection from './_reservation.ts'

/**
 * @see {@link selection.the_reservation_is_booked}
 */
export const the_reservation_is_booked =
  selection.the_reservation_is_booked.brand<'loans/selection/reservation/the_reservation_is_booked'>()
export type the_reservation_is_booked = z.output<typeof the_reservation_is_booked>

/**
 * @see {@link selection.the_reservation_is_of_this_member}
 */
export const the_reservation_is_of_this_member =
  selection.the_reservation_is_of_this_member.brand<'loans/selection/reservation/the_reservation_is_of_this_member'>()
export type the_reservation_is_of_this_member = z.output<typeof the_reservation_is_of_this_member>

/**
 * The reserved day is this day or a later one.
 *
 * @see {@link selection.the_reservation_is_from_this_day_on}
 */
export const the_reservation_is_from_this_day_on =
  selection.the_reservation_is_from_this_day_on.brand<'loans/selection/reservation/the_reservation_is_from_this_day_on'>()
export type the_reservation_is_from_this_day_on = z.output<
  typeof the_reservation_is_from_this_day_on
>
