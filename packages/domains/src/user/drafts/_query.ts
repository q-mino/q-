// generated

// The queries of `user/drafts` from `query.ts` (DOM-25): the same objects under
// the same names, each schema with its output type under the same name, so that
// one import gives both. Only this module imports `query.ts`.

import { z } from 'zod'
import * as query from './query.ts'

/**
 * The draft for this, if one is kept.
 *
 * @see {@link query.a_draft}
 */
export const a_draft = query.a_draft

/**
 * The input of `a_draft`, declared inline.
 *
 * @see {@link query.a_draft}
 */
export const a_draft_input = query.a_draft.input
export type a_draft_input = z.output<typeof a_draft_input>
