// generated

// The use cases of `loans` under their names (DOM-2).

import * as usecase from './usecase.ts'

/**
 * A member borrows a tool: Marta takes the drill home.
 *
 * @see {@link usecase.borrow_a_tool}
 */
export const borrow_a_tool = usecase.borrow_a_tool

/**
 * A member takes the tool they booked, on its day: Gianni, the drill, Thursday.
 *
 * @see {@link usecase.lend_a_booked_tool}
 */
export const lend_a_booked_tool = usecase.lend_a_booked_tool

/**
 * A member books a tool for a day ahead: the ladder for Saturday.
 *
 * @see {@link usecase.reserve_a_tool}
 */
export const reserve_a_tool = usecase.reserve_a_tool

/**
 * A member brings a tool back, in good condition or damaged.
 *
 * @see {@link usecase.return_a_tool}
 */
export const return_a_tool = usecase.return_a_tool

/**
 * On the eve of the due date the effect executor comes back (DOM-13): Marta
 * is reminded if she still has the drill. The return of the wait queued by
 * a loan.
 *
 * @see {@link usecase.remind_the_member_of_the_due_date}
 */
export const remind_the_member_of_the_due_date = usecase.remind_the_member_of_the_due_date

/**
 * On the due date the effect executor comes back (DOM-13): Marta's loan of
 * the drill is stamped overdue if she still has it. The return of the wait
 * queued by a loan.
 *
 * @see {@link usecase.declare_the_loan_overdue}
 */
export const declare_the_loan_overdue = usecase.declare_the_loan_overdue

/**
 * The reservations desk cancels the reservations of a tool that can no
 * longer be lent: the ladder is retired, and Marta's Saturday and Gianni's
 * Sunday go. Invoked by a reaction to the retirement (DOM-16).
 *
 * @see {@link usecase.cancel_the_reservations_of_a_tool}
 */
export const cancel_the_reservations_of_a_tool = usecase.cancel_the_reservations_of_a_tool

/**
 * The desk goes one reservation further on its work sheet, or closes it: a
 * step of the cancellation of a tool's reservations (DOM-20). Invoked by the
 * desk's own standing orders (DOM-16): when the sheet opens, and after each
 * step that advanced it.
 *
 * @see {@link usecase.continue_the_cancellation_of_reservations}
 */
export const continue_the_cancellation_of_reservations =
  usecase.continue_the_cancellation_of_reservations

/**
 * A member sees the tools they have: Marta opens "my loans", reads the list,
 * then follows it live; a loan appears, falls overdue, a return takes it
 * away. With the register goes one notice by name: a loan has fallen overdue
 * (D64.2, D101.4).
 *
 * @see {@link usecase.the_ongoing_loans_of_a_member}
 */
export const the_ongoing_loans_of_a_member = usecase.the_ongoing_loans_of_a_member

/**
 * A member sees their reservations from today on: Gianni opens "my
 * reservations", reads the list, then follows it live; a booking appears, a
 * cancellation takes one away. With the register goes one notice by name:
 * the desk has notified the member that the tool they booked is in repair, a
 * part of a step of its round (D111, A, 16 Nov 2026 (6)).
 *
 * @see {@link usecase.the_reservations_of_a_member}
 */
export const the_reservations_of_a_member = usecase.the_reservations_of_a_member

/**
 * Gianni sees the reservations whose tool is in the workshop: the drill he
 * booked for Thursday comes in when it goes to repair, and goes when it is
 * back in service, by facts of `tools` (SC-20).
 *
 * @see {@link usecase.the_reservations_of_a_member_in_the_workshop}
 */
export const the_reservations_of_a_member_in_the_workshop =
  usecase.the_reservations_of_a_member_in_the_workshop

/**
 * Luca sees how many times each tool of the shed went out this month, the
 * idle ones at zero: a count of the desk's register (SC-21).
 *
 * @see {@link usecase.the_loans_of_each_tool_this_month}
 */
export const the_loans_of_each_tool_this_month = usecase.the_loans_of_each_tool_this_month

/**
 * The desk begins its round of the notices of a repair: the drill is in the
 * workshop, and Gianni and Paolo, who booked it, will hear of it. Invoked by
 * a reaction to the repair (DOM-16).
 *
 * @see {@link usecase.notify_the_members_of_a_repair}
 */
export const notify_the_members_of_a_repair = usecase.notify_the_members_of_a_repair

/**
 * The desk goes one member further on its round of the notices of a repair,
 * or closes it: a step of the round (DOM-20). Invoked by the desk's own
 * standing orders (DOM-16): when the round begins, and after each step that
 * advanced it.
 *
 * @see {@link usecase.continue_the_repair_notice_round}
 */
export const continue_the_repair_notice_round = usecase.continue_the_repair_notice_round

/**
 * A member asks the desk for the week's summary every Monday.
 *
 * @see {@link usecase.begin_a_weekly_summary}
 */
export const begin_a_weekly_summary = usecase.begin_a_weekly_summary

/**
 * On a Monday the desk sends the member the week's summary and waits for
 * the next Monday. The return of the wait.
 *
 * @see {@link usecase.sum_up_the_week_for_the_member}
 */
export const sum_up_the_week_for_the_member = usecase.sum_up_the_week_for_the_member
