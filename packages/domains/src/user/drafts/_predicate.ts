// generated

// The predicates of `user/drafts` from `predicate.ts` (DOM-25): the same
// objects under the same names, branded with their path (DOM-24), each schema
// with its output type under the same name, so that one import gives both. Only
// this module imports `predicate.ts`.

import { z } from 'zod'
import * as predicate from './predicate.ts'

/**
 * A draft is kept for this.
 *
 * @see {@link predicate.a_draft_is_kept}
 */
export const a_draft_is_kept =
  predicate.a_draft_is_kept.brand<'user/drafts/predicate/a_draft_is_kept'>()
export type a_draft_is_kept = z.output<typeof a_draft_is_kept>

/**
 * The draft for this holds this text.
 *
 * @see {@link predicate.the_draft_holds_this_text}
 */
export const the_draft_holds_this_text =
  predicate.the_draft_holds_this_text.brand<'user/drafts/predicate/the_draft_holds_this_text'>()
export type the_draft_holds_this_text = z.output<typeof the_draft_holds_this_text>
