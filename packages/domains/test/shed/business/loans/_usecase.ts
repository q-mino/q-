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
 * desk's own standing order, after each step.
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
 * A member sees their reservations from today on.
 *
 * @see {@link usecase.the_reservations_of_a_member}
 */
export const the_reservations_of_a_member = usecase.the_reservations_of_a_member
