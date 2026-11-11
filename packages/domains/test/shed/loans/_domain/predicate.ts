// generated

// The predicates of `loans`, branded with their path (DOM-24): the same
// objects as in `predicate.ts`, nominal in the types. Only this module imports
// `predicate.ts`.

import { z } from 'zod'
import * as predicate from './_predicate.ts'

/**
 * The shed has a tool with this id.
 *
 * @see {@link predicate.a_tool_has_this_id}
 */
export const a_tool_has_this_id =
  predicate.a_tool_has_this_id.brand<'loans/predicate/a_tool_has_this_id'>()
export type a_tool_has_this_id = z.output<typeof a_tool_has_this_id>

/**
 * The tool can go out: it is in service in the shed.
 *
 * @see {@link predicate.the_tool_is_in_service}
 */
export const the_tool_is_in_service =
  predicate.the_tool_is_in_service.brand<'loans/predicate/the_tool_is_in_service'>()
export type the_tool_is_in_service = z.output<typeof the_tool_is_in_service>

/**
 * @see {@link predicate.a_loan_has_this_id}
 */
export const a_loan_has_this_id =
  predicate.a_loan_has_this_id.brand<'loans/predicate/a_loan_has_this_id'>()
export type a_loan_has_this_id = z.output<typeof a_loan_has_this_id>

/**
 * @see {@link predicate.the_loan_is_ongoing}
 */
export const the_loan_is_ongoing =
  predicate.the_loan_is_ongoing.brand<'loans/predicate/the_loan_is_ongoing'>()
export type the_loan_is_ongoing = z.output<typeof the_loan_is_ongoing>

/**
 * @see {@link predicate.the_loan_is_returned}
 */
export const the_loan_is_returned =
  predicate.the_loan_is_returned.brand<'loans/predicate/the_loan_is_returned'>()
export type the_loan_is_returned = z.output<typeof the_loan_is_returned>

/**
 * The tool is with a member, whoever it is.
 *
 * @see {@link predicate.the_tool_is_on_loan}
 */
export const the_tool_is_on_loan =
  predicate.the_tool_is_on_loan.brand<'loans/predicate/the_tool_is_on_loan'>()
export type the_tool_is_on_loan = z.output<typeof the_tool_is_on_loan>

/**
 * The tool is with this member.
 *
 * @see {@link predicate.the_tool_is_on_loan_to_this_member}
 */
export const the_tool_is_on_loan_to_this_member =
  predicate.the_tool_is_on_loan_to_this_member.brand<'loans/predicate/the_tool_is_on_loan_to_this_member'>()
export type the_tool_is_on_loan_to_this_member = z.output<typeof the_tool_is_on_loan_to_this_member>

/**
 * @see {@link predicate.a_reservation_has_this_id}
 */
export const a_reservation_has_this_id =
  predicate.a_reservation_has_this_id.brand<'loans/predicate/a_reservation_has_this_id'>()
export type a_reservation_has_this_id = z.output<typeof a_reservation_has_this_id>

/**
 * The tool is booked for the day, by whoever.
 *
 * @see {@link predicate.the_tool_is_booked_for_the_day}
 */
export const the_tool_is_booked_for_the_day =
  predicate.the_tool_is_booked_for_the_day.brand<'loans/predicate/the_tool_is_booked_for_the_day'>()
export type the_tool_is_booked_for_the_day = z.output<typeof the_tool_is_booked_for_the_day>

/**
 * The tool is booked for the day by this member.
 *
 * @see {@link predicate.the_tool_is_booked_for_the_day_by_this_member}
 */
export const the_tool_is_booked_for_the_day_by_this_member =
  predicate.the_tool_is_booked_for_the_day_by_this_member.brand<'loans/predicate/the_tool_is_booked_for_the_day_by_this_member'>()
export type the_tool_is_booked_for_the_day_by_this_member = z.output<
  typeof the_tool_is_booked_for_the_day_by_this_member
>
