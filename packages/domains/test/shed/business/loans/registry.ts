// generated

// The path registry of `loans` (DOM-24): every path with its component, in
// the order of the modules. The configurator gives it to the library, which
// reads it in reverse, from a component to its path, by object identity.

import type * as wlib from '../../wlib.ts'
import * as command from './command.ts'
import * as fact from './fact.ts'
import * as id from './id.ts'
import * as predicate from './predicate.ts'
import * as query from './query.ts'
import * as selection from './selection/index.ts'
import * as usecase from './usecase.ts'
import * as value from './value.ts'

export const registry = {
  'loans/id/loan_id': id.loan_id,
  'loans/id/member_id': id.member_id,
  'loans/id/reservation_id': id.reservation_id,
  'loans/value/tool_name': value.tool_name,
  'loans/value/loan_stage': value.loan_stage,
  'loans/value/return_condition': value.return_condition,
  'loans/value/loan_ongoing': value.loan_ongoing,
  'loans/value/loan_returned': value.loan_returned,
  'loans/value/loan_progress': value.loan_progress,
  'loans/value/loan': value.loan,
  'loans/value/ongoing_loan': value.ongoing_loan,
  'loans/value/returned_loan': value.returned_loan,
  'loans/value/reservation_stage': value.reservation_stage,
  'loans/value/reservation_booked': value.reservation_booked,
  'loans/value/reservation_progress': value.reservation_progress,
  'loans/value/reservation': value.reservation,
  'loans/value/booked_reservation': value.booked_reservation,
  'loans/value/ongoing_loan_entry': value.ongoing_loan_entry,
  'loans/value/reservation_entry': value.reservation_entry,
  'loans/fact/a_tool_has_been_lent': fact.a_tool_has_been_lent,
  'loans/fact/the_member_already_has_the_tool': fact.the_member_already_has_the_tool,
  'loans/fact/a_tool_has_been_booked': fact.a_tool_has_been_booked,
  'loans/fact/the_member_already_booked_the_tool': fact.the_member_already_booked_the_tool,
  'loans/fact/a_tool_has_been_returned': fact.a_tool_has_been_returned,
  'loans/fact/the_loan_was_already_returned': fact.the_loan_was_already_returned,
  'loans/predicate/a_tool_has_this_id': predicate.a_tool_has_this_id,
  'loans/predicate/the_tool_is_in_service': predicate.the_tool_is_in_service,
  'loans/predicate/a_loan_has_this_id': predicate.a_loan_has_this_id,
  'loans/predicate/the_loan_is_ongoing': predicate.the_loan_is_ongoing,
  'loans/predicate/the_loan_is_returned': predicate.the_loan_is_returned,
  'loans/predicate/the_tool_is_on_loan': predicate.the_tool_is_on_loan,
  'loans/predicate/the_tool_is_on_loan_to_this_member':
    predicate.the_tool_is_on_loan_to_this_member,
  'loans/predicate/a_reservation_has_this_id': predicate.a_reservation_has_this_id,
  'loans/predicate/the_tool_is_booked_for_the_day': predicate.the_tool_is_booked_for_the_day,
  'loans/predicate/the_tool_is_booked_for_the_day_by_this_member':
    predicate.the_tool_is_booked_for_the_day_by_this_member,
  'loans/command/the_tool_can_be_lent': command.the_tool_can_be_lent,
  'loans/command/borrow_a_tool': command.borrow_a_tool,
  'loans/command/borrow_a_tool_input': command.borrow_a_tool_input,
  'loans/command/the_tool_can_be_booked': command.the_tool_can_be_booked,
  'loans/command/reserve_a_tool': command.reserve_a_tool,
  'loans/command/reserve_a_tool_input': command.reserve_a_tool_input,
  'loans/command/the_loan_can_be_returned': command.the_loan_can_be_returned,
  'loans/command/the_loan_is_already_returned': command.the_loan_is_already_returned,
  'loans/command/return_a_tool': command.return_a_tool,
  'loans/command/return_a_tool_input': command.return_a_tool_input,
  'loans/selection/loan/the_loan_is_ongoing': selection.loan.the_loan_is_ongoing,
  'loans/selection/loan/the_loan_is_of_this_member': selection.loan.the_loan_is_of_this_member,
  'loans/selection/reservation/the_reservation_is_booked':
    selection.reservation.the_reservation_is_booked,
  'loans/selection/reservation/the_reservation_is_of_this_member':
    selection.reservation.the_reservation_is_of_this_member,
  'loans/selection/reservation/the_reservation_is_from_this_day_on':
    selection.reservation.the_reservation_is_from_this_day_on,
  'loans/query/the_loan_is_ongoing_for_the_member': query.the_loan_is_ongoing_for_the_member,
  'loans/query/the_ongoing_loans_of_a_member': query.the_ongoing_loans_of_a_member,
  'loans/query/the_ongoing_loans_of_a_member_input': query.the_ongoing_loans_of_a_member_input,
  'loans/query/the_reservation_is_ahead_for_the_member':
    query.the_reservation_is_ahead_for_the_member,
  'loans/query/the_reservations_of_a_member': query.the_reservations_of_a_member,
  'loans/query/the_reservations_of_a_member_input': query.the_reservations_of_a_member_input,
  'loans/usecase/borrow_a_tool': usecase.borrow_a_tool,
  'loans/usecase/reserve_a_tool': usecase.reserve_a_tool,
  'loans/usecase/return_a_tool': usecase.return_a_tool,
  'loans/usecase/the_ongoing_loans_of_a_member': usecase.the_ongoing_loans_of_a_member,
  'loans/usecase/the_reservations_of_a_member': usecase.the_reservations_of_a_member,
} satisfies wlib.Registry
