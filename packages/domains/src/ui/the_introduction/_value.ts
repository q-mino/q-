// generated

// The values of `ui/the_introduction` from `value.ts` (DOM-25): the same
// objects under the same names, each schema with its output type under the same
// name, so that one import gives both. Only this module imports `value.ts`.

import { z } from 'zod'
import * as value from './value.ts'

/**
 * A card of the introduction, in its order: what Cumino is (a contact is a hand shaken); how her letters travel (Cumino informs, it does not guarantee); the extensions (Cumino does little by itself, the rest she turns on).
 *
 * @see {@link value.a_card}
 */
export const a_card = value.a_card
export type a_card = z.output<typeof a_card>

/**
 * The screen's state: how it is read, and the card shown.
 *
 * @see {@link value.the_state}
 */
export const the_state = value.the_state
export type the_state = z.output<typeof the_state>

/**
 * What happens on the screen: she turns to the next card, to the card before, she skips it, she goes back.
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
 * What the screen shows: the card, the cards in their order (where she is
 * among them), where going on takes her (the next card; after the last, the
 * server the first time, back where she was again), whether there is a card
 * before to turn to, and whether she may skip the rest (the first time,
 * before the last card).
 *
 * @see {@link value.what_it_shows}
 */
export const what_it_shows = value.what_it_shows
export type what_it_shows = z.output<typeof what_it_shows>
