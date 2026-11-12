import { z } from 'zod'
import { tool_id } from './_id.ts'

// The vocabulary of the conditions. A predicate declares its parameters;
// its value is in dsl.ts. Composed (wlib.AND, wlib.OR) under business names,
// each component bound by the creator.

export const a_tool_has_this_id = z.strictObject({
  tool_id: tool_id,
})

export const the_tool_is_in_service = z.strictObject({
  tool_id: tool_id,
})

export const the_tool_is_retired = z.strictObject({
  tool_id: tool_id,
})
