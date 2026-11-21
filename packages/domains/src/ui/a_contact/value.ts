import { z } from 'zod'
import { _ui, activities, user } from './_scope_value.ts'

// A contact (UI-5; 9 of the notes on screens): the card of a bond, by the name
// she gives it and as it introduced itself, how they shook hands and whether
// it has her yet; renaming it, its name a draft (USR-5), and removing it,
// confirmed; the extensions active, each offered to it or not (EXT-7), and the
// question of the extensions in common (EXT-8); the place `a_bond`, where the
// extensions offered to it are drawn, each in its mark (EXT-16).

/** What an activity of the screen is for. */
export const what_it_is_for = z.discriminatedUnion('for', [
  z.strictObject({ for: z.literal('the_name') }),
  z.strictObject({ for: z.literal('removing') }),
  z.strictObject({ for: z.literal('the_offer'), extension: user.value.an_extension }),
  z.strictObject({ for: z.literal('the_extensions_in_common') }),
  z.strictObject({
    for: z.literal('an_action'),
    extension: user.value.an_extension,
    action: user.value.a_name,
  }),
])

/** An activity the screen asked, what for, and whether it ended. */
export const an_activity_asked = z.strictObject({
  asked: _ui.value.what_it_asked,
  for: what_it_is_for,
  ended: z.boolean(),
})

/** The screen's state: the bond, the name as she retypes it, the removal to confirm, what it asked. */
export const the_state = z.strictObject({
  bond: user.value.a_bond,
  renaming: z.strictObject({ name: z.string().max(1024) }).optional(),
  removing: z.enum(['not_asked', 'to_confirm']),
  asked: z.array(an_activity_asked).max(64),
})

/** What happens on the screen. */
export const what_happens = z.discriminatedUnion('happens', [
  /** She starts renaming it: the name is her draft, or the one she gives it. */
  z.strictObject({ happens: z.literal('she_starts_renaming'), name: z.string().max(1024) }),
  z.strictObject({ happens: z.literal('she_types_the_name'), name: z.string().max(1024) }),
  z.strictObject({ happens: z.literal('she_renames_it'), asked: _ui.value.what_it_asked }),
  z.strictObject({ happens: z.literal('she_stops_renaming') }),
  z.strictObject({ happens: z.literal('she_asks_to_remove_it') }),
  z.strictObject({ happens: z.literal('she_keeps_it') }),
  z.strictObject({ happens: z.literal('she_removes_it'), asked: _ui.value.what_it_asked }),
  z.strictObject({
    happens: z.literal('she_offers_an_extension'),
    extension: user.value.an_extension,
    asked: _ui.value.what_it_asked,
  }),
  z.strictObject({
    happens: z.literal('she_withdraws_the_offer'),
    extension: user.value.an_extension,
    asked: _ui.value.what_it_asked,
  }),
  /** She asks the bond for the extensions in common, with those her node offers it (EXT-8). */
  z.strictObject({
    happens: z.literal('she_asks_for_the_extensions_in_common'),
    offered: activities.value.offered,
    asked: _ui.value.what_it_asked,
  }),
  /** She taps an action of a mark the screen drew (EXT-16). */
  z.strictObject({
    happens: z.literal('she_taps_an_action'),
    mark: _ui.value.a_mark,
    action: user.value.a_name,
    asked: _ui.value.what_it_asked,
  }),
  /** She opens a page of a mark the screen drew (EXT-16). */
  z.strictObject({
    happens: z.literal('she_opens_a_page'),
    mark: _ui.value.a_mark,
    page: user.value.a_name,
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

/** What the screen is given: the card (none once removed), the extensions, those offered to the bond, the activities it asked. */
export const what_it_is_given = z.strictObject({
  card: _ui.value.a_contact_card.optional(),
  extensions: z.array(_ui.value.an_extension_seen).max(256),
  offered: activities.value.offered,
  activities: z.array(activities.value.activity_card).max(64),
})

/** An extension on the contact: active, offered to it or not, and the gesture it allows. */
export const an_extension_on_the_contact = z.strictObject({
  extension: user.value.an_extension,
  offered: z.boolean(),
  may: z.enum(['offer', 'withdraw_the_offer', 'wait']),
})

/** What the screen shows: no such contact (removed), or the contact. */
export const what_it_shows = z.discriminatedUnion('shows', [
  z.strictObject({ shows: z.literal('no_such_contact') }),
  z.strictObject({
    shows: z.literal('the_contact'),
    card: _ui.value.a_contact_card,
    renaming: z
      .strictObject({ name: z.string().max(1024), the_button: z.enum(['off', 'on', 'renaming']) })
      .optional(),
    removing: z.enum(['not_asked', 'to_confirm', 'removing']),
    the_extensions: z.array(an_extension_on_the_contact).max(256),
    marks: z.array(_ui.value.a_mark).max(256),
    courses: z.array(z.strictObject({ for: what_it_is_for, course: _ui.value.a_course })).max(64),
  }),
])
