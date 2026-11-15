import { z } from 'zod'
import { selection, value } from './_here_selection.ts'

// The selections over a tool of the catalogue, the subject of this file
// (DOM-18): predicates over the tool a query looks at, which they do not name;
// their parameters are the values of the filter. Composed with AND,
// OR, NOT, as the predicates; their value is the adapters'.

export const the_tool_is_in_service = selection({
  subject: 'tool',
  parameters: z.strictObject({}),
})

export const the_tool_is_in_one_of_these_categories = selection({
  subject: 'tool',
  parameters: z.strictObject({
    categories: z.array(value.category).min(1),
  }),
})
