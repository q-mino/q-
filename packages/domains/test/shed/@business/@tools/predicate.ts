import { z } from 'zod'
import here, { id } from './_here_predicate.ts'

// The vocabulary of the conditions. A predicate declares its parameters;
// its value is in dsl.ts. Composed (here.AND, here.OR) under business names,
// each component bound by the creator.

export const a_tool_has_this_id = here.predicate({
  parameters: z.strictObject({
    tool_id: id.tool_id,
  }),
})

export const the_tool_is_in_service = here.predicate({
  parameters: z.strictObject({
    tool_id: id.tool_id,
  }),
})

export const the_tool_is_retired = here.predicate({
  parameters: z.strictObject({
    tool_id: id.tool_id,
  }),
})
