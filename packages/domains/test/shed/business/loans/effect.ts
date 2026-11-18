import { z } from 'zod'
import * as wlib from '../../wlib.ts'
import { effect, id, tools } from './_scope_effect.ts'

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
export const wait_until_the_eve_of_the_due_date = effect({
  payload: z.strictObject({
    loan_id: id.loan_id,
    tool_id: tools.id.tool_id,
    member_id: id.member_id,
    due_day: wlib.day,
  }),
})

/** Marta reads on her phone "bring the drill back tomorrow". No return: nothing comes back to `loans`. */
export const send_the_due_date_reminder = effect({
  payload: z.strictObject({
    loan_id: id.loan_id,
    tool_id: tools.id.tool_id,
    member_id: id.member_id,
    due_day: wlib.day,
  }),
})

/**
 * Wait until the due date is over, the start of the day after. No world: the
 * executor gives the payload back to its return, `declare_the_loan_overdue`,
 * which stamps the loan overdue only if the member still has the tool
 * (D68.3): time is not a fact, so a loan becomes overdue only through a
 * command and its fact (D92.4).
 */
export const wait_until_the_due_date = effect({
  payload: z.strictObject({
    loan_id: id.loan_id,
  }),
})

/**
 * Gianni reads on their phone "the drill you booked for Thursday is in
 * repair". No return: nothing comes back to `loans`. One notice per stay in
 * repair and reservation: Paolo, booked three weeks on, is notified once for
 * each repair of the drill (the entry's id, `dsl`).
 */
export const send_the_repair_notice = effect({
  payload: z.strictObject({
    reservation_id: id.reservation_id,
    member_id: id.member_id,
    tool_id: tools.id.tool_id,
    day: wlib.day,
  }),
})

/**
 * Wait until a Monday, at the start of the shed's day. No world: the
 * executor gives the payload back to its return,
 * `sum_up_the_week_for_the_member`, which sends the week's summary and
 * queues the wait for the next Monday (SC-43): a wait whose return queues
 * the next.
 */
export const wait_until_monday = effect({
  payload: z.strictObject({
    member_id: id.member_id,
    monday: wlib.day,
  }),
})

/**
 * Marta reads on her phone "your week at the shed, from Monday 23
 * November": the phone opens her loans and her reservations, read when she
 * looks (SC-43). No return: nothing comes back to `loans`.
 */
export const send_the_weeks_summary = effect({
  payload: z.strictObject({
    member_id: id.member_id,
    monday: wlib.day,
  }),
})
