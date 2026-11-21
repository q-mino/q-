import { z } from 'zod'
import { _ui, activities, user } from './_scope_value.ts'

// The handshake in person, the crossed QR (UI-5; 5 of the notes on screens,
// revised for the PWA): opened, the screen prepares a ticket of hers for the
// bond to be (BND-7); ready, it shows its QR and scans theirs; the first
// ticket scanned is opened with the name it introduces itself with, which she
// may change on the contact. Each phone knows only what it scanned: the other
// side's confirmation comes with its first letter ("does she have you?").

/** What the screen asked, and whether it ended. */
export const an_activity_asked = z.strictObject({
  asked: _ui.value.what_it_asked,
  ended: z.boolean(),
})

/** What she scanned: a ticket, opened; or a text that holds none, or one out of its form. */
export const what_she_scanned = z.discriminatedUnion('scanned', [
  z.strictObject({
    scanned: z.literal('their_ticket'),
    ticket: activities.value.their_ticket,
    opened: an_activity_asked,
  }),
  z.strictObject({ scanned: z.literal('no_ticket') }),
  z.strictObject({ scanned: z.literal('a_ticket_out_of_its_form') }),
])

/** The screen's state: the ticket of hers it prepares, the camera as the browser says, what she scanned. */
export const the_state = z.strictObject({
  ticket: z.strictObject({ bond: user.value.a_bond, prepared: an_activity_asked }).optional(),
  camera: _ui.value.the_camera,
  scanned: what_she_scanned.optional(),
})

/** What happens on the screen. */
export const what_happens = z.discriminatedUnion('happens', [
  /** The screen is opened: a ticket of hers for a bond to be, by her active face (its ids drawn then). */
  z.strictObject({
    happens: z.literal('the_screen_is_opened'),
    asked: _ui.value.what_it_asked,
    bond: user.value.a_bond,
    face: user.value.a_face,
  }),
  /** The camera, as the browser gives it (WEB-2). */
  z.strictObject({ happens: z.literal('the_camera_is'), camera: _ui.value.the_camera }),
  /** A text the camera read, as the link of a ticket holds it (WEB-1). */
  z.strictObject({
    happens: z.literal('she_scans'),
    holds: _ui.value.what_it_holds,
    asked: _ui.value.what_it_asked,
  }),
  /** She shakes another hand: a new ticket, for another bond to be. */
  z.strictObject({
    happens: z.literal('she_shakes_another_hand'),
    asked: _ui.value.what_it_asked,
    bond: user.value.a_bond,
    face: user.value.a_face,
  }),
  /** She opens the contact she just made, to name it otherwise. */
  z.strictObject({ happens: z.literal('she_opens_the_contact') }),
  _ui.value.she_goes_back,
  _ui.value.what_it_asked_ended,
])

/** A turn of the screen. */
export const a_turn = z.strictObject({
  state: the_state,
  asks: z.array(_ui.value.what_it_asks).max(8),
  goes: _ui.value.where_it_goes,
})

/** What the screen is given: her ticket, once ready; the activities it asked. */
export const what_it_is_given = z.strictObject({
  ticket: _ui.value.a_ticket_ready.optional(),
  activities: z.array(activities.value.activity_card).max(8),
})

/**
 * What the screen shows: the ticket being got ready; one that cannot be;
 * ready, its QR and the camera, with what she scanned that holds no ticket;
 * their ticket being opened; bonded, with what her node said of it ("in
 * person" only when it said `you_met_in_person`, the QR crossed within the
 * window of a crossing; at a distance, as her node measured it, when it
 * said `you_are_bonded` or `your_introduction_is_sent`: BND-10), or Anna
 * was a contact already; their ticket that cannot be opened, her QR still shown
 * and the camera on to scan again. The camera is wanted only while she scans.
 */
export const what_it_shows = z.discriminatedUnion('shows', [
  z.strictObject({ shows: z.literal('getting_the_ticket_ready') }),
  z.strictObject({
    shows: z.literal('the_ticket_cannot_be_prepared'),
    how: activities.value.how_it_ended,
  }),
  z.strictObject({
    shows: z.literal('ready'),
    ticket: _ui.value.a_ticket_ready,
    camera: _ui.value.the_camera,
    scanned: z.enum(['nothing', 'no_ticket', 'a_ticket_out_of_its_form']),
  }),
  z.strictObject({ shows: z.literal('opening_their_ticket'), introduced_as: z.string().max(80) }),
  z.strictObject({
    shows: z.literal('bonded'),
    introduced_as: z.string().max(80),
    already: z.boolean(),
    said: user.value.what_it_said,
  }),
  z.strictObject({
    shows: z.literal('their_ticket_cannot_be_opened'),
    introduced_as: z.string().max(80),
    how: activities.value.how_it_ended,
    ticket: _ui.value.a_ticket_ready,
    camera: _ui.value.the_camera,
  }),
])
