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
