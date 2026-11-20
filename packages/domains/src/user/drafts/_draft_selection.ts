// generated

// The selection predicates of `user/drafts` from `draft_selection.ts` (DOM-25):
// the same objects under the same names, branded with their path (DOM-24), each
// schema with its output type under the same name, so that one import gives
// both. Only this module imports `draft_selection.ts`.

import { z } from 'zod'
import * as selection from './draft_selection.ts'

/**
 * The draft has this id.
 *
 * @see {@link selection.the_draft_has_this_id}
 */
export const the_draft_has_this_id =
  selection.the_draft_has_this_id.brand<'user/drafts/selection/draft/the_draft_has_this_id'>()
export type the_draft_has_this_id = z.output<typeof the_draft_has_this_id>
