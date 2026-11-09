import { z } from 'zod'
import * as wlib from '../../wlib.ts'
import {
  a_tool_has_been_added,
  a_tool_has_been_retired,
  the_tool_was_already_retired,
} from './$fact.ts'
import { a_tool_has_this_id, the_tool_is_in_service, the_tool_is_retired } from './$predicate.ts'
import { category, notes, retire_reason, tool_id, tool_name } from './value.ts'

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
  [[wlib.not(a_tool_has_this_id), a_tool_has_been_added]],
)

export const retire_a_tool_input = z.strictObject({
  id: tool_id,
  reason: retire_reason,
  notes: notes.optional(),
})

export const retire_a_tool = wlib.command(
  retire_a_tool_input,
  (commandContext) => (input) => [
    [
      { id: input.id },
      {
        retired_tool: {
          id: input.id,
          status: 'retired',
          retirement: { date: commandContext.now, reason: input.reason, notes: input.notes },
        },
      },
    ],
    [{ id: input.id }, { tool_id: input.id }],
  ],
  [
    [wlib.and(a_tool_has_this_id, the_tool_is_in_service), a_tool_has_been_retired],
    [wlib.and(a_tool_has_this_id, the_tool_is_retired), the_tool_was_already_retired],
  ],
)
