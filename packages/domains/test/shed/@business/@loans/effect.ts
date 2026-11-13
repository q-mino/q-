import { z } from 'zod'
import { tool_id } from '../@tools/_id.ts'
import { loan_id, member_id } from './_id.ts'
import * as wlib from '../../wlib.ts'

// The effects of `loans` (DOM-13): what it asks of the world, queued by a
// branch with its fact, never run by the domain (D12). A creator does not
// read the state, so a payload carries what the effect, and its return,
// need; the delivery links what is not of `loans` (a member's phone, a
// tool's name).

/**
 * Wait until the eve of the due date. No world: the executor gives the
 * payload back to its return, `remind_the_member_of_the_due_date`, which
 * reminds the member only if they still have the tool (D68.3): Marta brought
 * the drill back early, and no reminder reaches her.
 */
export const wait_until_the_eve_of_the_due_date = wlib.effect({
  payload: z.strictObject({
    loan_id: loan_id,
    tool_id: tool_id,
    member_id: member_id,
    due_date: wlib.date_time_string,
  }),
})

/** Marta reads on her phone "bring the drill back tomorrow". No return: nothing comes back to `loans`. */
export const send_the_due_date_reminder = wlib.effect({
  payload: z.strictObject({
    loan_id: loan_id,
    tool_id: tool_id,
    member_id: member_id,
    due_date: wlib.date_time_string,
  }),
})

/**
 * Wait until the due date. No world: the executor gives the payload back to
 * its return, `declare_the_loan_overdue`, which stamps the loan overdue only
 * if the member still has the tool (D68.3): time is not a fact, so a loan
 * becomes overdue only through a command and its fact (D92.4).
 */
export const wait_until_the_due_date = wlib.effect({
  payload: z.strictObject({
    loan_id: loan_id,
  }),
})
