import { z } from 'zod'
import { _ui, user } from './_scope_value.ts'

// The first face (UI-5; 1a of the notes on screens): she starts with no face,
// and makes the first with a name; the name she types is a draft of hers
// (USR-5), kept as she types it.

/** The screen's state: the name as she types it, and what it asked: the activity and the face it makes. */
export const the_state = z.strictObject({
  name: z.string().max(1024),
  asked: z
    .strictObject({ asked: _ui.value.what_it_asked, face: user.value.a_face, ended: z.boolean() })
    .optional(),
})

/** What happens on the screen: she types the name, she makes the face (its ids drawn at the tap), what it asked ends. */
export const what_happens = z.discriminatedUnion('happens', [
  z.strictObject({ happens: z.literal('she_types_the_name'), name: z.string().max(1024) }),
  z.strictObject({
    happens: z.literal('she_makes_the_face'),
    asked: _ui.value.what_it_asked,
    face: user.value.a_face,
  }),
  _ui.value.what_it_asked_ended,
])

/** A turn of the screen: its state after, what it asks, where it goes. */
export const a_turn = z.strictObject({
  state: the_state,
  asks: z.array(_ui.value.what_it_asks).max(8),
  goes: _ui.value.where_it_goes,
})

/** What the screen shows: the name, the button (off with no name, on, or making the face), and the course of the making. */
export const what_it_shows = z.strictObject({
  name: z.string().max(1024),
  the_button: z.enum(['off', 'on', 'making']),
  course: _ui.value.a_course,
})
