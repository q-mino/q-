import { z } from 'zod'
import { query, draft_selection, dsl, id, value } from './_scope_query.ts'

// The reads of the drafts (USR-5).

/** The draft for this, if one is kept. */
export const a_draft = query({
  input: z.strictObject({
    for: value.what_it_is_for,
  }),
  fields: value.a_draft,
  identity: 'draft_id',
  selection: draft_selection.the_draft_has_this_id,
  order: { draft_id: 'ascending' },
  creator: () => (input) => ({
    selection: { draft_id: id.draft_id.parse(dsl.the_draft_for(input.for)) },
  }),
})
