// generated

// The selection predicates of `business/loans` from `reservation_selection.ts`
// (DOM-25): the same objects under the same names, branded with their path
// (DOM-24), each schema with its output type under the same name, so that one
// import gives both. Only this module imports `reservation_selection.ts`.

import { z } from 'zod'
import * as selection from './reservation_selection.ts'

/**
 * @see {@link selection.the_reservation_is_booked}
 */
export const the_reservation_is_booked =
  selection.the_reservation_is_booked.brand<'business/loans/selection/reservation/the_reservation_is_booked'>()
export type the_reservation_is_booked = z.output<typeof the_reservation_is_booked>

/**
 * @see {@link selection.the_reservation_is_of_this_member}
 */
export const the_reservation_is_of_this_member =
  selection.the_reservation_is_of_this_member.brand<'business/loans/selection/reservation/the_reservation_is_of_this_member'>()
export type the_reservation_is_of_this_member = z.output<typeof the_reservation_is_of_this_member>

/**
 * @see {@link selection.the_reservation_is_of_this_tool}
 */
export const the_reservation_is_of_this_tool =
  selection.the_reservation_is_of_this_tool.brand<'business/loans/selection/reservation/the_reservation_is_of_this_tool'>()
export type the_reservation_is_of_this_tool = z.output<typeof the_reservation_is_of_this_tool>

/**
 * The reserved day is this day or a later one.
 *
 * @see {@link selection.the_reservation_is_from_this_day_on}
 */
export const the_reservation_is_from_this_day_on =
  selection.the_reservation_is_from_this_day_on.brand<'business/loans/selection/reservation/the_reservation_is_from_this_day_on'>()
export type the_reservation_is_from_this_day_on = z.output<
  typeof the_reservation_is_from_this_day_on
>

/**
 * The tool held by the reservation is in the workshop: a selection over the
 * state of `tools`, which `loans` sees as its own view of the tools (GR-3),
 * and the adapter reads from the catalogue (SC-20).
 *
 * @see {@link selection.the_tool_of_the_reservation_is_in_the_workshop}
 */
export const the_tool_of_the_reservation_is_in_the_workshop =
  selection.the_tool_of_the_reservation_is_in_the_workshop.brand<'business/loans/selection/reservation/the_tool_of_the_reservation_is_in_the_workshop'>()
export type the_tool_of_the_reservation_is_in_the_workshop = z.output<
  typeof the_tool_of_the_reservation_is_in_the_workshop
>
