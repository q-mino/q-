import { z } from 'zod'
import { predicate, id } from './_scope_predicate.ts'

// The vocabulary of the conditions. A predicate declares its parameters;
// its value is in dsl.ts. Composed (AND, OR) under business names,
// each component bound by the creator.

export const a_tool_has_this_id = predicate({
  parameters: z.strictObject({
    tool_id: id.tool_id,
  }),
})

export const the_tool_is_in_service = predicate({
  parameters: z.strictObject({
    tool_id: id.tool_id,
  }),
})

export const the_tool_is_retired = predicate({
  parameters: z.strictObject({
    tool_id: id.tool_id,
  }),
})

export const the_tool_is_under_repair = predicate({
  parameters: z.strictObject({
    tool_id: id.tool_id,
  }),
})

/**
 * The tool is in the workshop for this stay in repair, not another (SC-34):
 * Rossi's system names the stay it closes, RP1, written on its job ticket.
 */
export const the_tool_is_under_this_repair = predicate({
  parameters: z.strictObject({
    tool_id: id.tool_id,
    repair_id: id.repair_id,
  }),
})
