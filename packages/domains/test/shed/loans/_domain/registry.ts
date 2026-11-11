// generated

// The path registry of `loans` (DOM-24): each path with its component. The
// configurator gives it to the library, which reads it in reverse, from a
// component to its path, by object identity. Here the components the library
// meets at runtime so far; the generator lists every component.

import type * as wlib from '../../wlib.ts'
import * as fact from './fact.ts'
import * as id from './id.ts'
import * as predicate from './predicate.ts'
import * as selection from './selection/index.ts'

export const registry = {
  'loans/id/loan_id': id.loan_id,
  'loans/id/member_id': id.member_id,
  'loans/id/reservation_id': id.reservation_id,
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
  'loans/selection/loan/the_loan_is_ongoing': selection.loan.the_loan_is_ongoing,
  'loans/selection/loan/the_loan_is_of_this_member': selection.loan.the_loan_is_of_this_member,
  'loans/selection/reservation/the_reservation_is_booked':
    selection.reservation.the_reservation_is_booked,
  'loans/selection/reservation/the_reservation_is_of_this_member':
    selection.reservation.the_reservation_is_of_this_member,
  'loans/selection/reservation/the_reservation_is_from_this_day_on':
    selection.reservation.the_reservation_is_from_this_day_on,
} satisfies wlib.Registry
