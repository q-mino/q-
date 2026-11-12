import { z } from 'zod'
import * as wlib from '../../wlib.ts'
import * as tools from '../../business/tools/_index.ts'
import { notes, retirement_reason } from './_value.ts'

// The use cases of `keeper`, the leaves of its tree (PER-6): who keeps the
// shed. Each invokes a use case of a business domain and speaks to the keeper
// in the keeper's words: its own input and events, the business's outcome
// projected (D45).

/** The keeper retires a tool: the ladder is broken. */
export const retire_a_tool = wlib.command_use_case_over({
  use_case: tools.retire_a_tool,
  input: z.strictObject({
    tool_id: tools.tool_id,
    reason: retirement_reason,
    notes: notes.optional(),
  }),
  creator: () => (input) => ({ id: input.tool_id, reason: input.reason, notes: input.notes }),
  events: {
    the_tool_is_retired: z.strictObject({ tool_id: tools.tool_id, date: wlib.date_time_string }),
    the_tool_was_already_retired: z.strictObject({ tool_id: tools.tool_id }),
    /** The keeper knows which tool they asked for: no need to say it back. */
    there_is_no_such_tool: z.strictObject({}),
  },
  projection: {
    the_tool_is_in_service_so_it_is_retired: (fact) => ({
      event: 'the_tool_is_retired',
      payload: { tool_id: fact.retired_tool.id, date: fact.retired_tool.retirement.date },
    }),
    the_tool_is_already_retired_so_nothing_changes: (fact) => ({
      event: 'the_tool_was_already_retired',
      payload: { tool_id: fact.tool_id },
    }),
    rejected: () => ({ event: 'there_is_no_such_tool', payload: {} }),
  },
})
