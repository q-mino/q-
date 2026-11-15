import { z } from 'zod'
import here, { tool_selection, value } from './_here_query.ts'

/** The tool is in service and in a chosen category. */
export const the_tool_is_shown_in_the_catalogue = here.AND({
  the_tool_is_in_service: tool_selection.the_tool_is_in_service,
  the_tool_is_in_a_chosen_category: tool_selection.the_tool_is_in_one_of_these_categories,
})

/**
 * The tools a visitor can see: in service, in the chosen categories (every
 * category, if none is chosen), by category and name; the id, the entry's
 * identity, closes the order.
 */
export const the_catalogue = here.query({
  input: z.strictObject({
    categories: z
      .array(value.category)
      .min(1)
      .default([...value.category.options]),
  }),
  fields: value.catalogue_entry,
  identity: 'id',
  selection: the_tool_is_shown_in_the_catalogue,
  order: { category: 'ascending', name: 'ascending' },
  creator: () => (input) => ({
    the_tool_is_in_service: {},
    the_tool_is_in_a_chosen_category: { categories: input.categories },
  }),
})
