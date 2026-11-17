// generated

// The effects of `loans`, branded with their path (DOM-24): the same objects
// as in `effect.ts`, nominal in the types. Only this module imports `effect.ts`.

import { z } from 'zod'
import * as effect from './effect.ts'

/**
 * Wait until the eve of the due date. No world: the executor gives the
 * payload back to its return, `remind_the_member_of_the_due_date`, which
 * reminds the member only if they still have the tool (D68.3): Marta brought
 * the drill back early, and no reminder reaches her.
 *
 * @see {@link effect.wait_until_the_eve_of_the_due_date}
 */
export const wait_until_the_eve_of_the_due_date =
  effect.wait_until_the_eve_of_the_due_date.brand<'business/loans/effect/wait_until_the_eve_of_the_due_date'>()
export type wait_until_the_eve_of_the_due_date = z.output<typeof wait_until_the_eve_of_the_due_date>

/**
 * Marta reads on her phone "bring the drill back tomorrow". No return: nothing comes back to `loans`.
 *
 * @see {@link effect.send_the_due_date_reminder}
 */
export const send_the_due_date_reminder =
  effect.send_the_due_date_reminder.brand<'business/loans/effect/send_the_due_date_reminder'>()
export type send_the_due_date_reminder = z.output<typeof send_the_due_date_reminder>

/**
 * Wait until the due date is over, the start of the day after. No world: the
 * executor gives the payload back to its return, `declare_the_loan_overdue`,
 * which stamps the loan overdue only if the member still has the tool
 * (D68.3): time is not a fact, so a loan becomes overdue only through a
 * command and its fact (D92.4).
 *
 * @see {@link effect.wait_until_the_due_date}
 */
export const wait_until_the_due_date =
  effect.wait_until_the_due_date.brand<'business/loans/effect/wait_until_the_due_date'>()
export type wait_until_the_due_date = z.output<typeof wait_until_the_due_date>

/**
 * Gianni reads on their phone "the drill you booked for Thursday is in
 * repair". No return: nothing comes back to `loans`. One notice per stay in
 * repair and reservation: Paolo, booked three weeks on, is notified once for
 * each repair of the drill (the entry's id, `dsl`).
 *
 * @see {@link effect.send_the_repair_notice}
 */
export const send_the_repair_notice =
  effect.send_the_repair_notice.brand<'business/loans/effect/send_the_repair_notice'>()
export type send_the_repair_notice = z.output<typeof send_the_repair_notice>
