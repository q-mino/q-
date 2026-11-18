// generated

// The commands of `an_ongoing_loan` under their names (DOM-25), with the
// inputs declared inline, `<command>_input`.

import { z } from 'zod'
import * as command from './command.ts'

/**
 * The member may keep the tool longer.
 *
 * @see {@link command.the_loan_can_be_extended}
 */
export const the_loan_can_be_extended = command.the_loan_can_be_extended
export type the_loan_can_be_extended = z.output<typeof the_loan_can_be_extended>

/**
 * The member keeps the tool one loan period more (SC-31).
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
 * The card of the loan says what the keeper read on it.
 *
 * @see {@link command.the_tool_of_the_loan_can_be_corrected}
 */
export const the_tool_of_the_loan_can_be_corrected = command.the_tool_of_the_loan_can_be_corrected
export type the_tool_of_the_loan_can_be_corrected = z.output<
  typeof the_tool_of_the_loan_can_be_corrected
>

/**
 * The keeper corrects the tool on a loan's card (SC-13).
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
