// generated

// The commands of `tools` under their names, each schema with its output type
// under the same name: one import gives both.

import { z } from 'zod'
import * as command from './command.ts'

/**
 * No tool of the catalogue has the requested id.
 *
 * @see {@link command.the_tool_is_new}
 */
export const the_tool_is_new = command.the_tool_is_new
export type the_tool_is_new = z.output<typeof the_tool_is_new>

/**
 * @see {@link command.add_a_tool}
 */
export const add_a_tool = command.add_a_tool

/**
 * The input of `add_a_tool`, declared inline.
 *
 * @see {@link command.add_a_tool}
 */
export const add_a_tool_input = command.add_a_tool.input
export type add_a_tool_input = z.output<typeof add_a_tool_input>

/**
 * The requested tool is in the catalogue and in service.
 *
 * @see {@link command.the_tool_can_be_retired}
 */
export const the_tool_can_be_retired = command.the_tool_can_be_retired
export type the_tool_can_be_retired = z.output<typeof the_tool_can_be_retired>

/**
 * The requested tool is in the catalogue and already retired.
 *
 * @see {@link command.the_tool_is_already_retired}
 */
export const the_tool_is_already_retired = command.the_tool_is_already_retired
export type the_tool_is_already_retired = z.output<typeof the_tool_is_already_retired>

/**
 * @see {@link command.retire_a_tool}
 */
export const retire_a_tool = command.retire_a_tool

/**
 * The input of `retire_a_tool`, declared inline.
 *
 * @see {@link command.retire_a_tool}
 */
export const retire_a_tool_input = command.retire_a_tool.input
export type retire_a_tool_input = z.output<typeof retire_a_tool_input>
