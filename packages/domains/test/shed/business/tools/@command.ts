import { z } from 'zod'
import * as wlib from '../../wlib.ts'
import {
  a_tool_has_been_added,
  a_tool_has_been_retired,
  the_tool_was_already_retired,
} from './_fact.ts'
import { a_tool_has_this_id, the_tool_is_in_service, the_tool_is_retired } from './_predicate.ts'
import { tool_id } from './_id.ts'
import { category, notes, retire_reason, tool_name } from './_value.ts'

/** No tool of the catalogue has the requested id. */
export const the_tool_is_new = wlib.NOT(a_tool_has_this_id)

export const add_a_tool = wlib.command({
  input: z.strictObject({
    id: tool_id,
    name: tool_name,
    category: category,
    notes: notes.optional(),
  }),
  outcomes: {
    the_tool_is_new_so_it_is_added: [the_tool_is_new, a_tool_has_been_added],
  },
  creator: (commandContext) => (input) => ({
    the_tool_is_new_so_it_is_added: [
      { tool_id: input.id },
      { added_tool: { ...input, status: 'inService', addDate: commandContext.now } },
    ],
  }),
})

/** The requested tool is in the catalogue and in service. */
export const the_tool_can_be_retired = wlib.AND({
  a_tool_has_the_requested_id: a_tool_has_this_id,
  the_requested_tool_is_in_service: the_tool_is_in_service,
})

/** The requested tool is in the catalogue and already retired. */
export const the_tool_is_already_retired = wlib.AND({
  a_tool_has_the_requested_id: a_tool_has_this_id,
  the_requested_tool_is_retired: the_tool_is_retired,
})

export const retire_a_tool = wlib.command({
  input: z.strictObject({
    id: tool_id,
    reason: retire_reason,
    notes: notes.optional(),
  }),
  outcomes: {
    the_tool_is_in_service_so_it_is_retired: [the_tool_can_be_retired, a_tool_has_been_retired],
    the_tool_is_already_retired_so_nothing_changes: [
      the_tool_is_already_retired,
      the_tool_was_already_retired,
    ],
  },
  creator: (commandContext) => (input) => ({
    the_tool_is_in_service_so_it_is_retired: [
      {
        a_tool_has_the_requested_id: { tool_id: input.id },
        the_requested_tool_is_in_service: { tool_id: input.id },
      },
      {
        retired_tool: {
          id: input.id,
          status: 'retired',
          retirement: { date: commandContext.now, reason: input.reason, notes: input.notes },
        },
      },
    ],
    the_tool_is_already_retired_so_nothing_changes: [
      {
        a_tool_has_the_requested_id: { tool_id: input.id },
        the_requested_tool_is_retired: { tool_id: input.id },
      },
      { tool_id: input.id },
    ],
  }),
})
