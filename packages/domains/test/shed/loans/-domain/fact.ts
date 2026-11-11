import { z } from 'zod'
import { tool_id } from '../../tools/-domain/$id.ts'
import { day } from '../../wlib.ts'
import { loan_id, member_id } from './$id.ts'
import { booked_reservation, ongoing_loan, returned_loan } from './value.ts'

/** Carries the change of state (DOM-5, V9): the whole new loan. */
export const a_tool_has_been_lent = z.strictObject({
  new_loan: ongoing_loan,
})

/** Nothing to do (DOM-6): the member's ongoing loan of the tool stands. */
export const the_member_already_has_the_tool = z.strictObject({
  tool_id: tool_id,
  member_id: member_id,
})

/** Carries the change of state (DOM-5, V9): the whole new reservation. */
export const a_tool_has_been_booked = z.strictObject({
  new_reservation: booked_reservation,
})

/** Nothing to do (DOM-6): the member's reservation of the tool for the day stands. */
export const the_member_already_booked_the_tool = z.strictObject({
  tool_id: tool_id,
  day: day,
  member_id: member_id,
})

/**
 * A partial value: the loan's id and its new stage, whole. Tool, member and
 * dates stay as they were. Late or damaged are values of the return, not
 * other facts, until the business language needs them apart.
 */
export const a_tool_has_been_returned = z.strictObject({
  returned_loan: returned_loan.pick({ id: true, progress: true }),
})

/** Nothing to do (DOM-6): the first return stands. */
export const the_loan_was_already_returned = z.strictObject({
  loan_id: loan_id,
})
