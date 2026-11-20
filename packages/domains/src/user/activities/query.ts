import { z } from 'zod'
import { query, activity_selection, id, value } from './_scope_query.ts'

// The reads of the activities (USR-1): one activity, and those in progress.

/** An activity, by its id: what she asked, when, and where it is. */
export const an_activity = query({
  input: z.strictObject({
    activity_id: id.activity_id,
  }),
  fields: value.activity_card,
  identity: 'activity_id',
  selection: activity_selection.the_activity_has_this_id,
  order: { activity_id: 'ascending' },
  creator: () => (input) => ({
    selection: { activity_id: input.activity_id },
  }),
})

/** The activities in progress, in the order she asked them. */
export const the_activities_in_progress = query({
  input: z.strictObject({}),
  fields: value.activity_card,
  identity: 'activity_id',
  selection: activity_selection.the_activity_is_in_progress,
  order: { asked_at: 'ascending' },
  creator: () => () => ({
    selection: {},
  }),
})
