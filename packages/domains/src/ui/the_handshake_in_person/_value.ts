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
 * The camera's side: the front, facing her, by default (the two face each
 * other, screen to screen), or the rear, facing away from her.
 *
 * @see {@link value.the_camera_s_side}
 */
export const the_camera_s_side = value.the_camera_s_side
export type the_camera_s_side = z.output<typeof the_camera_s_side>

/**
 * The device's cameras, as the browser counts them once one is on: one, or more than one, another to turn to.
 *
 * @see {@link value.the_cameras}
 */
export const the_cameras = value.the_cameras
export type the_cameras = z.output<typeof the_cameras>

/**
 * Where she may turn the camera: nowhere (one camera, or one being turned on), to the rear, to the front.
 *
 * @see {@link value.the_turn}
 */
export const the_turn = value.the_turn
export type the_turn = z.output<typeof the_turn>

/**
 * The screen's state: the ticket of hers it prepares, the camera as the browser says, its side and the device's cameras, what she scanned.
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
 * their ticket being opened; bonded, with what her node said of it ("in
 * person" only when it said `you_met_in_person`, the QR crossed within the
 * window of a crossing; at a distance, as her node measured it, when it
 * said `you_are_bonded` or `your_introduction_is_sent`: BND-10), or Anna
 * was a contact already; their ticket that cannot be opened, her QR still shown
 * and the camera on to scan again. The camera is wanted only while she scans,
 * on its side, with where she may turn it.
 *
 * @see {@link value.what_it_shows}
 */
export const what_it_shows = value.what_it_shows
export type what_it_shows = z.output<typeof what_it_shows>
