// generated

// The commands of `business/loans` from `command.ts` (DOM-25): the same objects
// under the same names, each schema with its output type under the same name,
// so that one import gives both. Only this module imports `command.ts`.

import { z } from 'zod'
import * as command from './command.ts'

/**
 * The tool can be lent: named components, bound one by one by the creator.
 *
 * @see {@link command.the_tool_can_be_lent}
 */
export const the_tool_can_be_lent = command.the_tool_can_be_lent
export type the_tool_can_be_lent = z.output<typeof the_tool_can_be_lent>

/**
 * The tool can be lent today to whoever asks: on its day a reservation holds
 * the tool for its member, who takes it up (`lend_a_booked_tool`); to anyone
 * else it is not available (SC-10).
 *
 * @see {@link command.the_tool_can_be_lent_to_anyone_today}
 */
export const the_tool_can_be_lent_to_anyone_today = command.the_tool_can_be_lent_to_anyone_today
export type the_tool_can_be_lent_to_anyone_today = z.output<
  typeof the_tool_can_be_lent_to_anyone_today
>

/**
 * The tool is lent, its term running, and two dates are awaited (DOM-13):
 * on the eve of the due date `remind_the_member_of_the_due_date` reminds the
 * member, on the due date `declare_the_loan_overdue` stamps the loan
 * overdue, each only if the member still has the tool. Both queued here, not
 * one by the other's return: neither decides the other. Days of the shed
 * (SC-12): Marta takes the drill at 23:30 on 2 November in Toronto, already
 * the 3rd in UTC, and it is due on the 16th; her eve's wait goes at the start
 * of the 15th there. A tool booked for today is lent to no one by this
 * command: its member takes it up (SC-10).
 *
 * @see {@link command.borrow_a_tool}
 */
export const borrow_a_tool = command.borrow_a_tool

/**
 * The input of `borrow_a_tool`, declared inline.
 *
 * @see {@link command.borrow_a_tool}
 */
export const borrow_a_tool_input = command.borrow_a_tool.input
export type borrow_a_tool_input = z.output<typeof borrow_a_tool_input>

/**
 * The member takes up their reservation on its day, the tool lent to them
 * by a loan: a transition of the reservation's life cycle (DOM-19) with no
 * use case of its own, which the loan composes (D111, SC-10).
 *
 * @see {@link command.take_up_a_reservation}
 */
export const take_up_a_reservation = command.take_up_a_reservation

/**
 * The input of `take_up_a_reservation`, declared inline.
 *
 * @see {@link command.take_up_a_reservation}
 */
export const take_up_a_reservation_input = command.take_up_a_reservation.input
export type take_up_a_reservation_input = z.output<typeof take_up_a_reservation_input>

/**
 * The member takes the tool they booked, on its day: Gianni, from the row of
 * his reservation of the drill for Thursday (R8). The desk lends it, as any
 * loan, with its waits, and takes the reservation up: one fact in two parts,
 * the loan's then the reservation's (D111, SC-10). His phone names the
 * reservation, a claim the transition's condition checks against its card:
 * a creator reads no state. A second tap, after the drill went out, records
 * that the reservation was already taken up.
 *
 * @see {@link command.lend_a_booked_tool}
 */
export const lend_a_booked_tool = command.lend_a_booked_tool

/**
 * The input of `lend_a_booked_tool`, declared inline.
 *
 * @see {@link command.lend_a_booked_tool}
 */
export const lend_a_booked_tool_input = command.lend_a_booked_tool.input
export type lend_a_booked_tool_input = z.output<typeof lend_a_booked_tool_input>

/**
 * The tool can be booked for the day.
 *
 * @see {@link command.the_tool_can_be_booked}
 */
export const the_tool_can_be_booked = command.the_tool_can_be_booked
export type the_tool_can_be_booked = z.output<typeof the_tool_can_be_booked>

/**
 * @see {@link command.reserve_a_tool}
 */
export const reserve_a_tool = command.reserve_a_tool

/**
 * The input of `reserve_a_tool`, declared inline.
 *
 * The day is validated against the clock: the schema needs `now`, nothing else.
 *
 * @see {@link command.reserve_a_tool}
 */
export const reserve_a_tool_input = command.reserve_a_tool.input
export type reserve_a_tool_input = z.output<ReturnType<typeof reserve_a_tool_input>>

/**
 * The requested loan exists, is ongoing, and lent the tool the member brings back.
 *
 * @see {@link command.the_loan_can_be_returned}
 */
export const the_loan_can_be_returned = command.the_loan_can_be_returned
export type the_loan_can_be_returned = z.output<typeof the_loan_can_be_returned>

/**
 * The requested loan exists and is already returned.
 *
 * @see {@link command.the_loan_is_already_returned}
 */
export const the_loan_is_already_returned = command.the_loan_is_already_returned
export type the_loan_is_already_returned = z.output<typeof the_loan_is_already_returned>

/**
 * The member brings a tool back, whole or damaged: Marta's drill, damaged,
 * on Tuesday. She says which loan and which tool she holds; the desk checks
 * the tool against the loan's card, and the fact names it, so that a
 * standing order sends a damaged tool to the workshop (`reaction/damage`),
 * reading only the fact (D89.3).
 *
 * @see {@link command.return_a_tool}
 */
export const return_a_tool = command.return_a_tool

/**
 * The input of `return_a_tool`, declared inline.
 *
 * @see {@link command.return_a_tool}
 */
export const return_a_tool_input = command.return_a_tool.input
export type return_a_tool_input = z.output<typeof return_a_tool_input>

/**
 * The member still has the tool the eve reminds of, due on the day it
 * reminds of, and its due date is still ahead: the eve is not late, and
 * the card was neither corrected nor extended since.
 *
 * @see {@link command.the_member_can_still_be_reminded}
 */
export const the_member_can_still_be_reminded = command.the_member_can_still_be_reminded
export type the_member_can_still_be_reminded = z.output<typeof the_member_can_still_be_reminded>

/**
 * The member still has the tool, but the loan was extended since the eve was queued (SC-31).
 *
 * @see {@link command.the_due_day_of_the_ongoing_loan_was_moved}
 */
export const the_due_day_of_the_ongoing_loan_was_moved =
  command.the_due_day_of_the_ongoing_loan_was_moved
export type the_due_day_of_the_ongoing_loan_was_moved = z.output<
  typeof the_due_day_of_the_ongoing_loan_was_moved
>

/**
 * The member still has a tool, but the card names another since the eve was queued (SC-13).
 *
 * @see {@link command.the_tool_of_the_ongoing_loan_was_corrected}
 */
export const the_tool_of_the_ongoing_loan_was_corrected =
  command.the_tool_of_the_ongoing_loan_was_corrected
export type the_tool_of_the_ongoing_loan_was_corrected = z.output<
  typeof the_tool_of_the_ongoing_loan_was_corrected
>

/**
 * The member still has the tool, but its due date has passed: the eve came late.
 *
 * @see {@link command.the_due_date_of_the_ongoing_loan_has_passed}
 */
export const the_due_date_of_the_ongoing_loan_has_passed =
  command.the_due_date_of_the_ongoing_loan_has_passed
export type the_due_date_of_the_ongoing_loan_has_passed = z.output<
  typeof the_due_date_of_the_ongoing_loan_has_passed
>

/**
 * The member still has the tool and its due day is not over: the wait for the overdue came early.
 *
 * @see {@link command.the_due_day_of_the_ongoing_loan_is_not_over}
 */
export const the_due_day_of_the_ongoing_loan_is_not_over =
  command.the_due_day_of_the_ongoing_loan_is_not_over
export type the_due_day_of_the_ongoing_loan_is_not_over = z.output<
  typeof the_due_day_of_the_ongoing_loan_is_not_over
>

/**
 * The return of the eve of the due date (D68.3): the guard is the command's,
 * not the infrastructure's, so a return before the eve meets a branch that
 * records a fact and changes nothing (D95), never a rejection. The eve may
 * come late (the executor was down): no order holds between two effects
 * (D108), so the due date may even have stamped the loan first; the guard
 * reads the due date at the executor's `now`, and a late eve reminds no one
 * (A, 15 Nov 2026). The eve names the tool it was queued for: if the desk
 * corrected the tool on the card since, it reminds of nothing, and the
 * correction queued the eve of the right tool (SC-13); if the loan was
 * extended since, it reminds of nothing either, and the extension queued
 * the eve of the new due day (SC-31). Its input is the
 * payload of the wait, given back by the executor; its operation is the
 * entry's (DOM-14).
 *
 * @see {@link command.remind_the_member_of_the_due_date}
 */
export const remind_the_member_of_the_due_date = command.remind_the_member_of_the_due_date

/**
 * The input of `remind_the_member_of_the_due_date`, declared inline.
 *
 * @see {@link command.remind_the_member_of_the_due_date}
 */
export const remind_the_member_of_the_due_date_input =
  command.remind_the_member_of_the_due_date.input
export type remind_the_member_of_the_due_date_input = z.output<
  typeof remind_the_member_of_the_due_date_input
>

/**
 * The return of the due date (D68.3), guarded as the reminder: if the member
 * still has the tool after the due day, the loan is stamped overdue and stays
 * ongoing; if the tool is back, nothing changes (D95); if the due day is not
 * over, the desk waits again, until the start of the day after today. The
 * guard reads the day at the executor's `now`: a wait queued when a loan was
 * due at an instant (1.x) goes on the due day itself, and the translation of
 * the entry touches its payload, never when it goes (DOM-22). Marta's drill,
 * due at 10:12 on 16 November, becomes overdue on the 17th, as Gianni's
 * ladder after its due day (A, 17 Nov 2026). Its input is the payload of the
 * wait; its operation is the entry's (DOM-14), so a second delivery of the
 * wait is a duplicate, not a second stamp.
 *
 * @see {@link command.declare_the_loan_overdue}
 */
export const declare_the_loan_overdue = command.declare_the_loan_overdue

/**
 * The input of `declare_the_loan_overdue`, declared inline.
 *
 * @see {@link command.declare_the_loan_overdue}
 */
export const declare_the_loan_overdue_input = command.declare_the_loan_overdue.input
export type declare_the_loan_overdue_input = z.output<typeof declare_the_loan_overdue_input>

/**
 * The desk has not yet begun cancelling the reservations of the tool.
 *
 * @see {@link command.no_cancellation_of_the_reservations_of_the_tool_has_begun}
 */
export const no_cancellation_of_the_reservations_of_the_tool_has_begun =
  command.no_cancellation_of_the_reservations_of_the_tool_has_begun
export type no_cancellation_of_the_reservations_of_the_tool_has_begun = z.output<
  typeof no_cancellation_of_the_reservations_of_the_tool_has_begun
>

/**
 * The desk opens its work sheet for the reservations of a tool that can no
 * longer be lent: Luca retired the ladder, and a reaction brings the news
 * (DOM-16). A set chosen by a condition is never changed by one fact: the
 * sheet is a process with a cursor, one reservation a step (DOM-20, D97,
 * D112, D113.4): `continue_the_cancellation_of_reservations`. A second sheet for one tool
 * is no expected occurrence (a redelivery is the duplicate branch, DOM-11):
 * a rejection, which a reaction sends to its dead letter, in sight.
 *
 * @see {@link command.cancel_the_reservations_of_a_tool}
 */
export const cancel_the_reservations_of_a_tool = command.cancel_the_reservations_of_a_tool

/**
 * The input of `cancel_the_reservations_of_a_tool`, declared inline.
 *
 * @see {@link command.cancel_the_reservations_of_a_tool}
 */
export const cancel_the_reservations_of_a_tool_input =
  command.cancel_the_reservations_of_a_tool.input
export type cancel_the_reservations_of_a_tool_input = z.output<
  typeof cancel_the_reservations_of_a_tool_input
>

/**
 * The desk cancels a reservation that still holds the tool. A transition of
 * the reservation's life cycle (DOM-19) with no use case of its own: no one
 * cancels a reservation by itself yet; the work sheet composes it into its
 * step (D111).
 *
 * @see {@link command.cancel_a_reservation}
 */
export const cancel_a_reservation = command.cancel_a_reservation

/**
 * The input of `cancel_a_reservation`, declared inline.
 *
 * @see {@link command.cancel_a_reservation}
 */
export const cancel_a_reservation_input = command.cancel_a_reservation.input
export type cancel_a_reservation_input = z.output<typeof cancel_a_reservation_input>

/**
 * The reservations still ahead for a tool: booked, of the tool, from the day
 * on. The desk goes through them on both its sheets: the cancellation of a
 * retired tool's reservations, and the round of the notices of a repair.
 *
 * @see {@link command.the_reservation_is_still_ahead_for_the_tool}
 */
export const the_reservation_is_still_ahead_for_the_tool =
  command.the_reservation_is_still_ahead_for_the_tool
export type the_reservation_is_still_ahead_for_the_tool = z.output<
  typeof the_reservation_is_still_ahead_for_the_tool
>

/**
 * The desk takes the next reservation on its work sheet and cancels it, or,
 * none left, closes the sheet (DOM-20, D112.2): the ladder is retired, the
 * first step cancels Marta's Saturday, the second Gianni's Sunday, the third
 * closes. The reservations still ahead from the day the sheet was opened,
 * the closest day first, then by id (D109); the cursor the library keeps on
 * the sheet marks where the desk stands, so that a step delivered again is
 * the same step (DOM-11), and one reservation is cancelled once.
 *
 * @see {@link command.continue_the_cancellation_of_reservations}
 */
export const continue_the_cancellation_of_reservations =
  command.continue_the_cancellation_of_reservations

/**
 * The input of `continue_the_cancellation_of_reservations`, declared inline.
 *
 * @see {@link command.continue_the_cancellation_of_reservations}
 */
export const continue_the_cancellation_of_reservations_input =
  command.continue_the_cancellation_of_reservations.input
export type continue_the_cancellation_of_reservations_input = z.output<
  typeof continue_the_cancellation_of_reservations_input
>

/**
 * The desk has not yet begun its round of the notices of the repair.
 *
 * @see {@link command.no_notice_round_of_the_repair_has_begun}
 */
export const no_notice_round_of_the_repair_has_begun =
  command.no_notice_round_of_the_repair_has_begun
export type no_notice_round_of_the_repair_has_begun = z.output<
  typeof no_notice_round_of_the_repair_has_begun
>

/**
 * The desk begins its round of the notices of a repair: the drill went to
 * the workshop on Tuesday, and a reaction brings the news (DOM-16). The
 * members who booked it are notified one at a time, by the steps of the
 * round (DOM-20, D97, D112): `continue_the_repair_notice_round`; their
 * reservations stay, and on the day a tool still in repair is refused to the
 * borrower (`the_tool_is_in_service`). A second round for one stay in repair
 * is no expected occurrence (a redelivery is the duplicate branch, DOM-11):
 * a rejection, to the reaction's dead letter.
 *
 * @see {@link command.notify_the_members_of_a_repair}
 */
export const notify_the_members_of_a_repair = command.notify_the_members_of_a_repair

/**
 * The input of `notify_the_members_of_a_repair`, declared inline.
 *
 * @see {@link command.notify_the_members_of_a_repair}
 */
export const notify_the_members_of_a_repair_input = command.notify_the_members_of_a_repair.input
export type notify_the_members_of_a_repair_input = z.output<
  typeof notify_the_members_of_a_repair_input
>

/**
 * The desk notifies the member who booked a tool that it is in repair; the
 * reservation stays. A transition of the reservation's life cycle (DOM-19)
 * that changes nothing in the state (D95): it records the notice and queues
 * it toward the world (DOM-13). With no use case of its own: the round
 * composes it into its step (D111), and gives it, from the reservation the
 * step read, the member, the tool and the day the notice carries, since a
 * creator reads no state.
 *
 * @see {@link command.notify_a_member_of_the_repair}
 */
export const notify_a_member_of_the_repair = command.notify_a_member_of_the_repair

/**
 * The input of `notify_a_member_of_the_repair`, declared inline.
 *
 * @see {@link command.notify_a_member_of_the_repair}
 */
export const notify_a_member_of_the_repair_input = command.notify_a_member_of_the_repair.input
export type notify_a_member_of_the_repair_input = z.output<
  typeof notify_a_member_of_the_repair_input
>

/**
 * The desk takes the next member on its round of the notices of a repair
 * and notifies them, or, none left, closes the round (DOM-20, D112.2): the
 * drill went to repair on Tuesday, the first step notifies Gianni, booked
 * for Thursday, the second Paolo, booked three weeks on, the third closes. A
 * reservation cancelled in the meantime (the drill retired beyond repair,
 * its own sheet at work) is no longer booked: it leaves the selection, and
 * its member is not notified.
 *
 * @see {@link command.continue_the_repair_notice_round}
 */
export const continue_the_repair_notice_round = command.continue_the_repair_notice_round

/**
 * The input of `continue_the_repair_notice_round`, declared inline.
 *
 * @see {@link command.continue_the_repair_notice_round}
 */
export const continue_the_repair_notice_round_input = command.continue_the_repair_notice_round.input
export type continue_the_repair_notice_round_input = z.output<
  typeof continue_the_repair_notice_round_input
>

/**
 * The desk sends this member no week's summary yet.
 *
 * @see {@link command.no_weekly_summary_goes_to_the_member}
 */
export const no_weekly_summary_goes_to_the_member = command.no_weekly_summary_goes_to_the_member
export type no_weekly_summary_goes_to_the_member = z.output<
  typeof no_weekly_summary_goes_to_the_member
>

/**
 * The desk already sends this member the week's summary.
 *
 * @see {@link command.a_weekly_summary_already_goes_to_the_member}
 */
export const a_weekly_summary_already_goes_to_the_member =
  command.a_weekly_summary_already_goes_to_the_member
export type a_weekly_summary_already_goes_to_the_member = z.output<
  typeof a_weekly_summary_already_goes_to_the_member
>

/**
 * A member asks the desk for the week's summary every Monday (SC-43): the
 * summary begins and waits for the next Monday, at the start of the shed's
 * day; its id, the member and that Monday, one wait per member and Monday
 * (D48). Asked again, nothing changes (D95): no second chain of waits.
 *
 * @see {@link command.begin_a_weekly_summary}
 */
export const begin_a_weekly_summary = command.begin_a_weekly_summary

/**
 * The input of `begin_a_weekly_summary`, declared inline.
 *
 * @see {@link command.begin_a_weekly_summary}
 */
export const begin_a_weekly_summary_input = command.begin_a_weekly_summary.input
export type begin_a_weekly_summary_input = z.output<typeof begin_a_weekly_summary_input>

/**
 * The week of the Monday the member's summary waits for is not over: the summary goes.
 *
 * @see {@link command.the_week_of_the_summary_is_on}
 */
export const the_week_of_the_summary_is_on = command.the_week_of_the_summary_is_on
export type the_week_of_the_summary_is_on = z.output<typeof the_week_of_the_summary_is_on>

/**
 * The week of the Monday the member's summary waits for is over: the wait came late.
 *
 * @see {@link command.the_week_of_the_summary_is_over}
 */
export const the_week_of_the_summary_is_over = command.the_week_of_the_summary_is_over
export type the_week_of_the_summary_is_over = z.output<typeof the_week_of_the_summary_is_over>

/**
 * On a Monday the effect executor comes back (DOM-13), and the desk sums up
 * the week for the member: it sends the week's summary and waits for the
 * next Monday, the first after the executor's `now`: a wait whose return
 * queues the next (SC-43). An entry goes late, never skipped (DOM-13): a
 * wait that comes after its week is over sends no summary of a past week
 * (D95), and awaits the Monday of the current week, which is past, so it
 * goes at once and tells this week; after a downtime of three weeks the
 * member gets one summary, of the week they are in, never one per week
 * missed. Each wait's id is the member and its Monday (D48), so a Monday's
 * return delivered twice is the duplicate branch (DOM-11), never a second
 * chain. Its input is the payload of the wait, given back by the executor;
 * its operation is the entry's (DOM-14).
 *
 * @see {@link command.sum_up_the_week_for_the_member}
 */
export const sum_up_the_week_for_the_member = command.sum_up_the_week_for_the_member

/**
 * The input of `sum_up_the_week_for_the_member`, declared inline.
 *
 * @see {@link command.sum_up_the_week_for_the_member}
 */
export const sum_up_the_week_for_the_member_input = command.sum_up_the_week_for_the_member.input
export type sum_up_the_week_for_the_member_input = z.output<
  typeof sum_up_the_week_for_the_member_input
>
