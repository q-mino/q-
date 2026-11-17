import { z } from 'zod'
import * as wlib from '../../wlib.ts'
import { command_use_case_over, read_use_case_over, value, tools, loans } from './_scope_usecase.ts'

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
    the_tool_is_retired: z.strictObject({ tool_id: tools.id.tool_id, date: wlib.date_time }),
    the_tool_was_already_retired: z.strictObject({ tool_id: tools.id.tool_id }),
    /** The keeper knows which tool they asked for: no need to say it back. */
    there_is_no_such_tool: z.strictObject({}),
  },
  projection: {
    the_tool_is_in_service_so_it_is_retired: (fact) => ({
      event: 'the_tool_is_retired',
      payload: { tool_id: fact.retired_tool.id, date: fact.retired_tool.retirement.date },
    }),
    the_tool_is_beyond_repair_so_it_is_retired: (fact) => ({
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

/** The keeper sends a tool to the workshop: the drill is broken on the shelf. */
export const send_a_tool_to_repair = command_use_case_over({
  use_case: tools.usecase.send_a_tool_to_repair,
  input: z.strictObject({
    tool_id: tools.id.tool_id,
  }),
  creator: () => (input) => ({ tool_id: input.tool_id }),
  events: {
    the_tool_is_in_the_workshop: z.strictObject({
      tool_id: tools.id.tool_id,
      since: wlib.date_time,
    }),
    the_tool_was_already_in_the_workshop: z.strictObject({ tool_id: tools.id.tool_id }),
    the_tool_is_retired: z.strictObject({ tool_id: tools.id.tool_id }),
    there_is_no_such_tool: z.strictObject({}),
  },
  projection: {
    the_tool_is_in_service_so_it_goes_to_repair: (fact) => ({
      event: 'the_tool_is_in_the_workshop',
      payload: { tool_id: fact.tool_under_repair.id, since: fact.tool_under_repair.repair.since },
    }),
    the_tool_is_already_in_the_workshop_so_nothing_changes: (fact) => ({
      event: 'the_tool_was_already_in_the_workshop',
      payload: { tool_id: fact.tool_id },
    }),
    the_tool_is_retired_so_nothing_changes: (fact) => ({
      event: 'the_tool_is_retired',
      payload: { tool_id: fact.tool_id },
    }),
    rejected: () => ({ event: 'there_is_no_such_tool', payload: {} }),
  },
})

/** The keeper puts the repaired drill back on the shelf. */
export const put_a_repaired_tool_back_in_service = command_use_case_over({
  use_case: tools.usecase.put_a_repaired_tool_back_in_service,
  input: z.strictObject({
    tool_id: tools.id.tool_id,
  }),
  creator: () => (input) => ({ tool_id: input.tool_id }),
  events: {
    the_tool_is_back_in_service: z.strictObject({ tool_id: tools.id.tool_id }),
    /** No such tool, or not in the workshop: the keeper knows which tool they asked for. */
    the_tool_is_not_in_the_workshop: z.strictObject({}),
  },
  projection: {
    the_tool_is_in_the_workshop_so_it_is_back_in_service: (fact) => ({
      event: 'the_tool_is_back_in_service',
      payload: { tool_id: fact.repaired_tool.id },
    }),
    rejected: () => ({ event: 'the_tool_is_not_in_the_workshop', payload: {} }),
  },
})

/**
 * Luca reads how many times each tool of the shed went out this month, the
 * idle ones at zero, once (SC-21): the snapshot alone, as the visitor's
 * catalogue.
 */
export const the_loans_of_the_month = read_use_case_over({
  use_case: loans.usecase.the_loans_of_each_tool_this_month,
  input: z.strictObject({}),
  creator: () => () => ({ query: {} }),
  entry: z.strictObject({
    tool_id: tools.id.tool_id,
    name: value.tool_name,
    loans: value.number_of_loans,
  }),
  projection: (entry) => ({ tool_id: entry.tool_id, name: entry.tool_name, loans: entry.loans }),
})
