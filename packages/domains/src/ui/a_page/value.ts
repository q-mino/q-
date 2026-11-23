import { z } from 'zod'
import { _ui } from './_scope_value.ts'

// A page of an extension (UI-4, UI-5; EXT-16): a screen whose content is the
// extension's frame, placed by the kernel and told the place's data, always in
// the kernel's mark of it. The frame is a client of its extension's surface on
// `self` through the boundary (EXT-2), never of `ui`: the screen holds only
// where it is drawn. Withdrawn or deactivated meanwhile, it is no longer there.

/** The screen's state: the page, where it was opened. */
export const the_state = z.strictObject({ mark: _ui.value.a_mark, page: z.string().max(64) })

/** What happens on the screen. */
export const what_happens = z.discriminatedUnion('happens', [_ui.value.she_goes_back])

/** A turn of the screen. */
export const a_turn = z.strictObject({
  state: the_state,
  asks: z.array(_ui.value.what_it_asks).max(8),
  goes: _ui.value.where_it_goes,
})

/** What the screen is given: the extensions and their offers, which the places are drawn from. */
export const what_it_is_given = z.strictObject({
  extensions: z.array(_ui.value.an_extension_seen).max(256),
  offers: _ui.value.the_offers,
})

/** What the screen shows: the frame of the page in the mark, told the place's data; or the page no longer there. */
export const what_it_shows = z.discriminatedUnion('shows', [
  z.strictObject({
    shows: z.literal('the_frame'),
    extension: z.string().max(64),
    page: z.string().max(64),
    told: _ui.value.a_place,
  }),
  z.strictObject({ shows: z.literal('no_longer_there') }),
])
