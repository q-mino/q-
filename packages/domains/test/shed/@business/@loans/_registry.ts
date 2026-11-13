// generated

// The path registry of `loans` (DOM-24): every path with its component, in
// the order of the modules. The configurator gives it to the library, which
// reads it in reverse, from a component to its path, by object identity.

import type * as wlib from '../../wlib.ts'
import * as command from './_command.ts'
import * as effect from './_effect.ts'
import * as fact from './_fact.ts'
import * as id from './_id.ts'
import * as predicate from './_predicate.ts'
import * as query from './_query.ts'
import * as loan_selection from './_loan_selection.ts'
import * as reservation_selection from './_reservation_selection.ts'
import * as usecase from './_usecase.ts'
import * as value from './_value.ts'

export const registry = {
  'business/loans/id/loan_id': id.loan_id,
  'business/loans/id/member_id': id.member_id,
  'business/loans/id/reservation_id': id.reservation_id,
  'business/loans/value/tool_name': value.tool_name,
  'business/loans/value/loan_stage': value.loan_stage,
  'business/loans/value/return_condition': value.return_condition,
  'business/loans/value/loan_ongoing': value.loan_ongoing,
  'business/loans/value/loan_returned': value.loan_returned,
  'business/loans/value/loan_progress': value.loan_progress,
  'business/loans/value/loan': value.loan,
  'business/loans/value/ongoing_loan': value.ongoing_loan,
  'business/loans/value/returned_loan': value.returned_loan,
  'business/loans/value/reservation_stage': value.reservation_stage,
  'business/loans/value/reservation_booked': value.reservation_booked,
  'business/loans/value/reservation_progress': value.reservation_progress,
  'business/loans/value/reservation': value.reservation,
  'business/loans/value/booked_reservation': value.booked_reservation,
  'business/loans/value/ongoing_loan_entry': value.ongoing_loan_entry,
  'business/loans/value/reservation_entry': value.reservation_entry,
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
  'business/loans/effect/wait_until_the_eve_of_the_due_date':
    effect.wait_until_the_eve_of_the_due_date,
  'business/loans/effect/send_the_due_date_reminder': effect.send_the_due_date_reminder,
  'business/loans/predicate/a_tool_has_this_id': predicate.a_tool_has_this_id,
  'business/loans/predicate/the_tool_is_in_service': predicate.the_tool_is_in_service,
  'business/loans/predicate/a_loan_has_this_id': predicate.a_loan_has_this_id,
  'business/loans/predicate/the_loan_is_ongoing': predicate.the_loan_is_ongoing,
  'business/loans/predicate/the_loan_is_returned': predicate.the_loan_is_returned,
  'business/loans/predicate/the_tool_is_on_loan': predicate.the_tool_is_on_loan,
  'business/loans/predicate/the_tool_is_on_loan_to_this_member':
    predicate.the_tool_is_on_loan_to_this_member,
  'business/loans/predicate/a_reservation_has_this_id': predicate.a_reservation_has_this_id,
  'business/loans/predicate/the_tool_is_booked_for_the_day':
    predicate.the_tool_is_booked_for_the_day,
  'business/loans/predicate/the_tool_is_booked_for_the_day_by_this_member':
    predicate.the_tool_is_booked_for_the_day_by_this_member,
  'business/loans/command/the_tool_can_be_lent': command.the_tool_can_be_lent,
  'business/loans/command/borrow_a_tool': command.borrow_a_tool,
  'business/loans/command/borrow_a_tool_input': command.borrow_a_tool_input,
  'business/loans/command/the_tool_can_be_booked': command.the_tool_can_be_booked,
  'business/loans/command/reserve_a_tool': command.reserve_a_tool,
  'business/loans/command/reserve_a_tool_input': command.reserve_a_tool_input,
  'business/loans/command/the_loan_can_be_returned': command.the_loan_can_be_returned,
  'business/loans/command/the_loan_is_already_returned': command.the_loan_is_already_returned,
  'business/loans/command/return_a_tool': command.return_a_tool,
  'business/loans/command/return_a_tool_input': command.return_a_tool_input,
  'business/loans/command/the_member_still_has_the_tool': command.the_member_still_has_the_tool,
  'business/loans/command/remind_the_member_of_the_due_date':
    command.remind_the_member_of_the_due_date,
  'business/loans/command/remind_the_member_of_the_due_date_input':
    command.remind_the_member_of_the_due_date_input,
  'business/loans/selection/loan/the_loan_is_ongoing': loan_selection.the_loan_is_ongoing,
  'business/loans/selection/loan/the_loan_is_of_this_member':
    loan_selection.the_loan_is_of_this_member,
  'business/loans/selection/reservation/the_reservation_is_booked':
    reservation_selection.the_reservation_is_booked,
  'business/loans/selection/reservation/the_reservation_is_of_this_member':
    reservation_selection.the_reservation_is_of_this_member,
  'business/loans/selection/reservation/the_reservation_is_from_this_day_on':
    reservation_selection.the_reservation_is_from_this_day_on,
  'business/loans/query/the_loan_is_ongoing_for_the_member':
    query.the_loan_is_ongoing_for_the_member,
  'business/loans/query/the_ongoing_loans_of_a_member': query.the_ongoing_loans_of_a_member,
  'business/loans/query/the_ongoing_loans_of_a_member_input':
    query.the_ongoing_loans_of_a_member_input,
  'business/loans/query/the_reservation_is_ahead_for_the_member':
    query.the_reservation_is_ahead_for_the_member,
  'business/loans/query/the_reservations_of_a_member': query.the_reservations_of_a_member,
  'business/loans/query/the_reservations_of_a_member_input':
    query.the_reservations_of_a_member_input,
  'business/loans/usecase/borrow_a_tool': usecase.borrow_a_tool,
  'business/loans/usecase/reserve_a_tool': usecase.reserve_a_tool,
  'business/loans/usecase/return_a_tool': usecase.return_a_tool,
  'business/loans/usecase/remind_the_member_of_the_due_date':
    usecase.remind_the_member_of_the_due_date,
  'business/loans/usecase/the_ongoing_loans_of_a_member': usecase.the_ongoing_loans_of_a_member,
  'business/loans/usecase/the_reservations_of_a_member': usecase.the_reservations_of_a_member,
} satisfies wlib.Registry
