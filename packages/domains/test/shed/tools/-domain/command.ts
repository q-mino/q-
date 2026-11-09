import { z } from 'zod'
import * as wlib from '../../wlib.ts'
import { a_tool_has_been_added } from './fact.ts'
import { no_other_tool_has_this_id } from './predicate.ts'
import { category, notes, tool_id, tool_name } from './value.ts'

export const add_a_tool_input = z.strictObject({
  id: tool_id,
  name: tool_name,
  category: category,
  notes: notes.optional(),
})

export const add_a_tool = wlib.command(
  add_a_tool_input,
  (commandContext) => (input) => [
    [
      { id: input.id },
      { added_tool: { ...input, status: 'inService', addDate: commandContext.now } },
    ],
  ],
  [[no_other_tool_has_this_id, a_tool_has_been_added]],
)
