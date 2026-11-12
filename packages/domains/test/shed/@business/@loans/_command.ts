// generated

// The commands of `loans` under their names, each schema with its output type
// under the same name: one import gives both.

import { z } from 'zod'
import * as command from './command.ts'

/**
 * The tool can be lent: named components, bound one by one by the creator.
 *
 * @see {@link command.the_tool_can_be_lent}
 */
export const the_tool_can_be_lent = command.the_tool_can_be_lent
export type the_tool_can_be_lent = z.output<typeof the_tool_can_be_lent>

/**
 * @see {@link command.borrow_a_tool}
 */
export const borrow_a_tool = command.borrow_a_tool

/**
 * The input of `borrow_a_tool`, declared inline.
 *
 * @see {@link command.borrow_a_tool}
 */
export const borrow_a_tool_input = command.borrow_a_tool.input
export type borrow_a_tool_input = z.output<typeof borrow_a_tool_input>

/**
 * The tool can be booked for the day.
 *
 * @see {@link command.the_tool_can_be_booked}
 */
export const the_tool_can_be_booked = command.the_tool_can_be_booked
export type the_tool_can_be_booked = z.output<typeof the_tool_can_be_booked>

/**
 * @see {@link command.reserve_a_tool}
 */
export const reserve_a_tool = command.reserve_a_tool

/**
 * The input of `reserve_a_tool`, declared inline. The day is validated
 * against the clock: the schema needs `now`, nothing else.
 *
 * @see {@link command.reserve_a_tool}
 */
export const reserve_a_tool_input = command.reserve_a_tool.input
export type reserve_a_tool_input = z.output<ReturnType<typeof reserve_a_tool_input>>

/**
 * The requested loan exists and is ongoing.
 *
 * @see {@link command.the_loan_can_be_returned}
 */
export const the_loan_can_be_returned = command.the_loan_can_be_returned
export type the_loan_can_be_returned = z.output<typeof the_loan_can_be_returned>

/**
 * The requested loan exists and is already returned.
 *
 * @see {@link command.the_loan_is_already_returned}
 */
export const the_loan_is_already_returned = command.the_loan_is_already_returned
export type the_loan_is_already_returned = z.output<typeof the_loan_is_already_returned>

/**
 * @see {@link command.return_a_tool}
 */
export const return_a_tool = command.return_a_tool

/**
 * The input of `return_a_tool`, declared inline.
 *
 * @see {@link command.return_a_tool}
 */
export const return_a_tool_input = command.return_a_tool.input
export type return_a_tool_input = z.output<typeof return_a_tool_input>
