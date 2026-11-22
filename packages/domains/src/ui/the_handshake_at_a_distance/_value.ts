// generated

// The values of `ui/the_handshake_at_a_distance` from `value.ts` (DOM-25): the
// same objects under the same names, each schema with its output type under the
// same name, so that one import gives both. Only this module imports
// `value.ts`.

import { z } from 'zod'
import * as value from './value.ts'

/**
 * The screen's state: the ticket it prepares, once she made a link, whether it ended, and whether its link was copied.
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
 * How the phone shares a link (WEB-18), as the browser gives it: with its own share, or only by copying it.
 *
 * @see {@link value.the_phone}
 */
export const the_phone = value.the_phone
export type the_phone = z.output<typeof the_phone>

/**
 * What the screen is given: her ticket, once ready; the activity it asked; how the phone shares.
 *
 * @see {@link value.what_it_is_given}
 */
export const what_it_is_given = value.what_it_is_given
export type what_it_is_given = z.output<typeof what_it_is_given>

/**
 * What the screen shows: the flaw told, and the gesture; the link being got ready; one that cannot be; the link, to share.
 *
 * @see {@link value.what_it_shows}
 */
export const what_it_shows = value.what_it_shows
export type what_it_shows = z.output<typeof what_it_shows>
