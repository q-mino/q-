import { z } from 'zod'
import { command, AND, NOT, fact, id, predicate, value } from './_scope_command.ts'

/** No tool of the catalogue has the requested id. */
export const the_tool_is_new = NOT(predicate.a_tool_has_this_id)

export const add_a_tool = command({
  input: z.strictObject({
    id: id.tool_id,
    name: value.tool_name,
    category: value.category,
    notes: value.notes.optional(),
  }),
  outcomes: {
    the_tool_is_new_so_it_is_added: [the_tool_is_new, fact.a_tool_has_been_added],
  },
  creator: (context) => (input) => ({
    the_tool_is_new_so_it_is_added: [
      { tool_id: input.id },
      { added_tool: { ...input, status: 'inService', addDate: context.now } },
    ],
  }),
})

/** The requested tool is in the catalogue and in service. */
export const the_tool_can_be_retired = AND({
  a_tool_has_the_requested_id: predicate.a_tool_has_this_id,
  the_requested_tool_is_in_service: predicate.the_tool_is_in_service,
})

/** The requested tool is in the catalogue and already retired. */
export const the_tool_is_already_retired = AND({
  a_tool_has_the_requested_id: predicate.a_tool_has_this_id,
  the_requested_tool_is_retired: predicate.the_tool_is_retired,
})

export const retire_a_tool = command({
  input: z.strictObject({
    id: id.tool_id,
    reason: value.retire_reason,
    notes: value.notes.optional(),
  }),
  outcomes: {
    the_tool_is_in_service_so_it_is_retired: [
      the_tool_can_be_retired,
      fact.a_tool_has_been_retired,
    ],
    the_tool_is_already_retired_so_nothing_changes: [
      the_tool_is_already_retired,
      fact.the_tool_was_already_retired,
    ],
  },
  creator: (context) => (input) => ({
    the_tool_is_in_service_so_it_is_retired: [
      {
        a_tool_has_the_requested_id: { tool_id: input.id },
        the_requested_tool_is_in_service: { tool_id: input.id },
      },
      {
        retired_tool: {
          id: input.id,
          status: 'retired',
          retirement: { date: context.now, reason: input.reason, notes: input.notes },
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
