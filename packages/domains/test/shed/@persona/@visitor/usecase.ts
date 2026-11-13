import { z } from 'zod'
import * as tools from '../../@business/@tools/_index.ts'
import { here } from './_here.ts'
import { categories, category, tool_name } from './_value.ts'

// The use cases of `visitor`, the leaves of its tree (PER-6): who browses the
// shed. Its entries are its own, projected field by field (D45): what it does
// not write never leaves (PER-18). No leaf streams (D24, D77): a visitor keeps
// no live view open.

/** Luca browses the shed: the tools he could borrow, by shelf, without the keeper's notes. */
export const the_catalogue = here.read_use_case_over({
  use_case: tools.the_catalogue,
  input: z.strictObject({ categories: categories.optional() }),
  creator: () => (input) => ({ categories: input.categories }),
  entry: z.strictObject({ tool_id: tools.tool_id, name: tool_name, category: category }),
  projection: (entry) => ({ tool_id: entry.id, name: entry.name, category: entry.category }),
})
