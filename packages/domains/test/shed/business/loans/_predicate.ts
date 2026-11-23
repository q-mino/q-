// generated

// The predicates of `business/loans` from `predicate.ts` (DOM-25): the same
// objects under the same names, branded with their path (DOM-24), each schema
// with its output type under the same name, so that one import gives both. Only
// this module imports `predicate.ts`.

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
 * The loan's card names this member (SC-13): a claim of whoever corrects it.
 *
 * @see {@link predicate.the_loan_is_of_this_member}
 */
export const the_loan_is_of_this_member =
  predicate.the_loan_is_of_this_member.brand<'business/loans/predicate/the_loan_is_of_this_member'>()
export type the_loan_is_of_this_member = z.output<typeof the_loan_is_of_this_member>

/**
 * The loan's card says it is due on this day (SC-13): a claim of whoever corrects it.
 *
 * @see {@link predicate.the_loan_is_due_on_this_day}
 */
export const the_loan_is_due_on_this_day =
  predicate.the_loan_is_due_on_this_day.brand<'business/loans/predicate/the_loan_is_due_on_this_day'>()
export type the_loan_is_due_on_this_day = z.output<typeof the_loan_is_due_on_this_day>

/**
 * The due date on the loan's card is still ahead today: "bring it back
 * tomorrow" is still true. Today is a parameter, the day of the clock of
 * whoever asks in the shed's zone (GR-8, SC-12): time is not a fact (D92.4),
 * the due date is.
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
 * The reservation holds this tool for this member on this day: Gianni's R8,
 * the drill, Thursday. The member's phone names the reservation, and the
 * desk checks it against its card (SC-10).
 *
 * @see {@link predicate.the_reservation_holds_the_tool_for_the_member_on_the_day}
 */
export const the_reservation_holds_the_tool_for_the_member_on_the_day =
  predicate.the_reservation_holds_the_tool_for_the_member_on_the_day.brand<'business/loans/predicate/the_reservation_holds_the_tool_for_the_member_on_the_day'>()
export type the_reservation_holds_the_tool_for_the_member_on_the_day = z.output<
  typeof the_reservation_holds_the_tool_for_the_member_on_the_day
>

/**
 * The member's reservation has been taken up: they took the tool on its day.
 *
 * @see {@link predicate.the_reservation_of_the_member_has_been_taken_up}
 */
export const the_reservation_of_the_member_has_been_taken_up =
  predicate.the_reservation_of_the_member_has_been_taken_up.brand<'business/loans/predicate/the_reservation_of_the_member_has_been_taken_up'>()
export type the_reservation_of_the_member_has_been_taken_up = z.output<
  typeof the_reservation_of_the_member_has_been_taken_up
>

/**
 * The tool is booked for the day, by whoever.
 *
 * @see {@link predicate.the_tool_is_booked_for_the_day}
 */
export const the_tool_is_booked_for_the_day =
  predicate.the_tool_is_booked_for_the_day.brand<'business/loans/predicate/the_tool_is_booked_for_the_day'>()
export type the_tool_is_booked_for_the_day = z.output<typeof the_tool_is_booked_for_the_day>

/**
 * The tool is booked for a day from today up to this one, by whoever: a loan
 * that would keep it out until then takes a booked day from someone (SC-31).
 *
 * @see {@link predicate.the_tool_is_booked_on_a_day_up_to}
 */
export const the_tool_is_booked_on_a_day_up_to =
  predicate.the_tool_is_booked_on_a_day_up_to.brand<'business/loans/predicate/the_tool_is_booked_on_a_day_up_to'>()
export type the_tool_is_booked_on_a_day_up_to = z.output<typeof the_tool_is_booked_on_a_day_up_to>

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

/**
 * The desk has begun its round of the notices of the repair.
 *
 * @see {@link predicate.the_notice_round_of_the_repair_has_begun}
 */
export const the_notice_round_of_the_repair_has_begun =
  predicate.the_notice_round_of_the_repair_has_begun.brand<'business/loans/predicate/the_notice_round_of_the_repair_has_begun'>()
export type the_notice_round_of_the_repair_has_begun = z.output<
  typeof the_notice_round_of_the_repair_has_begun
>

/**
 * The desk sends this member the week's summary every Monday (SC-43).
 *
 * @see {@link predicate.a_weekly_summary_goes_to_the_member}
 */
export const a_weekly_summary_goes_to_the_member =
  predicate.a_weekly_summary_goes_to_the_member.brand<'business/loans/predicate/a_weekly_summary_goes_to_the_member'>()
export type a_weekly_summary_goes_to_the_member = z.output<
  typeof a_weekly_summary_goes_to_the_member
>

/**
 * The week of the Monday the member's summary waits for is not over today,
 * in the shed's calendar: a summary sent in its week still tells the week (SC-43).
 *
 * @see {@link predicate.the_week_of_the_summary_is_not_over}
 */
export const the_week_of_the_summary_is_not_over =
  predicate.the_week_of_the_summary_is_not_over.brand<'business/loans/predicate/the_week_of_the_summary_is_not_over'>()
export type the_week_of_the_summary_is_not_over = z.output<
  typeof the_week_of_the_summary_is_not_over
>
