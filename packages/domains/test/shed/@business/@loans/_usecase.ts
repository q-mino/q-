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
 * A member sees the tools they have: Marta opens "my loans", reads the list,
 * then follows it live; a loan appears, a return takes it away.
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
