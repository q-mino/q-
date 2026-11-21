// generated

// The values of `ui/what_happened` from `value.ts` (DOM-25): the same objects
// under the same names, each schema with its output type under the same name,
// so that one import gives both. Only this module imports `value.ts`.

import { z } from 'zod'
import * as value from './value.ts'

/**
 * An activity the screen asked of a letter, and whether it ended.
 *
 * @see {@link value.an_activity_asked}
 */
export const an_activity_asked = value.an_activity_asked
export type an_activity_asked = z.output<typeof an_activity_asked>

/**
 * The screen's state: what it asked.
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
 * What the screen is given: the activities in progress, the letters held, what happened, the activities it asked.
 *
 * @see {@link value.what_it_is_given}
 */
export const what_it_is_given = value.what_it_is_given
export type what_it_is_given = z.output<typeof what_it_is_given>

/**
 * A held letter, with the course of what she asked of it.
 *
 * @see {@link value.a_letter_shown}
 */
export const a_letter_shown = value.a_letter_shown
export type a_letter_shown = z.output<typeof a_letter_shown>

/**
 * What the screen shows: nothing; or what is in progress, the kernel's, and each extension's in its mark.
 *
 * @see {@link value.what_it_shows}
 */
export const what_it_shows = value.what_it_shows
export type what_it_shows = z.output<typeof what_it_shows>
