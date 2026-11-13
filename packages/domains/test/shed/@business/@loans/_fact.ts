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
 * A partial value: the loan's id and its new stage, whole. Tool, member and
 * dates stay as they were. Late or damaged are values of the return, not
 * other facts, until the business language needs them apart.
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
