import { z } from 'zod'
import { _ui, user } from './_scope_value.ts'

// The extensions installed (UI-5): each by its name and version, active, not
// active, or waiting for her to accept a new manifest (EXT-7, EXT-10); each
// opens its own screen.

/** The screen's state: none of its own. */
export const the_state = z.strictObject({})

/** What happens on the screen. */
export const what_happens = z.discriminatedUnion('happens', [
  z.strictObject({
    happens: z.literal('she_opens_an_extension'),
    extension: user.value.an_extension,
  }),
  _ui.value.she_goes_back,
])

/** A turn of the screen. */
export const a_turn = z.strictObject({
  state: the_state,
  asks: z.array(_ui.value.what_it_asks).max(8),
  goes: _ui.value.where_it_goes,
})

/** An extension in the list. */
export const an_extension_in_the_list = z.strictObject({
  extension: user.value.an_extension,
  version: user.value.a_version,
  is: z.enum(['active', 'not_active', 'waiting_for_the_new_manifest']),
})

/** What the screen shows: the extensions, by name. */
export const what_it_shows = z.strictObject({
  extensions: z.array(an_extension_in_the_list).max(256),
})
