import { z } from 'zod'
import { predicate, id } from './_scope_predicate.ts'

// The predicates of the activities (USR-1).

/** An activity with this id has been asked. */
export const an_activity_has_this_id = predicate({
  parameters: z.strictObject({
    activity_id: id.activity_id,
  }),
})

/** The activity with this id is in progress: asked, not ended. */
export const the_activity_is_in_progress = predicate({
  parameters: z.strictObject({
    activity_id: id.activity_id,
  }),
})
