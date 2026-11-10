import { z } from 'zod'
import * as tools from '../../tools/index.ts'
import { member_id, ongoing_loan } from './value.ts'

/** Carries the change of state (DOM-5, V9): the whole new loan. */
export const a_tool_has_been_lent = z.strictObject({
  new_loan: ongoing_loan,
})

/** Nothing to do (DOM-6): the member's ongoing loan of the tool stands. */
export const the_member_already_has_the_tool = z.strictObject({
  tool_id: tools.value.tool_id,
  member_id: member_id,
})
