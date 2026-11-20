// generated

// The values of `ui/the_handshake_in_person` from `value.ts` (DOM-25): the same
// objects under the same names, each schema with its output type under the same
// name, so that one import gives both. Only this module imports `value.ts`.

import { z } from 'zod'
import * as value from './value.ts'

/**
 * What the screen asked, and whether it ended.
 *
 * @see {@link value.an_activity_asked}
 */
export const an_activity_asked = value.an_activity_asked
export type an_activity_asked = z.output<typeof an_activity_asked>

/**
 * What she scanned: a ticket, opened; or a text that holds none, or one out of its form.
 *
 * @see {@link value.what_she_scanned}
 */
export const what_she_scanned = value.what_she_scanned
export type what_she_scanned = z.output<typeof what_she_scanned>

/**
 * The screen's state: the ticket of hers it prepares, the camera as the browser says, what she scanned.
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
 * What the screen is given: her ticket, once ready; the activities it asked.
 *
 * @see {@link value.what_it_is_given}
 */
export const what_it_is_given = value.what_it_is_given
export type what_it_is_given = z.output<typeof what_it_is_given>

/**
 * What the screen shows: the ticket being got ready; one that cannot be;
 * ready, its QR and the camera, with what she scanned that holds no ticket;
 * their ticket being opened; bonded ("Hai Anna, di persona", or Anna was a
 * contact already); their ticket that cannot be opened, her QR still shown
 * and the camera on to scan again. The camera is wanted only while she scans.
 *
 * @see {@link value.what_it_shows}
 */
export const what_it_shows = value.what_it_shows
export type what_it_shows = z.output<typeof what_it_shows>
