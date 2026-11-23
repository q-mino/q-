// generated

// The commands of `user/drafts` from `command.ts` (DOM-25): the same objects
// under the same names, each schema with its output type under the same name,
// so that one import gives both. Only this module imports `command.ts`.

import { z } from 'zod'
import * as command from './command.ts'

/**
 * The draft for this does not hold this text: none is kept, or another.
 *
 * @see {@link command.the_text_is_new}
 */
export const the_text_is_new = command.the_text_is_new
export type the_text_is_new = z.output<typeof the_text_is_new>

/**
 * No draft is kept for this.
 *
 * @see {@link command.no_draft_is_kept}
 */
export const no_draft_is_kept = command.no_draft_is_kept
export type no_draft_is_kept = z.output<typeof no_draft_is_kept>

/**
 * Anna starts typing "Bruno" for the bond she is opening, and the phone
 * closes the app: the draft is kept, and the screen gives it back. The same
 * text again changes nothing.
 *
 * @see {@link command.keep_a_draft}
 */
export const keep_a_draft = command.keep_a_draft

/**
 * The input of `keep_a_draft`, declared inline.
 *
 * @see {@link command.keep_a_draft}
 */
export const keep_a_draft_input = command.keep_a_draft.input
export type keep_a_draft_input = z.output<typeof keep_a_draft_input>

/**
 * The bond is opened with its name, or Anna gives it up: the draft is dropped. None kept: nothing changes.
 *
 * @see {@link command.drop_a_draft}
 */
export const drop_a_draft = command.drop_a_draft

/**
 * The input of `drop_a_draft`, declared inline.
 *
 * @see {@link command.drop_a_draft}
 */
export const drop_a_draft_input = command.drop_a_draft.input
export type drop_a_draft_input = z.output<typeof drop_a_draft_input>
