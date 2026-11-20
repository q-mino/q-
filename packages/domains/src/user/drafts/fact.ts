import { z } from 'zod'
import { date_time } from '../../library/index.ts'
import { fact, id, value } from './_scope_fact.ts'

// The facts of the drafts (USR-5).

/** A draft has been kept: its text, new or changed. */
export const a_draft_has_been_kept = fact({
  payload: z.strictObject({
    draft: value.a_draft,
  }),
})

/** A draft has been kept again with the text it holds: nothing changes (DOM-6). */
export const a_draft_has_been_kept_again = fact({
  payload: z.strictObject({
    draft_id: id.draft_id,
  }),
})

/** A draft has been dropped: used, or given up. */
export const a_draft_has_been_dropped = fact({
  payload: z.strictObject({
    draft_id: id.draft_id,
    at: date_time,
  }),
})

/** A draft not kept has been dropped again: nothing changes (DOM-6). */
export const a_draft_has_been_dropped_again = fact({
  payload: z.strictObject({
    draft_id: id.draft_id,
  }),
})
