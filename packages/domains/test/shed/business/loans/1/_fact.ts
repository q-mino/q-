// generated

// The facts of `business/loans/1` from `fact.ts` (DOM-25): the same objects
// under the same names, branded with their path (DOM-24), each schema with its
// output type under the same name, so that one import gives both. Only this
// module imports `fact.ts`.

import { z } from 'zod'
import * as fact from './fact.ts'

/**
 * The whole new loan, due at an instant; since 2.0.0 due on its day, the one the desk wrote.
 *
 * @see {@link fact.a_tool_has_been_lent}
 */
export const a_tool_has_been_lent =
  fact.a_tool_has_been_lent.brand<'business/loans/fact/a_tool_has_been_lent@1'>()
export type a_tool_has_been_lent = z.output<typeof a_tool_has_been_lent>

/**
 * @see {@link fact.a_tool_has_been_lent_again}
 */
export const a_tool_has_been_lent_again = fact.a_tool_has_been_lent_again

/**
 * @see {@link fact.a_tool_has_been_booked}
 */
export const a_tool_has_been_booked = fact.a_tool_has_been_booked

/**
 * @see {@link fact.a_tool_has_been_booked_again}
 */
export const a_tool_has_been_booked_again = fact.a_tool_has_been_booked_again

/**
 * @see {@link fact.a_tool_has_been_returned}
 */
export const a_tool_has_been_returned = fact.a_tool_has_been_returned

/**
 * @see {@link fact.a_tool_has_been_returned_again}
 */
export const a_tool_has_been_returned_again = fact.a_tool_has_been_returned_again

/**
 * @see {@link fact.the_member_has_been_reminded_of_the_due_date}
 */
export const the_member_has_been_reminded_of_the_due_date =
  fact.the_member_has_been_reminded_of_the_due_date

/**
 * @see {@link fact.the_loan_was_returned_before_the_reminder}
 */
export const the_loan_was_returned_before_the_reminder =
  fact.the_loan_was_returned_before_the_reminder

/**
 * @see {@link fact.the_due_date_came_before_the_reminder}
 */
export const the_due_date_came_before_the_reminder = fact.the_due_date_came_before_the_reminder

/**
 * @see {@link fact.a_loan_has_become_overdue}
 */
export const a_loan_has_become_overdue = fact.a_loan_has_become_overdue

/**
 * @see {@link fact.the_loan_was_returned_before_it_became_overdue}
 */
export const the_loan_was_returned_before_it_became_overdue =
  fact.the_loan_was_returned_before_it_became_overdue

/**
 * @see {@link fact.the_cancellation_of_the_reservations_of_a_tool_has_begun}
 */
export const the_cancellation_of_the_reservations_of_a_tool_has_begun =
  fact.the_cancellation_of_the_reservations_of_a_tool_has_begun

/**
 * @see {@link fact.a_reservation_has_been_cancelled}
 */
export const a_reservation_has_been_cancelled = fact.a_reservation_has_been_cancelled

/**
 * @see {@link fact.the_cancellation_has_advanced}
 */
export const the_cancellation_has_advanced = fact.the_cancellation_has_advanced

/**
 * @see {@link fact.the_cancellation_of_the_reservations_of_a_tool_has_ended}
 */
export const the_cancellation_of_the_reservations_of_a_tool_has_ended =
  fact.the_cancellation_of_the_reservations_of_a_tool_has_ended

/**
 * @see {@link fact.a_repair_notice_round_has_begun}
 */
export const a_repair_notice_round_has_begun = fact.a_repair_notice_round_has_begun

/**
 * @see {@link fact.a_member_has_been_notified_of_the_repair}
 */
export const a_member_has_been_notified_of_the_repair =
  fact.a_member_has_been_notified_of_the_repair

/**
 * @see {@link fact.the_repair_notice_round_has_advanced}
 */
export const the_repair_notice_round_has_advanced = fact.the_repair_notice_round_has_advanced

/**
 * @see {@link fact.the_repair_notice_round_has_ended}
 */
export const the_repair_notice_round_has_ended = fact.the_repair_notice_round_has_ended
