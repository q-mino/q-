import { z } from 'zod'
import { tool_id } from './value.ts'

// The vocabulary of the conditions. A predicate declares its parameters;
// its value is in dsl.ts. Predicates sharing a parameter name share its
// value when composed (wlib.and, wlib.or, wlib.not).

export const a_tool_has_this_id = z.strictObject({
  id: tool_id,
})

export const the_tool_is_in_service = z.strictObject({
  id: tool_id,
})

export const the_tool_is_retired = z.strictObject({
  id: tool_id,
})
