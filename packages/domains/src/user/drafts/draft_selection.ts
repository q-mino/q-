import { z } from 'zod'
import { selection, id } from './_scope_selection.ts'

// The selection predicates of the drafts (DOM-18).

/** The draft has this id. */
export const the_draft_has_this_id = selection({
  subject: 'draft',
  parameters: z.strictObject({
    draft_id: id.draft_id,
  }),
})
