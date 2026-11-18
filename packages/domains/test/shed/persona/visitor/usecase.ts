import { z } from 'zod'
import { read_use_case_over, value, tools } from './_scope_usecase.ts'

// The use cases of `visitor`, the leaves of its tree (PER-6): who browses the
// shed. Its entries are its own, projected field by field (D45): what it does
// not write never leaves (PER-18). No leaf streams (D24, D77): a visitor keeps
// no live view open.

/**
 * Paolo browses the shed: the tools he could borrow, by shelf, without the
 * keeper's notes, a page at a time (SC-22): 50, or as many as his phone asks,
 * up to 100. Each page says how many tools there are, and his phone asks for
 * the next when he scrolls.
 */
export const the_catalogue = read_use_case_over({
  use_case: tools.usecase.the_catalogue,
  input: z.strictObject({
    categories: value.categories.optional(),
    page_size: value.page_size.default(50),
  }),
  creator: () => (input) => ({
    query: { categories: input.categories },
    page: { size: input.page_size },
  }),
  entry: z.strictObject({
    tool_id: tools.id.tool_id,
    name: value.tool_name,
    category: value.category,
  }),
  projection: (entry) => ({ tool_id: entry.id, name: entry.name, category: entry.category }),
})
