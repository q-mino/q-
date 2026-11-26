// generated

// The values of `ui/my_contacts` from `value.ts` (DOM-25): the same objects
// under the same names, each schema with its output type under the same name,
// so that one import gives both. Only this module imports `value.ts`.

import { z } from 'zod'
import * as value from './value.ts'

/**
 * The entries of the menu, in its order.
 *
 * @see {@link value.an_entry}
 */
export const an_entry = value.an_entry
export type an_entry = z.output<typeof an_entry>

/**
 * The screen's state: the menu open or closed.
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
 * What the screen is given: her contacts, how many letters are held, how many things happened without a fact; the extensions and the bonds each is offered to, for the rows' marks (EXT-7).
 *
 * @see {@link value.what_it_is_given}
 */
export const what_it_is_given = value.what_it_is_given
export type what_it_is_given = z.output<typeof what_it_is_given>

/**
 * A contact in the list: by her name for it, as it introduced itself when
 * that differs, whether it has her yet; the marks its row holds, each
 * extension active and offered to it with a slot on the row (MSG-15), in
 * the order of her extensions.
 *
 * @see {@link value.a_contact_in_the_list}
 */
export const a_contact_in_the_list = value.a_contact_in_the_list
export type a_contact_in_the_list = z.output<typeof a_contact_in_the_list>

/**
 * What the screen shows: no contacts yet, with the two ways to shake a hand;
 * or her contacts, by name. The menu when open; the word of what happened
 * when something did.
 *
 * @see {@link value.what_it_shows}
 */
export const what_it_shows = value.what_it_shows
export type what_it_shows = z.output<typeof what_it_shows>
