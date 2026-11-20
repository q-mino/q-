import { z } from 'zod'
import { query, choice_selection, id, value } from './_scope_query.ts'

// The reads of the choices (USR-6).

/** The active face, if she has chosen one: none before her first face. */
export const the_active_face = query({
  input: z.strictObject({}),
  fields: value.the_active_face,
  identity: 'choice',
  selection: choice_selection.the_choice_is_this_one,
  order: { choice: 'ascending' },
  creator: () => () => ({
    selection: { choice: id.choice.parse('the_active_face') },
  }),
})
