// generated

// The use cases of `keeper` under their names (DOM-2), the leaves of its tree.

import { z } from 'zod'
import * as usecase from './usecase.ts'

/**
 * The keeper retires a tool: the ladder is broken.
 *
 * @see {@link usecase.retire_a_tool}
 */
export const retire_a_tool = usecase.retire_a_tool

/**
 * The input of `retire_a_tool`, declared inline.
 *
 * @see {@link usecase.retire_a_tool}
 */
export const retire_a_tool_input = usecase.retire_a_tool.input
export type retire_a_tool_input = z.output<typeof retire_a_tool_input>

/**
 * The keeper sends a tool to the workshop: the drill is broken on the shelf.
 *
 * @see {@link usecase.send_a_tool_to_repair}
 */
export const send_a_tool_to_repair = usecase.send_a_tool_to_repair

/**
 * The input of `send_a_tool_to_repair`, declared inline.
 *
 * @see {@link usecase.send_a_tool_to_repair}
 */
export const send_a_tool_to_repair_input = usecase.send_a_tool_to_repair.input
export type send_a_tool_to_repair_input = z.output<typeof send_a_tool_to_repair_input>

/**
 * The keeper puts the repaired drill back on the shelf.
 *
 * @see {@link usecase.put_a_repaired_tool_back_in_service}
 */
export const put_a_repaired_tool_back_in_service = usecase.put_a_repaired_tool_back_in_service

/**
 * The input of `put_a_repaired_tool_back_in_service`, declared inline.
 *
 * @see {@link usecase.put_a_repaired_tool_back_in_service}
 */
export const put_a_repaired_tool_back_in_service_input =
  usecase.put_a_repaired_tool_back_in_service.input
export type put_a_repaired_tool_back_in_service_input = z.output<
  typeof put_a_repaired_tool_back_in_service_input
>
