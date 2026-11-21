// generated

// The values of `ui/the_first_face` from `value.ts` (DOM-25): the same objects
// under the same names, each schema with its output type under the same name,
// so that one import gives both. Only this module imports `value.ts`.

import { z } from 'zod'
import * as value from './value.ts'

/**
 * The screen's state: the name as she types it, and what it asked: the activity and the face it makes.
 *
 * @see {@link value.the_state}
 */
export const the_state = value.the_state
export type the_state = z.output<typeof the_state>

/**
 * What happens on the screen: she types the name, she makes the face (its ids drawn at the tap), what it asked ends.
 *
 * @see {@link value.what_happens}
 */
export const what_happens = value.what_happens
export type what_happens = z.output<typeof what_happens>

/**
 * A turn of the screen: its state after, what it asks, where it goes.
 *
 * @see {@link value.a_turn}
 */
export const a_turn = value.a_turn
export type a_turn = z.output<typeof a_turn>

/**
 * What the screen shows: the name, the button (off with no name, on, or making the face), and the course of the making.
 *
 * @see {@link value.what_it_shows}
 */
export const what_it_shows = value.what_it_shows
export type what_it_shows = z.output<typeof what_it_shows>
