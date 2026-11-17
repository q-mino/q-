import { z } from 'zod'
import { date_time, end_of } from '../../../wlib.ts'
import { earlier, delegate, next, value, tools, loans } from './_scope_usecase.ts'

// The leaves of `member` 1.x, a past major (PER-17, D75.6, A, 16 Nov 2026
// (7)): until 4 November 2026 a loan was due at an instant, and the clients
// of 1.x still read it so. Each leaf of 1.x is over the leaf of the next
// major, never over the business: its input goes forward, what the next leaf
// gives comes back in the words of 1.x. A loan due on a day reaches them due
// at the last instant of that day, by whose end the tool comes back: the same
// deadline, told as 1.x tells it (the member's choice for its old clients).

/** Marta's old phone borrows the drill, and reads when it is due as an instant. */
export const borrow_a_tool = earlier(next.borrow_a_tool)({
  input: z.strictObject({ loan_id: loans.id.loan_id, tool_id: tools.id.tool_id }),
  to_next: (input) => input,
  events: {
    you_have_the_tool: z.strictObject({
      loan_id: loans.id.loan_id,
      tool_id: tools.id.tool_id,
      due_date: date_time,
    }),
    you_already_have_the_tool: z.strictObject({ tool_id: tools.id.tool_id }),
    the_tool_is_not_available: z.strictObject({}),
  },
  from_next: {
    you_have_the_tool: (payload) => ({
      event: 'you_have_the_tool',
      payload: {
        loan_id: payload.loan_id,
        tool_id: payload.tool_id,
        due_date: end_of(payload.due_day),
      },
    }),
    you_already_have_the_tool: (payload) => ({ event: 'you_already_have_the_tool', payload }),
    the_tool_is_not_available: () => ({ event: 'the_tool_is_not_available', payload: {} }),
  },
})

export const return_a_tool = delegate(next.return_a_tool)

/** Marta's old phone opens "my loans": each loan due at an instant, the last of its due day. */
export const my_loans = earlier(next.my_loans)({
  input: z.strictObject({}),
  to_next: () => ({}),
  entry: z.strictObject({
    loan_id: loans.id.loan_id,
    tool_id: tools.id.tool_id,
    tool_name: value.tool_name,
    start_date: date_time,
    due_date: date_time,
    term: value.loan_term,
  }),
  from_next: (entry) => ({
    loan_id: entry.loan_id,
    tool_id: entry.tool_id,
    tool_name: entry.tool_name,
    start_date: entry.start_date,
    due_date: end_of(entry.due_day),
    term: entry.term,
  }),
  stream: {
    identity: 'loan_id',
    events: { your_loan_is_overdue: z.strictObject({}) },
    from_next: {
      your_loan_is_overdue: () => ({ event: 'your_loan_is_overdue', payload: {} }),
    },
  },
})

export const my_reservations = delegate(next.my_reservations)
