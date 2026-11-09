import { z } from 'zod'
import { tool } from './value.ts'

/**
 * Carries what the state needs (DOM-5, V9): the key, and every value the
 * change of state reads. Its change is in dsl.ts.
 */
export const a_tool_has_been_added = z
  .strictObject({ added_tool: tool })
  .brand<'a_tool_has_been_added'>()
