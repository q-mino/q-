// generated

// The effects of `loans` 1.x (DOM-24, A, 16 Nov 2026 (7)): the shapes that
// changed, branded with their path and major, so that no reader takes one for
// the current; the others as delegated. Only this module imports `effect.ts`.

import { z } from 'zod'
import * as effect from './effect.ts'

/** @see {@link effect.wait_until_the_eve_of_the_due_date} */
export const wait_until_the_eve_of_the_due_date =
  effect.wait_until_the_eve_of_the_due_date.brand<'business/loans/effect/wait_until_the_eve_of_the_due_date@1'>()
export type wait_until_the_eve_of_the_due_date = z.output<typeof wait_until_the_eve_of_the_due_date>

/** @see {@link effect.send_the_due_date_reminder} */
export const send_the_due_date_reminder =
  effect.send_the_due_date_reminder.brand<'business/loans/effect/send_the_due_date_reminder@1'>()
export type send_the_due_date_reminder = z.output<typeof send_the_due_date_reminder>

/** @see {@link effect.wait_until_the_due_date} */
export const wait_until_the_due_date = effect.wait_until_the_due_date

/** @see {@link effect.send_the_repair_notice} */
export const send_the_repair_notice = effect.send_the_repair_notice
