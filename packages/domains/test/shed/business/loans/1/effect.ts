import { z } from 'zod'
import { date_time, day_of } from '../../../../../src/library/index.ts'
import { earlier, delegate, next, id, tools } from './_scope_effect.ts'

// The effects of `loans` 1.x, a past major (A, 16 Nov 2026 (7)): a wait or a
// reminder queued before 4 November 2026 carries the due date as an instant.
// Every effect of 1.x is here: those whose shape changed, at the last minor
// of 1.x, with their step to the next major; every other delegated to it.

/** The eve's wait of a loan due at an instant; since 2.0.0 due on the day of that instant. */
export const wait_until_the_eve_of_the_due_date = earlier(next.wait_until_the_eve_of_the_due_date)({
  payload: z.strictObject({
    loan_id: id.loan_id,
    tool_id: tools.id.tool_id,
    member_id: id.member_id,
    due_date: date_time,
  }),
  to_next: (payload) => ({
    loan_id: payload.loan_id,
    tool_id: payload.tool_id,
    member_id: payload.member_id,
    due_day: day_of(payload.due_date),
  }),
})

/** The reminder of a loan due at an instant; since 2.0.0 due on the day of that instant. */
export const send_the_due_date_reminder = earlier(next.send_the_due_date_reminder)({
  payload: z.strictObject({
    loan_id: id.loan_id,
    tool_id: tools.id.tool_id,
    member_id: id.member_id,
    due_date: date_time,
  }),
  to_next: (payload) => ({
    loan_id: payload.loan_id,
    tool_id: payload.tool_id,
    member_id: payload.member_id,
    due_day: day_of(payload.due_date),
  }),
})

export const wait_until_the_due_date = delegate(next.wait_until_the_due_date)

export const send_the_repair_notice = delegate(next.send_the_repair_notice)
