// generated

// The commands of `business/loans/an_ongoing_loan` from `command.ts` (DOM-25):
// the same objects under the same names, each schema with its output type under
// the same name, so that one import gives both. Only this module imports
// `command.ts`.

import { z } from 'zod'
import * as command from './command.ts'

/**
 * The member may keep the tool longer: the loan is theirs, of the tool they
 * hold, due on the day they read on it, that day not yet over, and no one
 * booked the tool up to the new due day, which would take a booked day from
 * someone.
 *
 * @see {@link command.the_loan_can_be_extended}
 */
export const the_loan_can_be_extended = command.the_loan_can_be_extended
export type the_loan_can_be_extended = z.output<typeof the_loan_can_be_extended>

/**
 * The member keeps the tool one loan period more (SC-31): on Friday 13
 * November Marta extends L7, the drill due on Monday 16, to the 30th. A
 * creator reads no state: her phone read the due day on the row of "my
 * loans", and the command checks it. The eve of the 16th, in flight, will
 * remind of nothing; the extension queues the eve of the 30th, under a key
 * of its own. The wait for the overdue stands: on the 17th it finds the due
 * day not over, and the desk looks again the next day.
 *
 * @see {@link command.extend_the_loan}
 */
export const extend_the_loan = command.extend_the_loan

/**
 * The input of `extend_the_loan`, declared inline.
 *
 * @see {@link command.extend_the_loan}
 */
export const extend_the_loan_input = command.extend_the_loan.input
export type extend_the_loan_input = z.output<typeof extend_the_loan_input>

/**
 * The card of the loan says what the keeper read on it: the tool
 * written, the member, the due day. The tool the member has can go out: in
 * the shed, in service, and on no loan, since the card named another.
 *
 * @see {@link command.the_tool_of_the_loan_can_be_corrected}
 */
export const the_tool_of_the_loan_can_be_corrected = command.the_tool_of_the_loan_can_be_corrected
export type the_tool_of_the_loan_can_be_corrected = z.output<
  typeof the_tool_of_the_loan_can_be_corrected
>

/**
 * The keeper corrects the tool on a loan's card (SC-13): Luca wrote the
 * drill on Marta's loan, and handed her the sander. The loan stays, with its
 * dates; its fact stays in the log as recorded, and a new fact corrects it
 * (DOM-22, D101). The eve's wait in flight names the drill, and its return
 * will remind of nothing: the correction queues the eve of the sander,
 * under a key of its own. A creator reads no state: Luca's screen read the
 * card, and the command checks what it says (the member and the due day
 * the new eve carries). Under the node since SC-31: that the loan exists
 * and is ongoing is the node's, and the loan its target. Once the loan is
 * back, a second correction is rejected, where it read "already corrected":
 * the duplicate branch still answers a retry.
 *
 * @see {@link command.correct_the_tool_of_a_loan}
 */
export const correct_the_tool_of_a_loan = command.correct_the_tool_of_a_loan

/**
 * The input of `correct_the_tool_of_a_loan`, declared inline.
 *
 * @see {@link command.correct_the_tool_of_a_loan}
 */
export const correct_the_tool_of_a_loan_input = command.correct_the_tool_of_a_loan.input
export type correct_the_tool_of_a_loan_input = z.output<typeof correct_the_tool_of_a_loan_input>
