import { z } from 'zod'
import { _ui, user } from './_scope_value.ts'

// Her contacts, the home of stage 1 (UI-5): the bonds she keeps, by the names
// she gives them, whether each has her yet; the menu, minimal (Alessandro's
// structure of the app); and a word of what happened, when something did
// (USR-8: nothing happens in silence).

/** The entries of the menu, in its order. */
export const an_entry = z.enum([
  'the_handshake_in_person',
  'the_handshake_at_a_distance',
  'the_extensions',
  'what_happened',
  'the_introduction',
  'the_server',
])

/** The screen's state: the menu open or closed. */
export const the_state = z.strictObject({ menu: z.enum(['closed', 'open']) })

/** What happens on the screen. */
export const what_happens = z.discriminatedUnion('happens', [
  z.strictObject({ happens: z.literal('she_opens_a_contact'), bond: user.value.a_bond }),
  z.strictObject({ happens: z.literal('she_opens_the_menu') }),
  z.strictObject({ happens: z.literal('she_closes_the_menu') }),
  z.strictObject({ happens: z.literal('she_chooses'), entry: an_entry }),
  z.strictObject({ happens: z.literal('she_opens_what_happened') }),
])

/** A turn of the screen. */
export const a_turn = z.strictObject({
  state: the_state,
  asks: z.array(_ui.value.what_it_asks).max(8),
  goes: _ui.value.where_it_goes,
})

/** What the screen is given: her contacts, how many letters are held, how many things happened without a fact. */
export const what_it_is_given = z.strictObject({
  contacts: z.array(_ui.value.a_contact_seen).max(4096),
  held_letters: z.number().int().min(0),
  happened: z.number().int().min(0),
})

/** A contact in the list: by her name for it, as it introduced itself when that differs, whether it has her yet. */
export const a_contact_in_the_list = z.strictObject({
  bond: user.value.a_bond,
  name: z.string().min(1).max(80),
  introduced_as: z.string().min(1).max(80).optional(),
  they_have_me: z.boolean(),
})

/**
 * What the screen shows: no contacts yet, with the two ways to shake a hand;
 * or her contacts, by name. The menu when open; the word of what happened
 * when something did.
 */
export const what_it_shows = z.strictObject({
  contacts: z.discriminatedUnion('are', [
    z.strictObject({ are: z.literal('none_yet'), ways: z.array(an_entry).max(2) }),
    z.strictObject({ are: z.literal('some'), list: z.array(a_contact_in_the_list).max(4096) }),
  ]),
  menu: z.array(an_entry).max(8).optional(),
  something_happened: z
    .strictObject({ held_letters: z.number().int().min(0), happened: z.number().int().min(0) })
    .optional(),
})
