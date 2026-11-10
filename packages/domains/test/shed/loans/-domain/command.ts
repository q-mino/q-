import { z } from 'zod'
import * as wlib from '../../wlib.ts'
import * as tools from '../../tools/index.ts'
import { a_tool_has_been_lent, the_member_already_has_the_tool } from './$fact.ts'
import {
  a_loan_has_this_id,
  the_tool_is_on_loan,
  the_tool_is_on_loan_to_this_member,
} from './$predicate.ts'
import { the_due_date_of_a_loan_started_on } from './dsl.ts'
import { loan_id, member_id } from './value.ts'

export const borrow_a_tool_input = z.strictObject({
  loan_id: loan_id,
  tool_id: tools.value.tool_id,
  member_id: member_id,
})

/** The tool can be lent: named components, bound one by one by the creator. */
export const the_tool_can_be_lent = wlib.and({
  a_loan_has_not_the_requested_id: wlib.not(a_loan_has_this_id),
  a_tool_has_the_requested_id: tools.predicate.a_tool_has_this_id,
  the_requested_tool_is_in_service: tools.predicate.the_tool_is_in_service,
  the_requested_tool_is_not_on_loan: wlib.not(the_tool_is_on_loan),
})

export const borrow_a_tool = wlib.command(
  borrow_a_tool_input,
  (commandContext) => (input) => ({
    the_tool_is_available_so_it_is_lent: [
      {
        a_loan_has_not_the_requested_id: { loan_id: input.loan_id },
        a_tool_has_the_requested_id: { tool_id: input.tool_id },
        the_requested_tool_is_in_service: { tool_id: input.tool_id },
        the_requested_tool_is_not_on_loan: { tool_id: input.tool_id },
      },
      {
        new_loan: {
          id: input.loan_id,
          tool_id: input.tool_id,
          member_id: input.member_id,
          start_date: commandContext.now,
          due_date: the_due_date_of_a_loan_started_on(commandContext.now),
          progress: { stage: 'ongoing' },
        },
      },
    ],
    the_member_already_has_the_tool_so_nothing_changes: [
      { tool_id: input.tool_id, member_id: input.member_id },
      { tool_id: input.tool_id, member_id: input.member_id },
    ],
  }),
  {
    the_tool_is_available_so_it_is_lent: [the_tool_can_be_lent, a_tool_has_been_lent],
    the_member_already_has_the_tool_so_nothing_changes: [
      the_tool_is_on_loan_to_this_member,
      the_member_already_has_the_tool,
    ],
  },
)
