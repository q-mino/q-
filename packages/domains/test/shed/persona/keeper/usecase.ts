import { z } from 'zod'
import * as wlib from '../../wlib.ts'
import { command_use_case_over, value, tools } from './_scope_usecase.ts'

// The use cases of `keeper`, the leaves of its tree (PER-6): who keeps the
// shed. Each invokes a use case of a business domain and speaks to the keeper
// in the keeper's words: its own input and events, the business's outcome
// projected (D45).

/** The keeper retires a tool: the ladder is broken. */
export const retire_a_tool = command_use_case_over({
  use_case: tools.usecase.retire_a_tool,
  input: z.strictObject({
    tool_id: tools.id.tool_id,
    reason: value.retirement_reason,
    notes: value.notes.optional(),
  }),
  creator: () => (input) => ({ id: input.tool_id, reason: input.reason, notes: input.notes }),
  events: {
    the_tool_is_retired: z.strictObject({ tool_id: tools.id.tool_id, date: wlib.date_time_string }),
    the_tool_was_already_retired: z.strictObject({ tool_id: tools.id.tool_id }),
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
