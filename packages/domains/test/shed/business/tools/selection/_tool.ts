import { z } from 'zod'
import { category } from '../value.ts'

// The selections over a tool of the catalogue, the subject of this file
// (DOM-18): predicates over the tool a query looks at, which they do not name;
// their parameters are the values of the filter. Composed with wlib.AND,
// wlib.OR, wlib.NOT, as the predicates; their value is the adapters'.

export const the_tool_is_in_service = z.strictObject({})

export const the_tool_is_in_one_of_these_categories = z.strictObject({
  categories: z.array(category).min(1),
})
