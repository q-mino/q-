import { z } from 'zod'
import { predicate, id, value } from './_scope_predicate.ts'

// The predicates of the drafts (USR-5).

/** A draft is kept for this. */
export const a_draft_is_kept = predicate({
  parameters: z.strictObject({
    draft_id: id.draft_id,
  }),
})

/** The draft for this holds this text. */
export const the_draft_holds_this_text = predicate({
  parameters: z.strictObject({
    draft_id: id.draft_id,
    text: value.a_text,
  }),
})
