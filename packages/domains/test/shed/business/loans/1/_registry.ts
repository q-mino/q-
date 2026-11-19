// generated

// The path registry of `business/loans` 1.x, a past major (DOM-22, DOM-24,
// PER-17): its whole map, every path of the major with its component, written
// whole or delegated to the next major's, and the input of every leaf, its own
// or delegated; the same paths as the current's, the version apart. The majors
// of the domain list it (`../_majors.ts`).

import type * as wlib from '../../../wlib.ts'
import * as fact from './_fact.ts'
import * as effect from './_effect.ts'

export const registry = {
  'business/loans/fact/a_tool_has_been_lent': fact.a_tool_has_been_lent,
  'business/loans/fact/a_tool_has_been_lent_again': fact.a_tool_has_been_lent_again,
  'business/loans/fact/a_tool_has_been_booked': fact.a_tool_has_been_booked,
  'business/loans/fact/a_tool_has_been_booked_again': fact.a_tool_has_been_booked_again,
  'business/loans/fact/a_tool_has_been_returned': fact.a_tool_has_been_returned,
  'business/loans/fact/a_tool_has_been_returned_again': fact.a_tool_has_been_returned_again,
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
  'business/loans/fact/the_cancellation_of_the_reservations_of_a_tool_has_ended':
    fact.the_cancellation_of_the_reservations_of_a_tool_has_ended,
  'business/loans/fact/a_repair_notice_round_has_begun': fact.a_repair_notice_round_has_begun,
  'business/loans/fact/a_member_has_been_notified_of_the_repair':
    fact.a_member_has_been_notified_of_the_repair,
  'business/loans/fact/the_repair_notice_round_has_advanced':
    fact.the_repair_notice_round_has_advanced,
  'business/loans/fact/the_repair_notice_round_has_ended': fact.the_repair_notice_round_has_ended,
  'business/loans/effect/wait_until_the_eve_of_the_due_date':
    effect.wait_until_the_eve_of_the_due_date,
  'business/loans/effect/send_the_due_date_reminder': effect.send_the_due_date_reminder,
  'business/loans/effect/wait_until_the_due_date': effect.wait_until_the_due_date,
  'business/loans/effect/send_the_repair_notice': effect.send_the_repair_notice,
} satisfies wlib.Registry
