// generated

// The values of `user/drafts` from `value.ts` (DOM-25): the same objects under
// the same names, each schema with its output type under the same name, so that
// one import gives both. Only this module imports `value.ts`.

import { z } from 'zod'
import * as value from './value.ts'

/**
 * What a draft is for, an ADT: the texts the screens of stage 1 ask her to type.
 *
 * @see {@link value.what_it_is_for}
 */
export const what_it_is_for = value.what_it_is_for
export type what_it_is_for = z.output<typeof what_it_is_for>

/**
 * The text of a draft.
 *
 * @see {@link value.a_text}
 */
export const a_text = value.a_text
export type a_text = z.output<typeof a_text>

/**
 * A draft, as the screens read it.
 *
 * @see {@link value.a_draft}
 */
export const a_draft = value.a_draft
export type a_draft = z.output<typeof a_draft>
