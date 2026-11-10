import { z } from 'zod'
import * as tools from '../../tools/index.ts'
import { loan_id, member_id } from './value.ts'

// The vocabulary of the conditions of `loans`. The predicates of `tools`
// come from its surface (GR-3) and are not repeated here.

export const a_loan_has_this_id = z.strictObject({
  loan_id: loan_id,
})

/** The tool is with a member, whoever it is. */
export const the_tool_is_on_loan = z.strictObject({
  tool_id: tools.value.tool_id,
})

/** The tool is with this member. */
export const the_tool_is_on_loan_to_this_member = z.strictObject({
  tool_id: tools.value.tool_id,
  member_id: member_id,
})
