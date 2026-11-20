import { z } from 'zod'
import { selection, id } from './_scope_selection.ts'

// The selection predicates of the activities (DOM-18).

/** The activity has this id. */
export const the_activity_has_this_id = selection({
  subject: 'activity',
  parameters: z.strictObject({
    activity_id: id.activity_id,
  }),
})

/** The activity is in progress. */
export const the_activity_is_in_progress = selection({
  subject: 'activity',
  parameters: z.strictObject({}),
})
