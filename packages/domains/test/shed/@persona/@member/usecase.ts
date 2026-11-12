import { z } from 'zod'
import * as wlib from '../../wlib.ts'
import * as loans from '../../@business/@loans/_index.ts'
import * as tools from '../../@business/@tools/_index.ts'
import { here } from './_here.ts'

// The use cases of `member`, the leaves of its tree (PER-6): who borrows from
// the shed. The member is the card the node found (`context.card`), given to
// the business as its input (D33); the outcome is projected in the member's
// words (D45). A node that closes the request answers for them (`not_found`,
// `refused`), with no event of theirs.

/** Marta takes the drill home. */
export const borrow_a_tool = here.command_use_case_over({
  use_case: loans.borrow_a_tool,
  input: z.strictObject({ loan_id: loans.loan_id, tool_id: tools.tool_id }),
  creator: (context) => (input) => ({
    loan_id: input.loan_id,
    tool_id: input.tool_id,
    member_id: context.card,
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
