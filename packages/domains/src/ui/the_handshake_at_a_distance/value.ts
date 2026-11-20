import { z } from 'zod'
import { _ui, activities, user } from './_scope_value.ts'

// The handshake at a distance, from who invites (UI-5; 6 of the notes on
// screens): told the flaw first (whoever opens the link becomes her contact;
// it holds once, for 48 hours), she makes a link, a ticket of hers for a bond
// to be (BND-7), and shares it; the rendering draws the link and hands it to
// the phone's sharing (WEB-1).

/** The screen's state: the ticket it prepares, once she made a link, and whether it ended. */
export const the_state = z.strictObject({
  ticket: z
    .strictObject({
      bond: user.value.a_bond,
      asked: _ui.value.what_it_asked,
      ended: z.boolean(),
    })
    .optional(),
})

/** What happens on the screen. */
export const what_happens = z.discriminatedUnion('happens', [
  /** She makes a link, by her active face (its ids drawn at the tap); again, another. */
  z.strictObject({
    happens: z.literal('she_makes_a_link'),
    asked: _ui.value.what_it_asked,
    bond: user.value.a_bond,
    face: user.value.a_face,
  }),
  _ui.value.she_goes_back,
  _ui.value.what_it_asked_ended,
])

/** A turn of the screen. */
export const a_turn = z.strictObject({
  state: the_state,
  asks: z.array(_ui.value.what_it_asks).max(8),
  goes: _ui.value.where_it_goes,
})

/** What the screen is given: her ticket, once ready; the activity it asked. */
export const what_it_is_given = z.strictObject({
  ticket: _ui.value.a_ticket_ready.optional(),
  activity: activities.value.activity_card.optional(),
})

/** What the screen shows: the flaw told, and the gesture; the link being got ready; one that cannot be; the link, to share. */
export const what_it_shows = z.discriminatedUnion('shows', [
  z.strictObject({ shows: z.literal('the_flaw_told') }),
  z.strictObject({ shows: z.literal('getting_the_link_ready') }),
  z.strictObject({
    shows: z.literal('the_link_cannot_be_prepared'),
    how: activities.value.how_it_ended,
  }),
  z.strictObject({ shows: z.literal('the_link'), ticket: _ui.value.a_ticket_ready }),
])
