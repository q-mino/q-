// generated

// The predicates of `loans`, branded with their path (DOM-24): the same
// objects as in `predicate.ts`, nominal in the types. Only this module imports
// `predicate.ts`.

import { z } from 'zod'
import * as predicate from './predicate.ts'

/**
 * The shed has a tool with this id.
 *
 * @see {@link predicate.a_tool_has_this_id}
 */
export const a_tool_has_this_id =
  predicate.a_tool_has_this_id.brand<'business/loans/predicate/a_tool_has_this_id'>()
export type a_tool_has_this_id = z.output<typeof a_tool_has_this_id>

/**
 * The tool can go out: it is in service in the shed.
 *
 * @see {@link predicate.the_tool_is_in_service}
 */
export const the_tool_is_in_service =
  predicate.the_tool_is_in_service.brand<'business/loans/predicate/the_tool_is_in_service'>()
export type the_tool_is_in_service = z.output<typeof the_tool_is_in_service>

/**
 * @see {@link predicate.a_loan_has_this_id}
 */
export const a_loan_has_this_id =
  predicate.a_loan_has_this_id.brand<'business/loans/predicate/a_loan_has_this_id'>()
export type a_loan_has_this_id = z.output<typeof a_loan_has_this_id>

/**
 * @see {@link predicate.the_loan_is_ongoing}
 */
export const the_loan_is_ongoing =
  predicate.the_loan_is_ongoing.brand<'business/loans/predicate/the_loan_is_ongoing'>()
export type the_loan_is_ongoing = z.output<typeof the_loan_is_ongoing>

/**
 * @see {@link predicate.the_loan_is_returned}
 */
export const the_loan_is_returned =
  predicate.the_loan_is_returned.brand<'business/loans/predicate/the_loan_is_returned'>()
export type the_loan_is_returned = z.output<typeof the_loan_is_returned>

/**
 * The loan is of this tool: the tool the member brings back is the one
 * the loan lent. The member says which tool they hold, the desk checks it
 * against the loan's card (A, 16 Nov 2026 (4)).
 *
 * @see {@link predicate.the_loan_is_of_this_tool}
 */
export const the_loan_is_of_this_tool =
  predicate.the_loan_is_of_this_tool.brand<'business/loans/predicate/the_loan_is_of_this_tool'>()
export type the_loan_is_of_this_tool = z.output<typeof the_loan_is_of_this_tool>

/**
 * The due date on the loan's card is still ahead at an instant: "bring it
 * back tomorrow" is still true. The instant is a parameter, the clock of
 * whoever asks (GR-8): time is not a fact (D92.4), the due date is.
 *
 * @see {@link predicate.the_due_date_of_the_loan_is_still_ahead}
 */
export const the_due_date_of_the_loan_is_still_ahead =
  predicate.the_due_date_of_the_loan_is_still_ahead.brand<'business/loans/predicate/the_due_date_of_the_loan_is_still_ahead'>()
export type the_due_date_of_the_loan_is_still_ahead = z.output<
  typeof the_due_date_of_the_loan_is_still_ahead
>

/**
 * The tool is with a member, whoever it is.
 *
 * @see {@link predicate.the_tool_is_on_loan}
 */
export const the_tool_is_on_loan =
  predicate.the_tool_is_on_loan.brand<'business/loans/predicate/the_tool_is_on_loan'>()
export type the_tool_is_on_loan = z.output<typeof the_tool_is_on_loan>

/**
 * The tool is with this member.
 *
 * @see {@link predicate.the_tool_is_on_loan_to_this_member}
 */
export const the_tool_is_on_loan_to_this_member =
  predicate.the_tool_is_on_loan_to_this_member.brand<'business/loans/predicate/the_tool_is_on_loan_to_this_member'>()
export type the_tool_is_on_loan_to_this_member = z.output<typeof the_tool_is_on_loan_to_this_member>

/**
 * @see {@link predicate.a_reservation_has_this_id}
 */
export const a_reservation_has_this_id =
  predicate.a_reservation_has_this_id.brand<'business/loans/predicate/a_reservation_has_this_id'>()
export type a_reservation_has_this_id = z.output<typeof a_reservation_has_this_id>

/**
 * The reservation holds the tool for its day: it can still be cancelled.
 *
 * @see {@link predicate.the_reservation_is_booked}
 */
export const the_reservation_is_booked =
  predicate.the_reservation_is_booked.brand<'business/loans/predicate/the_reservation_is_booked'>()
export type the_reservation_is_booked = z.output<typeof the_reservation_is_booked>

/**
 * The tool is booked for the day, by whoever.
 *
 * @see {@link predicate.the_tool_is_booked_for_the_day}
 */
export const the_tool_is_booked_for_the_day =
  predicate.the_tool_is_booked_for_the_day.brand<'business/loans/predicate/the_tool_is_booked_for_the_day'>()
export type the_tool_is_booked_for_the_day = z.output<typeof the_tool_is_booked_for_the_day>

/**
 * The tool is booked for the day by this member.
 *
 * @see {@link predicate.the_tool_is_booked_for_the_day_by_this_member}
 */
export const the_tool_is_booked_for_the_day_by_this_member =
  predicate.the_tool_is_booked_for_the_day_by_this_member.brand<'business/loans/predicate/the_tool_is_booked_for_the_day_by_this_member'>()
export type the_tool_is_booked_for_the_day_by_this_member = z.output<
  typeof the_tool_is_booked_for_the_day_by_this_member
>

/**
 * The desk has begun cancelling the reservations of the tool.
 *
 * @see {@link predicate.a_cancellation_of_the_reservations_of_the_tool_has_begun}
 */
export const a_cancellation_of_the_reservations_of_the_tool_has_begun =
  predicate.a_cancellation_of_the_reservations_of_the_tool_has_begun.brand<'business/loans/predicate/a_cancellation_of_the_reservations_of_the_tool_has_begun'>()
export type a_cancellation_of_the_reservations_of_the_tool_has_begun = z.output<
  typeof a_cancellation_of_the_reservations_of_the_tool_has_begun
>
