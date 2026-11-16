// generated

// The path registry of `loans` 1.x (DOM-24, A, 16 Nov 2026 (7)): every path
// of the major with its component, its shape at 1.x or its delegation; the
// same paths as the current's, the version apart. The configurator gives it
// to the library beside the current's, by major.

import type * as wlib from '../../../wlib.ts'
import * as effect from './_effect.ts'
import * as fact from './_fact.ts'

export const registry = {
  'business/loans/fact/a_tool_has_been_lent': fact.a_tool_has_been_lent,
  'business/loans/fact/the_member_already_has_the_tool': fact.the_member_already_has_the_tool,
  'business/loans/fact/a_tool_has_been_booked': fact.a_tool_has_been_booked,
  'business/loans/fact/the_member_already_booked_the_tool': fact.the_member_already_booked_the_tool,
  'business/loans/fact/a_tool_has_been_returned': fact.a_tool_has_been_returned,
  'business/loans/fact/the_loan_was_already_returned': fact.the_loan_was_already_returned,
  'business/loans/fact/the_member_has_been_reminded_of_the_due_date':
    fact.the_member_has_been_reminded_of_the_due_date,
  'business/loans/fact/the_loan_was_returned_before_the_reminder':
    fact.the_loan_was_returned_before_the_reminder,
  'business/loans/fact/the_due_date_came_before_the_reminder':
    fact.the_due_date_came_before_the_reminder,
  'business/loans/fact/a_loan_has_become_overdue': fact.a_loan_has_become_overdue,
  'business/loans/fact/the_loan_was_returned_before_it_became_overdue':
    fact.the_loan_was_returned_before_it_became_overdue,
  'business/loans/fact/the_cancellation_of_the_reservations_of_a_tool_has_begun':
    fact.the_cancellation_of_the_reservations_of_a_tool_has_begun,
  'business/loans/fact/a_reservation_has_been_cancelled': fact.a_reservation_has_been_cancelled,
  'business/loans/fact/the_cancellation_has_advanced': fact.the_cancellation_has_advanced,
  'business/loans/fact/the_cancellation_of_the_reservations_of_a_tool_is_complete':
    fact.the_cancellation_of_the_reservations_of_a_tool_is_complete,
  'business/loans/fact/a_repair_notice_round_has_begun': fact.a_repair_notice_round_has_begun,
  'business/loans/fact/a_member_has_been_notified_of_the_repair':
    fact.a_member_has_been_notified_of_the_repair,
  'business/loans/fact/the_repair_notice_round_has_advanced':
    fact.the_repair_notice_round_has_advanced,
  'business/loans/fact/the_repair_notice_round_is_complete':
    fact.the_repair_notice_round_is_complete,
  'business/loans/effect/wait_until_the_eve_of_the_due_date':
    effect.wait_until_the_eve_of_the_due_date,
  'business/loans/effect/send_the_due_date_reminder': effect.send_the_due_date_reminder,
  'business/loans/effect/wait_until_the_due_date': effect.wait_until_the_due_date,
  'business/loans/effect/send_the_repair_notice': effect.send_the_repair_notice,
} satisfies wlib.Registry
