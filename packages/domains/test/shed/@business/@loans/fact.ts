import { z } from 'zod'
import { tool_id } from '../@tools/_id.ts'
import { loan_id, member_id } from './_id.ts'
import { booked_reservation, ongoing_loan, returned_loan } from './_value.ts'
import * as wlib from '../../wlib.ts'

/** Carries the change of state (DOM-5, V9): the whole new loan. */
export const a_tool_has_been_lent = wlib.fact({
  payload: z.strictObject({
    new_loan: ongoing_loan,
  }),
})

/** Nothing to do (DOM-6): the member's ongoing loan of the tool stands. */
export const the_member_already_has_the_tool = wlib.fact({
  payload: z.strictObject({
    tool_id: tool_id,
    member_id: member_id,
  }),
})

/** Carries the change of state (DOM-5, V9): the whole new reservation. */
export const a_tool_has_been_booked = wlib.fact({
  payload: z.strictObject({
    new_reservation: booked_reservation,
  }),
})

/** Nothing to do (DOM-6): the member's reservation of the tool for the day stands. */
export const the_member_already_booked_the_tool = wlib.fact({
  payload: z.strictObject({
    tool_id: tool_id,
    day: wlib.day,
    member_id: member_id,
  }),
})

/**
 * A partial value: the loan's id and its new stage, whole. Tool, member and
 * dates stay as they were. Late or damaged are values of the return, not
 * other facts, until the business language needs them apart.
 */
export const a_tool_has_been_returned = wlib.fact({
  payload: z.strictObject({
    returned_loan: returned_loan.pick({ id: true, progress: true }),
  }),
})

/** Nothing to do (DOM-6): the first return stands. */
export const the_loan_was_already_returned = wlib.fact({
  payload: z.strictObject({
    loan_id: loan_id,
  }),
})

/** The eve of the due date came while the member had the tool: the reminder is on its way. Nothing changes in the state (D95). */
export const the_member_has_been_reminded_of_the_due_date = wlib.fact({
  payload: z.strictObject({
    loan_id: loan_id,
  }),
})

/** Nothing to do (DOM-6, D95): the eve came after the return, and no reminder goes. */
export const the_loan_was_returned_before_the_reminder = wlib.fact({
  payload: z.strictObject({
    loan_id: loan_id,
  }),
})
