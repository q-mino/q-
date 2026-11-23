// generated

// The values of `user/activities` from `value.ts` (DOM-25): the same objects
// under the same names, each schema with its output type under the same name,
// so that one import gives both. Only this module imports `value.ts`.

import { z } from 'zod'
import * as value from './value.ts'

/**
 * Their ticket, as she scanned it or opened its link (BND-7, WEB-1), in her words.
 *
 * @see {@link value.their_ticket}
 */
export const their_ticket = value.their_ticket
export type their_ticket = z.output<typeof their_ticket>

/**
 * The extensions her node offers a bond, with the majors it speaks (EXT-8), as `self` reads them.
 *
 * @see {@link value.offered}
 */
export const offered = value.offered
export type offered = z.output<typeof offered>

/**
 * Where an action is drawn (EXT-16): on a bond's screen, with the bond; on the extension's own.
 *
 * @see {@link value.the_place}
 */
export const the_place = value.the_place
export type the_place = z.output<typeof the_place>

/**
 * What she asks her node (USR-2), an ADT: one case per gesture of the
 * kernel's screens, each a leaf of `self` it is carried out by, with its
 * input in her words; an action of an extension, as data (GR-7, EXT-16); and
 * the two gestures on a held letter (USR-8). A closed set the kernel's
 * screens grow with; an extension's actions are data, an open set.
 *
 * @see {@link value.what_is_asked}
 */
export const what_is_asked = value.what_is_asked
export type what_is_asked = z.output<typeof what_is_asked>

/**
 * How an activity ended (USR-3), in her words, an ADT (ADP-2, D74): the
 * meaning is the contract's, the name hers. `done`, `done_already` and
 * `cannot_be_done` are what the kernel's leaf said;
 * `the_extension_told_how_it_ended` an event of the extension's own, an
 * answer or none (a pong, `no_response`), whose meaning its texts tell
 * (EXT-16);
 * `no_longer_followed` the leaf's wait over before its end (DOM-3);
 * `the_extension_cannot_be_reached` an extension not active, or stopped
 * after its second fall (EXT-15); `the_app_cannot_do_it` a base event or a
 * closing of `self`'s node, a fault of the app, never hers.
 *
 * @see {@link value.how_it_ended}
 */
export const how_it_ended = value.how_it_ended
export type how_it_ended = z.output<typeof how_it_ended>

/**
 * An activity as she asked it: what, and when.
 *
 * @see {@link value.an_asked_activity}
 */
export const an_asked_activity = value.an_asked_activity
export type an_asked_activity = z.output<typeof an_asked_activity>

/**
 * Where an activity is (USR-1): in progress, or ended, how and when.
 *
 * @see {@link value.stage}
 */
export const stage = value.stage
export type stage = z.output<typeof stage>

/**
 * An activity, as the screens read it.
 *
 * @see {@link value.activity_card}
 */
export const activity_card = value.activity_card
export type activity_card = z.output<typeof activity_card>
