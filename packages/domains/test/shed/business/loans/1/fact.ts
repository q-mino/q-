import { z } from 'zod'
import { date_time, day } from '../../../../../src/library/index.ts'
import { earlier, delegate, next, id, tools } from './_scope_fact.ts'

// The facts of `loans` 1.x, a past major (A, 16 Nov 2026 (7)): until 4
// November 2026 a loan was due at an instant (`due_date`), since 2.0.0 on a
// day (`due_day`), the tool back by its end. Its days, in the shed's
// calendar, the desk wrote beside the instants (`start_day`, `due_day`):
// a translation reads the payload alone, with no zone, so it takes a day
// written, never one derived from an instant (SC-12, A, 23 Nov 2026). Every fact of 1.x is here: the one whose shape changed, at
// the last minor of 1.x, written whole, with its step to the next major;
// every other delegated to it. When no fact kept has 1.x any more (D101), the
// folder is deleted.

/** The whole new loan, due at an instant; since 2.0.0 due on its day, the one the desk wrote. */
export const a_tool_has_been_lent = earlier(next.a_tool_has_been_lent)({
  payload: z.strictObject({
    new_loan: z.strictObject({
      id: id.loan_id,
      tool_id: tools.id.tool_id,
      member_id: id.member_id,
      start_date: date_time,
      start_day: day,
      due_date: date_time,
      due_day: day,
      progress: z.strictObject({
        stage: z.literal('ongoing'),
        term: z.enum(['running', 'overdue']),
      }),
    }),
  }),
  to_next: (payload) => ({
    new_loan: {
      id: payload.new_loan.id,
      tool_id: payload.new_loan.tool_id,
      member_id: payload.new_loan.member_id,
      start_date: payload.new_loan.start_date,
      start_day: payload.new_loan.start_day,
      due_day: payload.new_loan.due_day,
      progress: payload.new_loan.progress,
    },
  }),
})

export const a_tool_has_been_lent_again = delegate(next.a_tool_has_been_lent_again)

export const a_tool_has_been_booked = delegate(next.a_tool_has_been_booked)

export const a_tool_has_been_booked_again = delegate(next.a_tool_has_been_booked_again)

export const a_tool_has_been_returned = delegate(next.a_tool_has_been_returned)

export const a_tool_has_been_returned_again = delegate(next.a_tool_has_been_returned_again)

export const the_member_has_been_reminded_of_the_due_date = delegate(
  next.the_member_has_been_reminded_of_the_due_date,
)

export const the_loan_was_returned_before_the_reminder = delegate(
  next.the_loan_was_returned_before_the_reminder,
)

export const the_due_date_came_before_the_reminder = delegate(
  next.the_due_date_came_before_the_reminder,
)

export const a_loan_has_become_overdue = delegate(next.a_loan_has_become_overdue)

export const the_loan_was_returned_before_it_became_overdue = delegate(
  next.the_loan_was_returned_before_it_became_overdue,
)

export const the_cancellation_of_the_reservations_of_a_tool_has_begun = delegate(
  next.the_cancellation_of_the_reservations_of_a_tool_has_begun,
)

export const a_reservation_has_been_cancelled = delegate(next.a_reservation_has_been_cancelled)

export const the_cancellation_has_advanced = delegate(next.the_cancellation_has_advanced)

export const the_cancellation_of_the_reservations_of_a_tool_has_ended = delegate(
  next.the_cancellation_of_the_reservations_of_a_tool_has_ended,
)

export const a_repair_notice_round_has_begun = delegate(next.a_repair_notice_round_has_begun)

export const a_member_has_been_notified_of_the_repair = delegate(
  next.a_member_has_been_notified_of_the_repair,
)

export const the_repair_notice_round_has_advanced = delegate(
  next.the_repair_notice_round_has_advanced,
)

export const the_repair_notice_round_has_ended = delegate(next.the_repair_notice_round_has_ended)
