import { z } from 'zod'
import * as wlib from '../../wlib.ts'
import * as loans from '../../@business/@loans/_index.ts'
import * as tools from '../../@business/@tools/_index.ts'
import { the_card_is_valid_on } from './_dsl.ts'
import { here } from './_here.ts'
import { tool_name } from './_value.ts'

// The use cases of `member`, the leaves of its tree (PER-6): who borrows from
// the shed. The member is the number of the card the node found
// (`context.card`), given to the business as its input (D33), never from the
// client (PER-8); the outcome and the entries are projected in the member's
// words (D45). A node that closes the request answers for them
// (`not_found`), with no event of theirs; a leaf's own limit closes it with
// `refused`.

/** Marta takes the drill home, while her card is valid. */
export const borrow_a_tool = here.command_use_case_over({
  use_case: loans.borrow_a_tool,
  input: z.strictObject({ loan_id: loans.loan_id, tool_id: tools.tool_id }),
  is_refused_unless: {
    /** Card M-12 is valid until 31 March 2027: on 1 April Marta borrows no more. */
    the_member_card_is_valid_today: (context) => () =>
      the_card_is_valid_on(context.now)(context.card),
  },
  creator: (context) => (input) => ({
    loan_id: input.loan_id,
    tool_id: input.tool_id,
    member_id: context.card.id,
  }),
  events: {
    you_have_the_tool: z.strictObject({
      loan_id: loans.loan_id,
      tool_id: tools.tool_id,
      due_date: wlib.date_time_string,
    }),
    you_already_have_the_tool: z.strictObject({ tool_id: tools.tool_id }),
    /**
     * Not in the shed, retired, or lent to someone else: the member need not
     * know which, and knows which tool they asked for.
     */
    the_tool_is_not_available: z.strictObject({}),
  },
  projection: {
    the_tool_is_available_so_it_is_lent: (fact) => ({
      event: 'you_have_the_tool',
      payload: {
        loan_id: fact.new_loan.id,
        tool_id: fact.new_loan.tool_id,
        due_date: fact.new_loan.due_date,
      },
    }),
    the_member_already_has_the_tool_so_nothing_changes: (fact) => ({
      event: 'you_already_have_the_tool',
      payload: { tool_id: fact.tool_id },
    }),
    rejected: () => ({ event: 'the_tool_is_not_available', payload: {} }),
  },
})

/**
 * Marta opens "my loans": the tools she has at home and when each is due,
 * then follows them live; a loan appears, a return takes it away. Her card
 * may have expired: she still sees what she must bring back.
 */
export const my_loans = here.read_use_case_over({
  use_case: loans.the_ongoing_loans_of_a_member,
  input: z.strictObject({}),
  creator: (context) => () => ({ member_id: context.card.id }),
  entry: z.strictObject({
    loan_id: loans.loan_id,
    tool_id: tools.tool_id,
    tool_name: tool_name,
    start_date: wlib.date_time_string,
    due_date: wlib.date_time_string,
  }),
  projection: (entry) => ({
    loan_id: entry.id,
    tool_id: entry.tool_id,
    tool_name: entry.tool_name,
    start_date: entry.start_date,
    due_date: entry.due_date,
  }),
  stream: { identity: 'loan_id' },
})
