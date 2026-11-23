// generated

// The selection predicates of `user/activities` from `activity_selection.ts`
// (DOM-25): the same objects under the same names, branded with their path
// (DOM-24), each schema with its output type under the same name, so that one
// import gives both. Only this module imports `activity_selection.ts`.

import { z } from 'zod'
import * as selection from './activity_selection.ts'

/**
 * The activity has this id.
 *
 * @see {@link selection.the_activity_has_this_id}
 */
export const the_activity_has_this_id =
  selection.the_activity_has_this_id.brand<'user/activities/selection/activity/the_activity_has_this_id'>()
export type the_activity_has_this_id = z.output<typeof the_activity_has_this_id>

/**
 * The activity is in progress.
 *
 * @see {@link selection.the_activity_is_in_progress}
 */
export const the_activity_is_in_progress =
  selection.the_activity_is_in_progress.brand<'user/activities/selection/activity/the_activity_is_in_progress'>()
export type the_activity_is_in_progress = z.output<typeof the_activity_is_in_progress>
