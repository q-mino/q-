// generated

// The commands of `loans` under their names, each schema with its output type
// under the same name: one import gives both.

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
 * The tool is lent, its term running, and two dates are awaited (DOM-13):
 * on the eve of the due date `remind_the_member_of_the_due_date` reminds the
 * member, on the due date `declare_the_loan_overdue` stamps the loan
 * overdue, each only if the member still has the tool. Both queued here, not
 * one by the other's return: neither decides the other. One loan, one wait of
 * each: the loan's id is each entry's.
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
 * The input of `reserve_a_tool`, declared inline. The day is validated
 * against the clock: the schema needs `now`, nothing else.
 *
 * @see {@link command.reserve_a_tool}
 */
export const reserve_a_tool_input = command.reserve_a_tool.input
export type reserve_a_tool_input = z.output<ReturnType<typeof reserve_a_tool_input>>

/**
 * The requested loan exists and is ongoing.
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
 * The requested loan exists and the member still has the tool.
 *
 * @see {@link command.the_member_still_has_the_tool}
 */
export const the_member_still_has_the_tool = command.the_member_still_has_the_tool
export type the_member_still_has_the_tool = z.output<typeof the_member_still_has_the_tool>

/**
 * The return of the eve of the due date (D68.3): the guard is the command's,
 * not the infrastructure's, so a return before the eve meets a branch that
 * records a fact and changes nothing (D95), never a rejection. Its input is
 * the payload of the wait, given back by the executor; its operation is the
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
 * still has the tool, the loan is stamped overdue and stays ongoing; if the
 * tool is back, nothing changes (D95). Its input is the payload of the wait;
 * its operation is the entry's (DOM-14), so a second delivery of the wait is
 * a duplicate, not a second stamp.
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
