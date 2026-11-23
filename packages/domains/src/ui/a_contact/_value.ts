// generated

// The values of `ui/a_contact` from `value.ts` (DOM-25): the same objects under
// the same names, each schema with its output type under the same name, so that
// one import gives both. Only this module imports `value.ts`.

import { z } from 'zod'
import * as value from './value.ts'

/**
 * What an activity of the screen is for.
 *
 * @see {@link value.what_it_is_for}
 */
export const what_it_is_for = value.what_it_is_for
export type what_it_is_for = z.output<typeof what_it_is_for>

/**
 * An activity the screen asked, what for, and whether it ended.
 *
 * @see {@link value.an_activity_asked}
 */
export const an_activity_asked = value.an_activity_asked
export type an_activity_asked = z.output<typeof an_activity_asked>

/**
 * The screen's state: the bond, the name as she retypes it, the removal to confirm, what it asked.
 *
 * @see {@link value.the_state}
 */
export const the_state = value.the_state
export type the_state = z.output<typeof the_state>

/**
 * What happens on the screen.
 *
 * @see {@link value.what_happens}
 */
export const what_happens = value.what_happens
export type what_happens = z.output<typeof what_happens>

/**
 * A turn of the screen.
 *
 * @see {@link value.a_turn}
 */
export const a_turn = value.a_turn
export type a_turn = z.output<typeof a_turn>

/**
 * What the screen is given: the card (none once removed), the extensions,
 * those offered to the bond, the activities it asked, and what came back of
 * the last question about the extensions in common.
 *
 * @see {@link value.what_it_is_given}
 */
export const what_it_is_given = value.what_it_is_given
export type what_it_is_given = z.output<typeof what_it_is_given>

/**
 * What came back of the question, beside it (UI-5: a request's return is
 * shown where its gesture is): none asked; waiting; the extensions in common,
 * by name; none in common; no answer, with why.
 *
 * @see {@link value.the_answer_shown}
 */
export const the_answer_shown = value.the_answer_shown
export type the_answer_shown = z.output<typeof the_answer_shown>

/**
 * An extension on the contact: active, offered to it or not, and the gesture it allows.
 *
 * @see {@link value.an_extension_on_the_contact}
 */
export const an_extension_on_the_contact = value.an_extension_on_the_contact
export type an_extension_on_the_contact = z.output<typeof an_extension_on_the_contact>

/**
 * What the screen shows: no such contact (removed), or the contact.
 *
 * @see {@link value.what_it_shows}
 */
export const what_it_shows = value.what_it_shows
export type what_it_shows = z.output<typeof what_it_shows>
