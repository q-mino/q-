import { z } from 'zod'
import { _ui, activities, user } from './_scope_value.ts'

// An invitation, a link of a ticket she opened (UI-5; 6 of the notes on
// screens, who receives): "Luca wants to shake your hand, at a distance", the
// name she gives him (his by default), accept or not. Accepted, the screen
// prepares a ticket of hers for the bond (BND-7) and, once ready, opens his
// on it (BND-8); offline, the activities wait in progress, and say so. A link
// out of its form is told, and opens nothing.

/** An activity the screen asked, and whether it ended. */
export const an_activity_asked = z.strictObject({
  asked: _ui.value.what_it_asked,
  ended: z.boolean(),
})

/** Where the invitation is: to accept; accepted, her ticket being prepared, then his opened; declined. */
export const the_step = z.discriminatedUnion('step', [
  z.strictObject({ step: z.literal('to_accept') }),
  z.strictObject({
    step: z.literal('accepted'),
    bond: user.value.a_bond,
    prepared: an_activity_asked,
    to_open: _ui.value.what_it_asked,
    opened: an_activity_asked.optional(),
  }),
])

/** The screen's state: the link, the name she gives him as she types it, the step. */
export const the_state = z.strictObject({
  link: _ui.value.what_it_holds,
  name: z.string().max(1024),
  step: the_step,
})

/** What happens on the screen. */
export const what_happens = z.discriminatedUnion('happens', [
  z.strictObject({ happens: z.literal('she_types_the_name'), name: z.string().max(1024) }),
  /** She accepts, by her active face: the ids of her ticket's bond and of the two activities drawn at the tap. */
  z.strictObject({
    happens: z.literal('she_accepts'),
    bond: user.value.a_bond,
    face: user.value.a_face,
    to_prepare: _ui.value.what_it_asked,
    to_open: _ui.value.what_it_asked,
  }),
  /** Her ticket for the bond is ready (`my_ticket`): the rendering tells the screen once. */
  z.strictObject({ happens: z.literal('her_ticket_is_ready'), bond: user.value.a_bond }),
  /** She declines: nothing is asked, and she goes back. */
  z.strictObject({ happens: z.literal('she_declines') }),
  _ui.value.she_goes_back,
  _ui.value.what_it_asked_ended,
])

/** A turn of the screen. */
export const a_turn = z.strictObject({
  state: the_state,
  asks: z.array(_ui.value.what_it_asks).max(8),
  goes: _ui.value.where_it_goes,
})

/** What the screen is given: the activities it asked. */
export const what_it_is_given = z.strictObject({
  activities: z.array(activities.value.activity_card).max(8),
})

/** What the screen shows: a link out of its form; the invitation to accept; accepted and on its way; bonded; one that cannot be. */
export const what_it_shows = z.discriminatedUnion('shows', [
  z.strictObject({ shows: z.literal('not_an_invitation') }),
  z.strictObject({
    shows: z.literal('the_invitation'),
    introduced_as: z.string().max(80),
    name: z.string().max(1024),
    the_button: z.enum(['off', 'on']),
  }),
  z.strictObject({ shows: z.literal('on_its_way'), introduced_as: z.string().max(80) }),
  z.strictObject({
    shows: z.literal('bonded'),
    introduced_as: z.string().max(80),
    already: z.boolean(),
  }),
  z.strictObject({
    shows: z.literal('the_invitation_no_longer_holds'),
    introduced_as: z.string().max(80),
    how: activities.value.how_it_ended,
  }),
])
