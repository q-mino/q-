// generated

// The effects of `business/loans/1` from `effect.ts` (DOM-25): the same objects
// under the same names, branded with their path (DOM-24), each schema with its
// output type under the same name, so that one import gives both. Only this
// module imports `effect.ts`.

import { z } from 'zod'
import * as effect from './effect.ts'

/**
 * The eve's wait of a loan due at an instant; since 2.0.0 due on its day, the one the desk wrote.
 *
 * @see {@link effect.wait_until_the_eve_of_the_due_date}
 */
export const wait_until_the_eve_of_the_due_date =
  effect.wait_until_the_eve_of_the_due_date.brand<'business/loans/effect/wait_until_the_eve_of_the_due_date@1'>()
export type wait_until_the_eve_of_the_due_date = z.output<typeof wait_until_the_eve_of_the_due_date>

/**
 * The reminder of a loan due at an instant; since 2.0.0 due on its day, the one the desk wrote.
 *
 * @see {@link effect.send_the_due_date_reminder}
 */
export const send_the_due_date_reminder =
  effect.send_the_due_date_reminder.brand<'business/loans/effect/send_the_due_date_reminder@1'>()
export type send_the_due_date_reminder = z.output<typeof send_the_due_date_reminder>

/**
 * @see {@link effect.wait_until_the_due_date}
 */
export const wait_until_the_due_date = effect.wait_until_the_due_date

/**
 * @see {@link effect.send_the_repair_notice}
 */
export const send_the_repair_notice = effect.send_the_repair_notice
