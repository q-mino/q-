// generated

// The facts of `loans`, branded with their path (DOM-24): the same objects as
// in `fact.ts`, nominal in the types. Only this module imports `fact.ts`.

import { z } from 'zod'
import * as fact from './_fact.ts'

/**
 * Carries the change of state (DOM-5, V9): the whole new loan.
 *
 * @see {@link fact.a_tool_has_been_lent}
 */
export const a_tool_has_been_lent =
  fact.a_tool_has_been_lent.brand<'loans/fact/a_tool_has_been_lent'>()
export type a_tool_has_been_lent = z.output<typeof a_tool_has_been_lent>

/**
 * Nothing to do (DOM-6): the member's ongoing loan of the tool stands.
 *
 * @see {@link fact.the_member_already_has_the_tool}
 */
export const the_member_already_has_the_tool =
  fact.the_member_already_has_the_tool.brand<'loans/fact/the_member_already_has_the_tool'>()
export type the_member_already_has_the_tool = z.output<typeof the_member_already_has_the_tool>

/**
 * Carries the change of state (DOM-5, V9): the whole new reservation.
 *
 * @see {@link fact.a_tool_has_been_booked}
 */
export const a_tool_has_been_booked =
  fact.a_tool_has_been_booked.brand<'loans/fact/a_tool_has_been_booked'>()
export type a_tool_has_been_booked = z.output<typeof a_tool_has_been_booked>

/**
 * Nothing to do (DOM-6): the member's reservation of the tool for the day stands.
 *
 * @see {@link fact.the_member_already_booked_the_tool}
 */
export const the_member_already_booked_the_tool =
  fact.the_member_already_booked_the_tool.brand<'loans/fact/the_member_already_booked_the_tool'>()
export type the_member_already_booked_the_tool = z.output<typeof the_member_already_booked_the_tool>

/**
 * A partial value: the loan's id and its new stage, whole. Tool, member and
 * dates stay as they were. Late or damaged are values of the return, not
 * other facts, until the business language needs them apart.
 *
 * @see {@link fact.a_tool_has_been_returned}
 */
export const a_tool_has_been_returned =
  fact.a_tool_has_been_returned.brand<'loans/fact/a_tool_has_been_returned'>()
export type a_tool_has_been_returned = z.output<typeof a_tool_has_been_returned>

/**
 * Nothing to do (DOM-6): the first return stands.
 *
 * @see {@link fact.the_loan_was_already_returned}
 */
export const the_loan_was_already_returned =
  fact.the_loan_was_already_returned.brand<'loans/fact/the_loan_was_already_returned'>()
export type the_loan_was_already_returned = z.output<typeof the_loan_was_already_returned>
