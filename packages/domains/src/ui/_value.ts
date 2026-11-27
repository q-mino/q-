// generated

// The values of `ui` from `value.ts` (DOM-25): the same objects under the same
// names, each schema with its output type under the same name, so that one
// import gives both. Only this module imports `value.ts`.

import { z } from 'zod'
import * as value from './value.ts'

/**
 * A place of the kernel's screens for an extension point (EXT-16, UI-4), with
 * the data it tells: a bond's screen, with the bond; the row of a bond in her
 * contacts, with the bond (MSG-15, K-13: slots only, compact; [Q, C, high
 * impact: A to discuss], part M4 of messaging); the extension's own.
 *
 * @see {@link value.a_place}
 */
export const a_place = value.a_place
export type a_place = z.output<typeof a_place>

/**
 * What a draft of the screens is for: the texts of stage 1 she types (USR-5).
 *
 * @see {@link value.a_draft_for}
 */
export const a_draft_for = value.a_draft_for
export type a_draft_for = z.output<typeof a_draft_for>

/**
 * What a link or a QR she scanned holds (WEB-1), as the rendering reads it: a ticket, no ticket, or a ticket out of its form.
 *
 * @see {@link value.what_it_holds}
 */
export const what_it_holds = value.what_it_holds
export type what_it_holds = z.output<typeof what_it_holds>

/**
 * How the introduction is read (UI-6): the first time, after her first face,
 * on to the server; or again, from the menu, back where she was.
 *
 * @see {@link value.how_the_introduction_is_read}
 */
export const how_the_introduction_is_read = value.how_the_introduction_is_read
export type how_the_introduction_is_read = z.output<typeof how_the_introduction_is_read>

/**
 * A screen of stage 1, with what it is about (UI-1).
 *
 * @see {@link value.a_screen}
 */
export const a_screen = value.a_screen
export type a_screen = z.output<typeof a_screen>

/**
 * The screens she opened, the last the one shown; back goes to the one before (UI-1).
 *
 * @see {@link value.the_way}
 */
export const the_way = value.the_way
export type the_way = z.output<typeof the_way>

/**
 * Where a gesture takes her (UI-1): she stays, a screen opens on top, she goes back, or the way starts again from what her node holds.
 *
 * @see {@link value.where_it_goes}
 */
export const where_it_goes = value.where_it_goes
export type where_it_goes = z.output<typeof where_it_goes>

/**
 * What a gesture asks of her node (UI-3), a value of `user`'s: an activity,
 * its id drawn by the rendering at the gesture (DOM-12, WEB-5); a draft kept
 * or dropped; the face she acts as. The rendering hands each to the use case
 * of `user` of its name; `ui` invokes nothing (ADP-7).
 *
 * @see {@link value.what_it_asks}
 */
export const what_it_asks = value.what_it_asks
export type what_it_asks = z.output<typeof what_it_asks>

/**
 * What a screen asked, as it keeps it: its activity's id, drawn at the gesture, and when (UI-3).
 *
 * @see {@link value.what_it_asked}
 */
export const what_it_asked = value.what_it_asked
export type what_it_asked = z.output<typeof what_it_asked>

/**
 * The course of what a screen asked (UI-3): nothing yet; in progress; ended,
 * how in her words (USR-3). A screen keeps the id of its activity, and is
 * given the activity as `user` reads it.
 *
 * @see {@link value.a_course}
 */
export const a_course = value.a_course
export type a_course = z.output<typeof a_course>

/**
 * The kernel's mark of an extension on a screen (EXT-16, UI-4): its name and a
 * border, and what it holds there: its actions, data the kernel draws; its
 * slots, parts placed in it; its pages, each opened as a screen; on its own
 * screen, its letters held and what happened to it without a fact (USR-8).
 *
 * @see {@link value.a_mark}
 */
export const a_mark = value.a_mark
export type a_mark = z.output<typeof a_mark>

/**
 * The camera of the crossed QR, as the browser gives it (WEB-2): off, on, refused, missing, busy.
 *
 * @see {@link value.the_camera}
 */
export const the_camera = value.the_camera
export type the_camera = z.output<typeof the_camera>

/**
 * A face of hers, as the screens show it (`my_faces`).
 *
 * @see {@link value.a_face_seen}
 */
export const a_face_seen = value.a_face_seen
export type a_face_seen = z.output<typeof a_face_seen>

/**
 * How a bond's handshake went, and whether they have her yet (the annotations of `bonds`, BND-4).
 *
 * @see {@link value.the_confirmation}
 */
export const the_confirmation = value.the_confirmation
export type the_confirmation = z.output<typeof the_confirmation>

/**
 * A contact in her list (`my_bonds`): the name she gives it, as it introduced itself, whether it has her yet.
 *
 * @see {@link value.a_contact_seen}
 */
export const a_contact_seen = value.a_contact_seen
export type a_contact_seen = z.output<typeof a_contact_seen>

/**
 * A contact's card (`a_bond`): as in the list, with how they shook hands and the relays of their mailbox.
 *
 * @see {@link value.a_contact_card}
 */
export const a_contact_card = value.a_contact_card
export type a_contact_card = z.output<typeof a_contact_card>

/**
 * A ticket of hers, ready (`my_ticket`): the bond it opens, until when it holds; the rendering draws its link and its QR (WEB-1, WEB-2).
 *
 * @see {@link value.a_ticket_ready}
 */
export const a_ticket_ready = value.a_ticket_ready
export type a_ticket_ready = z.output<typeof a_ticket_ready>

/**
 * An extension, as the screens show it (`an_extension`; `user`'s view of the
 * manifest and what it asks, USR-7): active, not active, or waiting for her
 * to accept a new manifest (EXT-10); the manifest she would accept, and the
 * notice told before she does.
 *
 * @see {@link value.an_extension_seen}
 */
export const an_extension_seen = value.an_extension_seen
export type an_extension_seen = z.output<typeof an_extension_seen>

/**
 * She goes back.
 *
 * @see {@link value.she_goes_back}
 */
export const she_goes_back = value.she_goes_back
export type she_goes_back = z.output<typeof she_goes_back>

/**
 * What the screen asked ended, as `user` reads it (USR-3): the rendering tells the screen once.
 *
 * @see {@link value.what_it_asked_ended}
 */
export const what_it_asked_ended = value.what_it_asked_ended
export type what_it_asked_ended = z.output<typeof what_it_asked_ended>

/**
 * The bonds each extension is offered to (EXT-7, `the_extensions_offered_to_a_bond`), what the places of a bond are drawn from.
 *
 * @see {@link value.the_offers}
 */
export const the_offers = value.the_offers
export type the_offers = z.output<typeof the_offers>

/**
 * What came back of the last question she asked a contact about the
 * extensions in common (EXT-8, UI-5; `self`'s `the_questions_asked_of_a_bond`):
 * none asked; waiting; the extensions in common, by name (none, maybe); or no
 * answer, with why.
 *
 * @see {@link value.the_extensions_in_common}
 */
export const the_extensions_in_common = value.the_extensions_in_common
export type the_extensions_in_common = z.output<typeof the_extensions_in_common>

/**
 * The relay, as her node last met it (UI-5): it answered; it did not (the
 * relay client's `unreachable`: the request lost, or the relay unheard); or
 * it answered that it is full, her deposits refused for the room on its disk
 * (REL-3). Before her node met it, as if it answered.
 *
 * @see {@link value.the_relay_met}
 */
export const the_relay_met = value.the_relay_met
export type the_relay_met = z.output<typeof the_relay_met>

/**
 * The device's network, as her phone tells it (UI-5): no network, for sure,
 * or nothing told (a network says nothing of the relay).
 *
 * @see {@link value.the_device_s_network}
 */
export const the_device_s_network = value.the_device_s_network
export type the_device_s_network = z.output<typeof the_device_s_network>

/**
 * The strip over every screen (UI-5): none; no network, when her phone tells
 * it; else the relay that does not answer, or the relay full (her letters
 * wait, either way).
 *
 * @see {@link value.a_strip}
 */
export const a_strip = value.a_strip
export type a_strip = z.output<typeof a_strip>
