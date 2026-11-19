// generated

// The path registry of `business/loans` (DOM-24): every path with its
// component, in the order of the twins. The configurator gives it to the
// library, which reads it in reverse, from a component to its path, by object
// identity. The registries of the folders below it come with it, its subtree
// (D105).

import type * as wlib from '../../../../src/library/index.ts'
import * as id from './_id.ts'
import * as value from './_value.ts'
import * as fact from './_fact.ts'
import * as predicate from './_predicate.ts'
import * as effect from './_effect.ts'
import * as loan_selection from './_loan_selection.ts'
import * as reservation_selection from './_reservation_selection.ts'
import * as tool_selection from './_tool_selection.ts'
import * as tool_calculation from './_tool_calculation.ts'
import * as command from './_command.ts'
import * as query from './_query.ts'
import * as usecase from './_usecase.ts'
import * as reaction from './_reaction.ts'
import * as version from './_version.ts'
import { registry as an_ongoing_loan } from './an_ongoing_loan/_registry.ts'

export const registry = {
  'business/loans/id/loan_id': id.loan_id,
  'business/loans/id/member_id': id.member_id,
  'business/loans/id/reservation_id': id.reservation_id,
  'business/loans/value/tool_name': value.tool_name,
  'business/loans/value/loan_stage': value.loan_stage,
  'business/loans/value/return_condition': value.return_condition,
  'business/loans/value/loan_term': value.loan_term,
  'business/loans/value/loan_ongoing': value.loan_ongoing,
  'business/loans/value/loan_returned': value.loan_returned,
  'business/loans/value/loan_progress': value.loan_progress,
  'business/loans/value/loan': value.loan,
  'business/loans/value/ongoing_loan': value.ongoing_loan,
  'business/loans/value/overdue_loan': value.overdue_loan,
  'business/loans/value/returned_loan': value.returned_loan,
  'business/loans/value/reservation_stage': value.reservation_stage,
  'business/loans/value/reservation_booked': value.reservation_booked,
  'business/loans/value/reservation_taken_up': value.reservation_taken_up,
  'business/loans/value/reservation_cancelled': value.reservation_cancelled,
  'business/loans/value/reservation_progress': value.reservation_progress,
  'business/loans/value/reservation': value.reservation,
  'business/loans/value/booked_reservation': value.booked_reservation,
  'business/loans/value/taken_up_reservation': value.taken_up_reservation,
  'business/loans/value/cancelled_reservation': value.cancelled_reservation,
  'business/loans/value/ongoing_loan_entry': value.ongoing_loan_entry,
  'business/loans/value/number_of_loans': value.number_of_loans,
  'business/loans/value/tool_of_the_shed_entry': value.tool_of_the_shed_entry,
  'business/loans/value/reservation_entry': value.reservation_entry,
  'business/loans/value/cancellation_stage': value.cancellation_stage,
  'business/loans/value/cancellation_cancelling': value.cancellation_cancelling,
  'business/loans/value/cancellation_complete': value.cancellation_complete,
  'business/loans/value/cancellation_progress': value.cancellation_progress,
  'business/loans/value/cancellation_of_reservations': value.cancellation_of_reservations,
  'business/loans/value/cancellation_under_way': value.cancellation_under_way,
  'business/loans/value/completed_cancellation': value.completed_cancellation,
  'business/loans/value/repair_notice_round_stage': value.repair_notice_round_stage,
  'business/loans/value/repair_notice_round_notifying': value.repair_notice_round_notifying,
  'business/loans/value/repair_notice_round_complete': value.repair_notice_round_complete,
  'business/loans/value/repair_notice_round_progress': value.repair_notice_round_progress,
  'business/loans/value/repair_notice_round': value.repair_notice_round,
  'business/loans/value/repair_notice_round_under_way': value.repair_notice_round_under_way,
  'business/loans/value/completed_repair_notice_round': value.completed_repair_notice_round,
  'business/loans/value/weekly_summary': value.weekly_summary,
  'business/loans/fact/a_tool_has_been_lent': fact.a_tool_has_been_lent,
  'business/loans/fact/a_tool_has_been_lent_again': fact.a_tool_has_been_lent_again,
  'business/loans/fact/a_tool_has_been_booked': fact.a_tool_has_been_booked,
  'business/loans/fact/a_tool_has_been_booked_again': fact.a_tool_has_been_booked_again,
  'business/loans/fact/a_tool_has_been_returned': fact.a_tool_has_been_returned,
  'business/loans/fact/a_tool_has_been_returned_again': fact.a_tool_has_been_returned_again,
  'business/loans/fact/the_tool_of_a_loan_has_been_corrected':
    fact.the_tool_of_a_loan_has_been_corrected,
  'business/loans/fact/a_loan_has_been_extended': fact.a_loan_has_been_extended,
  'business/loans/fact/the_due_day_was_moved_before_the_reminder':
    fact.the_due_day_was_moved_before_the_reminder,
  'business/loans/fact/the_tool_of_a_loan_has_been_corrected_again':
    fact.the_tool_of_a_loan_has_been_corrected_again,
  'business/loans/fact/the_tool_was_corrected_before_the_reminder':
    fact.the_tool_was_corrected_before_the_reminder,
  'business/loans/fact/the_member_has_been_reminded_of_the_due_date':
    fact.the_member_has_been_reminded_of_the_due_date,
  'business/loans/fact/the_loan_was_returned_before_the_reminder':
    fact.the_loan_was_returned_before_the_reminder,
  'business/loans/fact/the_due_date_came_before_the_reminder':
    fact.the_due_date_came_before_the_reminder,
  'business/loans/fact/a_loan_has_become_overdue': fact.a_loan_has_become_overdue,
  'business/loans/fact/the_loan_was_returned_before_it_became_overdue':
    fact.the_loan_was_returned_before_it_became_overdue,
  'business/loans/fact/the_overdue_check_has_been_put_off': fact.the_overdue_check_has_been_put_off,
  'business/loans/fact/the_cancellation_of_the_reservations_of_a_tool_has_begun':
    fact.the_cancellation_of_the_reservations_of_a_tool_has_begun,
  'business/loans/fact/a_reservation_has_been_cancelled': fact.a_reservation_has_been_cancelled,
  'business/loans/fact/a_reservation_has_been_taken_up': fact.a_reservation_has_been_taken_up,
  'business/loans/fact/a_reservation_has_been_taken_up_again':
    fact.a_reservation_has_been_taken_up_again,
  'business/loans/fact/the_cancellation_has_advanced': fact.the_cancellation_has_advanced,
  'business/loans/fact/the_cancellation_of_the_reservations_of_a_tool_has_ended':
    fact.the_cancellation_of_the_reservations_of_a_tool_has_ended,
  'business/loans/fact/a_repair_notice_round_has_begun': fact.a_repair_notice_round_has_begun,
  'business/loans/fact/a_member_has_been_notified_of_the_repair':
    fact.a_member_has_been_notified_of_the_repair,
  'business/loans/fact/the_repair_notice_round_has_advanced':
    fact.the_repair_notice_round_has_advanced,
  'business/loans/fact/the_repair_notice_round_has_ended': fact.the_repair_notice_round_has_ended,
  'business/loans/fact/a_weekly_summary_has_begun': fact.a_weekly_summary_has_begun,
  'business/loans/fact/a_weekly_summary_has_begun_again': fact.a_weekly_summary_has_begun_again,
  'business/loans/fact/the_weeks_summary_has_been_sent': fact.the_weeks_summary_has_been_sent,
  'business/loans/fact/a_past_weeks_summary_has_been_skipped':
    fact.a_past_weeks_summary_has_been_skipped,
  'business/loans/predicate/a_tool_has_this_id': predicate.a_tool_has_this_id,
  'business/loans/predicate/the_tool_is_in_service': predicate.the_tool_is_in_service,
  'business/loans/predicate/a_loan_has_this_id': predicate.a_loan_has_this_id,
  'business/loans/predicate/the_loan_is_ongoing': predicate.the_loan_is_ongoing,
  'business/loans/predicate/the_loan_is_returned': predicate.the_loan_is_returned,
  'business/loans/predicate/the_loan_is_of_this_tool': predicate.the_loan_is_of_this_tool,
  'business/loans/predicate/the_loan_is_of_this_member': predicate.the_loan_is_of_this_member,
  'business/loans/predicate/the_loan_is_due_on_this_day': predicate.the_loan_is_due_on_this_day,
  'business/loans/predicate/the_due_date_of_the_loan_is_still_ahead':
    predicate.the_due_date_of_the_loan_is_still_ahead,
  'business/loans/predicate/the_tool_is_on_loan': predicate.the_tool_is_on_loan,
  'business/loans/predicate/the_tool_is_on_loan_to_this_member':
    predicate.the_tool_is_on_loan_to_this_member,
  'business/loans/predicate/a_reservation_has_this_id': predicate.a_reservation_has_this_id,
  'business/loans/predicate/the_reservation_is_booked': predicate.the_reservation_is_booked,
  'business/loans/predicate/the_reservation_holds_the_tool_for_the_member_on_the_day':
    predicate.the_reservation_holds_the_tool_for_the_member_on_the_day,
  'business/loans/predicate/the_reservation_of_the_member_has_been_taken_up':
    predicate.the_reservation_of_the_member_has_been_taken_up,
  'business/loans/predicate/the_tool_is_booked_for_the_day':
    predicate.the_tool_is_booked_for_the_day,
  'business/loans/predicate/the_tool_is_booked_on_a_day_up_to':
    predicate.the_tool_is_booked_on_a_day_up_to,
  'business/loans/predicate/the_tool_is_booked_for_the_day_by_this_member':
    predicate.the_tool_is_booked_for_the_day_by_this_member,
  'business/loans/predicate/a_cancellation_of_the_reservations_of_the_tool_has_begun':
    predicate.a_cancellation_of_the_reservations_of_the_tool_has_begun,
  'business/loans/predicate/the_notice_round_of_the_repair_has_begun':
    predicate.the_notice_round_of_the_repair_has_begun,
  'business/loans/predicate/a_weekly_summary_goes_to_the_member':
    predicate.a_weekly_summary_goes_to_the_member,
  'business/loans/predicate/the_week_of_the_summary_is_not_over':
    predicate.the_week_of_the_summary_is_not_over,
  'business/loans/effect/wait_until_the_eve_of_the_due_date':
    effect.wait_until_the_eve_of_the_due_date,
  'business/loans/effect/send_the_due_date_reminder': effect.send_the_due_date_reminder,
  'business/loans/effect/wait_until_the_due_date': effect.wait_until_the_due_date,
  'business/loans/effect/send_the_repair_notice': effect.send_the_repair_notice,
  'business/loans/effect/wait_until_monday': effect.wait_until_monday,
  'business/loans/effect/send_the_weeks_summary': effect.send_the_weeks_summary,
  'business/loans/selection/loan/the_loan_is_ongoing': loan_selection.the_loan_is_ongoing,
  'business/loans/selection/loan/the_loan_is_of_this_member':
    loan_selection.the_loan_is_of_this_member,
  'business/loans/selection/reservation/the_reservation_is_booked':
    reservation_selection.the_reservation_is_booked,
  'business/loans/selection/reservation/the_reservation_is_of_this_member':
    reservation_selection.the_reservation_is_of_this_member,
  'business/loans/selection/reservation/the_reservation_is_of_this_tool':
    reservation_selection.the_reservation_is_of_this_tool,
  'business/loans/selection/reservation/the_reservation_is_from_this_day_on':
    reservation_selection.the_reservation_is_from_this_day_on,
  'business/loans/selection/reservation/the_tool_of_the_reservation_is_in_the_workshop':
    reservation_selection.the_tool_of_the_reservation_is_in_the_workshop,
  'business/loans/selection/tool/the_tool_is_still_in_the_shed':
    tool_selection.the_tool_is_still_in_the_shed,
  'business/loans/calculation/tool/the_loans_of_the_tool_between_these_days':
    tool_calculation.the_loans_of_the_tool_between_these_days,
  'business/loans/command/the_tool_can_be_lent': command.the_tool_can_be_lent,
  'business/loans/command/the_tool_can_be_lent_to_anyone_today':
    command.the_tool_can_be_lent_to_anyone_today,
  'business/loans/command/borrow_a_tool': command.borrow_a_tool,
  'business/loans/command/borrow_a_tool_input': command.borrow_a_tool_input,
  'business/loans/command/take_up_a_reservation': command.take_up_a_reservation,
  'business/loans/command/take_up_a_reservation_input': command.take_up_a_reservation_input,
  'business/loans/command/lend_a_booked_tool': command.lend_a_booked_tool,
  'business/loans/command/lend_a_booked_tool_input': command.lend_a_booked_tool_input,
  'business/loans/command/the_tool_can_be_booked': command.the_tool_can_be_booked,
  'business/loans/command/reserve_a_tool': command.reserve_a_tool,
  'business/loans/command/reserve_a_tool_input': command.reserve_a_tool_input,
  'business/loans/command/the_loan_can_be_returned': command.the_loan_can_be_returned,
  'business/loans/command/the_loan_is_already_returned': command.the_loan_is_already_returned,
  'business/loans/command/return_a_tool': command.return_a_tool,
  'business/loans/command/return_a_tool_input': command.return_a_tool_input,
  'business/loans/command/the_member_can_still_be_reminded':
    command.the_member_can_still_be_reminded,
  'business/loans/command/the_due_day_of_the_ongoing_loan_was_moved':
    command.the_due_day_of_the_ongoing_loan_was_moved,
  'business/loans/command/the_tool_of_the_ongoing_loan_was_corrected':
    command.the_tool_of_the_ongoing_loan_was_corrected,
  'business/loans/command/the_due_date_of_the_ongoing_loan_has_passed':
    command.the_due_date_of_the_ongoing_loan_has_passed,
  'business/loans/command/the_due_day_of_the_ongoing_loan_is_not_over':
    command.the_due_day_of_the_ongoing_loan_is_not_over,
  'business/loans/command/remind_the_member_of_the_due_date':
    command.remind_the_member_of_the_due_date,
  'business/loans/command/remind_the_member_of_the_due_date_input':
    command.remind_the_member_of_the_due_date_input,
  'business/loans/command/declare_the_loan_overdue': command.declare_the_loan_overdue,
  'business/loans/command/declare_the_loan_overdue_input': command.declare_the_loan_overdue_input,
  'business/loans/command/no_cancellation_of_the_reservations_of_the_tool_has_begun':
    command.no_cancellation_of_the_reservations_of_the_tool_has_begun,
  'business/loans/command/cancel_the_reservations_of_a_tool':
    command.cancel_the_reservations_of_a_tool,
  'business/loans/command/cancel_the_reservations_of_a_tool_input':
    command.cancel_the_reservations_of_a_tool_input,
  'business/loans/command/cancel_a_reservation': command.cancel_a_reservation,
  'business/loans/command/cancel_a_reservation_input': command.cancel_a_reservation_input,
  'business/loans/command/the_reservation_is_still_ahead_for_the_tool':
    command.the_reservation_is_still_ahead_for_the_tool,
  'business/loans/command/continue_the_cancellation_of_reservations':
    command.continue_the_cancellation_of_reservations,
  'business/loans/command/continue_the_cancellation_of_reservations_input':
    command.continue_the_cancellation_of_reservations_input,
  'business/loans/command/no_notice_round_of_the_repair_has_begun':
    command.no_notice_round_of_the_repair_has_begun,
  'business/loans/command/notify_the_members_of_a_repair': command.notify_the_members_of_a_repair,
  'business/loans/command/notify_the_members_of_a_repair_input':
    command.notify_the_members_of_a_repair_input,
  'business/loans/command/notify_a_member_of_the_repair': command.notify_a_member_of_the_repair,
  'business/loans/command/notify_a_member_of_the_repair_input':
    command.notify_a_member_of_the_repair_input,
  'business/loans/command/continue_the_repair_notice_round':
    command.continue_the_repair_notice_round,
  'business/loans/command/continue_the_repair_notice_round_input':
    command.continue_the_repair_notice_round_input,
  'business/loans/command/no_weekly_summary_goes_to_the_member':
    command.no_weekly_summary_goes_to_the_member,
  'business/loans/command/a_weekly_summary_already_goes_to_the_member':
    command.a_weekly_summary_already_goes_to_the_member,
  'business/loans/command/begin_a_weekly_summary': command.begin_a_weekly_summary,
  'business/loans/command/begin_a_weekly_summary_input': command.begin_a_weekly_summary_input,
  'business/loans/command/the_week_of_the_summary_is_on': command.the_week_of_the_summary_is_on,
  'business/loans/command/the_week_of_the_summary_is_over': command.the_week_of_the_summary_is_over,
  'business/loans/command/sum_up_the_week_for_the_member': command.sum_up_the_week_for_the_member,
  'business/loans/command/sum_up_the_week_for_the_member_input':
    command.sum_up_the_week_for_the_member_input,
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
  'business/loans/query/the_reservation_ahead_waits_for_the_workshop':
    query.the_reservation_ahead_waits_for_the_workshop,
  'business/loans/query/the_reservations_of_a_member_in_the_workshop':
    query.the_reservations_of_a_member_in_the_workshop,
  'business/loans/query/the_reservations_of_a_member_in_the_workshop_input':
    query.the_reservations_of_a_member_in_the_workshop_input,
  'business/loans/query/the_loans_of_each_tool_this_month': query.the_loans_of_each_tool_this_month,
  'business/loans/query/the_loans_of_each_tool_this_month_input':
    query.the_loans_of_each_tool_this_month_input,
  'business/loans/usecase/borrow_a_tool': usecase.borrow_a_tool,
  'business/loans/usecase/lend_a_booked_tool': usecase.lend_a_booked_tool,
  'business/loans/usecase/reserve_a_tool': usecase.reserve_a_tool,
  'business/loans/usecase/return_a_tool': usecase.return_a_tool,
  'business/loans/usecase/remind_the_member_of_the_due_date':
    usecase.remind_the_member_of_the_due_date,
  'business/loans/usecase/declare_the_loan_overdue': usecase.declare_the_loan_overdue,
  'business/loans/usecase/cancel_the_reservations_of_a_tool':
    usecase.cancel_the_reservations_of_a_tool,
  'business/loans/usecase/continue_the_cancellation_of_reservations':
    usecase.continue_the_cancellation_of_reservations,
  'business/loans/usecase/the_ongoing_loans_of_a_member': usecase.the_ongoing_loans_of_a_member,
  'business/loans/usecase/the_reservations_of_a_member': usecase.the_reservations_of_a_member,
  'business/loans/usecase/the_reservations_of_a_member_in_the_workshop':
    usecase.the_reservations_of_a_member_in_the_workshop,
  'business/loans/usecase/the_loans_of_each_tool_this_month':
    usecase.the_loans_of_each_tool_this_month,
  'business/loans/usecase/notify_the_members_of_a_repair': usecase.notify_the_members_of_a_repair,
  'business/loans/usecase/continue_the_repair_notice_round':
    usecase.continue_the_repair_notice_round,
  'business/loans/usecase/begin_a_weekly_summary': usecase.begin_a_weekly_summary,
  'business/loans/usecase/sum_up_the_week_for_the_member': usecase.sum_up_the_week_for_the_member,
  'business/loans/reaction/the_first_reservation_on_the_sheet_is_taken_up':
    reaction.the_first_reservation_on_the_sheet_is_taken_up,
  'business/loans/reaction/the_next_reservation_on_the_sheet_is_taken_up':
    reaction.the_next_reservation_on_the_sheet_is_taken_up,
  'business/loans/reaction/the_first_member_on_the_round_is_notified':
    reaction.the_first_member_on_the_round_is_notified,
  'business/loans/reaction/the_next_member_on_the_round_is_notified':
    reaction.the_next_member_on_the_round_is_notified,
  'business/loans/version/loans': version.loans,
  ...an_ongoing_loan,
} satisfies wlib.Registry
