// generated

// The facts of `loans`, branded with their path (DOM-24): the same objects as
// in `fact.ts`, nominal in the types. Only this module imports `fact.ts`.

import { z } from 'zod'
import * as fact from './fact.ts'

/**
 * Carries the change of state (DOM-5, V9): the whole new loan.
 *
 * @see {@link fact.a_tool_has_been_lent}
 */
export const a_tool_has_been_lent =
  fact.a_tool_has_been_lent.brand<'business/loans/fact/a_tool_has_been_lent'>()
export type a_tool_has_been_lent = z.output<typeof a_tool_has_been_lent>

/**
 * Nothing to do (DOM-6): the member's ongoing loan of the tool stands.
 *
 * @see {@link fact.the_member_already_has_the_tool}
 */
export const the_member_already_has_the_tool =
  fact.the_member_already_has_the_tool.brand<'business/loans/fact/the_member_already_has_the_tool'>()
export type the_member_already_has_the_tool = z.output<typeof the_member_already_has_the_tool>

/**
 * Carries the change of state (DOM-5, V9): the whole new reservation.
 *
 * @see {@link fact.a_tool_has_been_booked}
 */
export const a_tool_has_been_booked =
  fact.a_tool_has_been_booked.brand<'business/loans/fact/a_tool_has_been_booked'>()
export type a_tool_has_been_booked = z.output<typeof a_tool_has_been_booked>

/**
 * Nothing to do (DOM-6): the member's reservation of the tool for the day stands.
 *
 * @see {@link fact.the_member_already_booked_the_tool}
 */
export const the_member_already_booked_the_tool =
  fact.the_member_already_booked_the_tool.brand<'business/loans/fact/the_member_already_booked_the_tool'>()
export type the_member_already_booked_the_tool = z.output<typeof the_member_already_booked_the_tool>

/**
 * A partial value: the loan's id, the tool it lent and its new stage,
 * whole; member and dates stay as they were. Late or damaged are values of
 * the return, not other facts (A, 16 Nov 2026 (4)): a standing order that
 * cares for the damaged ones translates the others to nothing (D88.2).
 *
 * @see {@link fact.a_tool_has_been_returned}
 */
export const a_tool_has_been_returned =
  fact.a_tool_has_been_returned.brand<'business/loans/fact/a_tool_has_been_returned'>()
export type a_tool_has_been_returned = z.output<typeof a_tool_has_been_returned>

/**
 * Nothing to do (DOM-6): the first return stands.
 *
 * @see {@link fact.the_loan_was_already_returned}
 */
export const the_loan_was_already_returned =
  fact.the_loan_was_already_returned.brand<'business/loans/fact/the_loan_was_already_returned'>()
export type the_loan_was_already_returned = z.output<typeof the_loan_was_already_returned>

/**
 * The eve of the due date came while the member had the tool: the reminder is on its way. Nothing changes in the state (D95).
 *
 * @see {@link fact.the_member_has_been_reminded_of_the_due_date}
 */
export const the_member_has_been_reminded_of_the_due_date =
  fact.the_member_has_been_reminded_of_the_due_date.brand<'business/loans/fact/the_member_has_been_reminded_of_the_due_date'>()
export type the_member_has_been_reminded_of_the_due_date = z.output<
  typeof the_member_has_been_reminded_of_the_due_date
>

/**
 * Nothing to do (DOM-6, D95): the eve came after the return, and no reminder goes.
 *
 * @see {@link fact.the_loan_was_returned_before_the_reminder}
 */
export const the_loan_was_returned_before_the_reminder =
  fact.the_loan_was_returned_before_the_reminder.brand<'business/loans/fact/the_loan_was_returned_before_the_reminder'>()
export type the_loan_was_returned_before_the_reminder = z.output<
  typeof the_loan_was_returned_before_the_reminder
>

/**
 * Nothing to do (DOM-6, D95): the eve was delivered after the due date (the
 * executor was down, or behind), and "bring it back tomorrow" would be
 * false. No reminder goes; the overdue stamp is the due date's to give.
 *
 * @see {@link fact.the_due_date_came_before_the_reminder}
 */
export const the_due_date_came_before_the_reminder =
  fact.the_due_date_came_before_the_reminder.brand<'business/loans/fact/the_due_date_came_before_the_reminder'>()
export type the_due_date_came_before_the_reminder = z.output<
  typeof the_due_date_came_before_the_reminder
>

/**
 * The due date came while the member had the tool: the loan's card is
 * stamped overdue. A partial value, as a return: the loan's id and its new
 * progress, whole; the loan stays ongoing, in "my loans".
 *
 * @see {@link fact.a_loan_has_become_overdue}
 */
export const a_loan_has_become_overdue =
  fact.a_loan_has_become_overdue.brand<'business/loans/fact/a_loan_has_become_overdue'>()
export type a_loan_has_become_overdue = z.output<typeof a_loan_has_become_overdue>

/**
 * Nothing to do (DOM-6, D95): the tool was back when the due date was
 * checked. Late or on time is the return's, derived from its date (dsl).
 *
 * @see {@link fact.the_loan_was_returned_before_it_became_overdue}
 */
export const the_loan_was_returned_before_it_became_overdue =
  fact.the_loan_was_returned_before_it_became_overdue.brand<'business/loans/fact/the_loan_was_returned_before_it_became_overdue'>()
export type the_loan_was_returned_before_it_became_overdue = z.output<
  typeof the_loan_was_returned_before_it_became_overdue
>

/**
 * Not yet (D68.3, D95): the wait for the overdue came while the due day was
 * not over, so the desk waits again, until the day after. A wait queued when
 * a loan was due at an instant (1.x) goes at that instant, on the due day
 * itself: Marta's drill, due at 10:12 on 16 November, is on time until that
 * day ends (A, 17 Nov 2026).
 *
 * @see {@link fact.the_due_day_was_not_over}
 */
export const the_due_day_was_not_over =
  fact.the_due_day_was_not_over.brand<'business/loans/fact/the_due_day_was_not_over'>()
export type the_due_day_was_not_over = z.output<typeof the_due_day_was_not_over>

/**
 * The desk has opened its work sheet for the tool's reservations (D97,
 * D112): the whole new cancellation. Its steps cancel one reservation each.
 *
 * @see {@link fact.the_cancellation_of_the_reservations_of_a_tool_has_begun}
 */
export const the_cancellation_of_the_reservations_of_a_tool_has_begun =
  fact.the_cancellation_of_the_reservations_of_a_tool_has_begun.brand<'business/loans/fact/the_cancellation_of_the_reservations_of_a_tool_has_begun'>()
export type the_cancellation_of_the_reservations_of_a_tool_has_begun = z.output<
  typeof the_cancellation_of_the_reservations_of_a_tool_has_begun
>

/**
 * The desk cancelled a reservation: a partial value, as a return, the
 * reservation's id and its new progress, whole. Recorded as a part of a step
 * of the work sheet (D111), not alone: no one cancels a reservation by
 * itself yet.
 *
 * @see {@link fact.a_reservation_has_been_cancelled}
 */
export const a_reservation_has_been_cancelled =
  fact.a_reservation_has_been_cancelled.brand<'business/loans/fact/a_reservation_has_been_cancelled'>()
export type a_reservation_has_been_cancelled = z.output<typeof a_reservation_has_been_cancelled>

/**
 * The member took the tool on the day they booked it: a partial value, as a
 * return, the reservation's id and its new progress, whole, with the loan
 * that took it up. Recorded as a part of the loan's fact (D111, SC-10), never
 * alone: the reservation is taken up by a loan.
 *
 * @see {@link fact.a_reservation_has_been_taken_up}
 */
export const a_reservation_has_been_taken_up =
  fact.a_reservation_has_been_taken_up.brand<'business/loans/fact/a_reservation_has_been_taken_up'>()
export type a_reservation_has_been_taken_up = z.output<typeof a_reservation_has_been_taken_up>

/**
 * Nothing to do (DOM-6): the member already took the tool they booked; the loan stands.
 *
 * @see {@link fact.the_reservation_was_already_taken_up}
 */
export const the_reservation_was_already_taken_up =
  fact.the_reservation_was_already_taken_up.brand<'business/loans/fact/the_reservation_was_already_taken_up'>()
export type the_reservation_was_already_taken_up = z.output<
  typeof the_reservation_was_already_taken_up
>

/**
 * The desk went one reservation further on the work sheet of the tool: the
 * step's part (D111, D112.2), beside the cancellation it applied. A partial
 * value: the sheet stays under way, its cursor at the reservation handled,
 * written by the library (DOM-20).
 *
 * @see {@link fact.the_cancellation_has_advanced}
 */
export const the_cancellation_has_advanced =
  fact.the_cancellation_has_advanced.brand<'business/loans/fact/the_cancellation_has_advanced'>()
export type the_cancellation_has_advanced = z.output<typeof the_cancellation_has_advanced>

/**
 * No reservation of the tool is left ahead: the desk closes its work sheet (D112.2).
 *
 * @see {@link fact.the_cancellation_of_the_reservations_of_a_tool_is_complete}
 */
export const the_cancellation_of_the_reservations_of_a_tool_is_complete =
  fact.the_cancellation_of_the_reservations_of_a_tool_is_complete.brand<'business/loans/fact/the_cancellation_of_the_reservations_of_a_tool_is_complete'>()
export type the_cancellation_of_the_reservations_of_a_tool_is_complete = z.output<
  typeof the_cancellation_of_the_reservations_of_a_tool_is_complete
>

/**
 * The desk has begun its round of the notices of a repair (D97, D112): the
 * whole new round. Its steps notify one member each.
 *
 * @see {@link fact.a_repair_notice_round_has_begun}
 */
export const a_repair_notice_round_has_begun =
  fact.a_repair_notice_round_has_begun.brand<'business/loans/fact/a_repair_notice_round_has_begun'>()
export type a_repair_notice_round_has_begun = z.output<typeof a_repair_notice_round_has_begun>

/**
 * The desk notified a member that the tool they booked is in repair: the
 * reservation, which stays, and the stay in repair. Nothing changes in the
 * state (D95): the notice is on its way. Recorded as a part of a step of the
 * round (D111).
 *
 * @see {@link fact.a_member_has_been_notified_of_the_repair}
 */
export const a_member_has_been_notified_of_the_repair =
  fact.a_member_has_been_notified_of_the_repair.brand<'business/loans/fact/a_member_has_been_notified_of_the_repair'>()
export type a_member_has_been_notified_of_the_repair = z.output<
  typeof a_member_has_been_notified_of_the_repair
>

/**
 * The desk went one member further on the round of the notices of a repair:
 * the step's part (D111, D112.2), beside the notice it recorded. A partial
 * value: the round stays under way, its cursor at the reservation handled,
 * written by the library (DOM-20).
 *
 * @see {@link fact.the_repair_notice_round_has_advanced}
 */
export const the_repair_notice_round_has_advanced =
  fact.the_repair_notice_round_has_advanced.brand<'business/loans/fact/the_repair_notice_round_has_advanced'>()
export type the_repair_notice_round_has_advanced = z.output<
  typeof the_repair_notice_round_has_advanced
>

/**
 * No reservation of the tool is left ahead: the desk closes its round of notices (D112.2).
 *
 * @see {@link fact.the_repair_notice_round_is_complete}
 */
export const the_repair_notice_round_is_complete =
  fact.the_repair_notice_round_is_complete.brand<'business/loans/fact/the_repair_notice_round_is_complete'>()
export type the_repair_notice_round_is_complete = z.output<
  typeof the_repair_notice_round_is_complete
>
