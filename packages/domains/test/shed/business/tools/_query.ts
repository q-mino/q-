import { z } from 'zod'
import * as wlib from '../../wlib.ts'
import * as selection from './selection/index.ts'
import { catalogue_entry, category } from './value.ts'

/** The tool is in service and in a chosen category. */
export const the_tool_is_shown_in_the_catalogue = wlib.AND({
  the_tool_is_in_service: selection.tool.the_tool_is_in_service,
  the_tool_is_in_a_chosen_category: selection.tool.the_tool_is_in_one_of_these_categories,
})

/**
 * The tools a visitor can see: in service, in the chosen categories (every
 * category, if none is chosen), by category and name; the id, the entry's
 * identity, closes the order.
 */
export const the_catalogue = wlib.query({
  input: z.strictObject({
    categories: z
      .array(category)
      .min(1)
      .default([...category.options]),
  }),
  fields: catalogue_entry,
  identity: 'id',
  selection: the_tool_is_shown_in_the_catalogue,
  order: { category: 'ascending', name: 'ascending' },
  creator: () => (input) => ({
    the_tool_is_in_service: {},
    the_tool_is_in_a_chosen_category: { categories: input.categories },
  }),
})
