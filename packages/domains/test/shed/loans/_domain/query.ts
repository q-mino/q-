// generated

// The queries of `loans` under their names, each schema with its output type
// under the same name: one import gives both.

import { z } from 'zod'
import * as query from './_query.ts'

/**
 * @see {@link query.the_ongoing_loans_of_a_member_input}
 */
export const the_ongoing_loans_of_a_member_input = query.the_ongoing_loans_of_a_member_input
export type the_ongoing_loans_of_a_member_input = z.output<
  typeof the_ongoing_loans_of_a_member_input
>

/**
 * The loan is ongoing and the member has the tool.
 *
 * @see {@link query.the_loan_is_ongoing_for_the_member}
 */
export const the_loan_is_ongoing_for_the_member = query.the_loan_is_ongoing_for_the_member
export type the_loan_is_ongoing_for_the_member = z.output<typeof the_loan_is_ongoing_for_the_member>

/**
 * The tools a member has: the ongoing loans, the closest due date first.
 *
 * @see {@link query.the_ongoing_loans_of_a_member}
 */
export const the_ongoing_loans_of_a_member = query.the_ongoing_loans_of_a_member

/**
 * @see {@link query.the_reservations_of_a_member_input}
 */
export const the_reservations_of_a_member_input = query.the_reservations_of_a_member_input
export type the_reservations_of_a_member_input = z.output<typeof the_reservations_of_a_member_input>

/**
 * The reservation is in force, the member's, for today or a later day.
 *
 * @see {@link query.the_reservation_is_ahead_for_the_member}
 */
export const the_reservation_is_ahead_for_the_member = query.the_reservation_is_ahead_for_the_member
export type the_reservation_is_ahead_for_the_member = z.output<
  typeof the_reservation_is_ahead_for_the_member
>

/**
 * The member's reservations from today on, the closest day first.
 *
 * @see {@link query.the_reservations_of_a_member}
 */
export const the_reservations_of_a_member = query.the_reservations_of_a_member
