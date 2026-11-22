import { z } from 'zod'
import { _ui } from './_scope_value.ts'

// The server (1c of the notes on screens, UI-5): informative, no choice. The
// relay of the configuration her letters go through (stage 1 has one), what
// it declares, what it sees and what it does not; shown once after her first
// face, and read again from the menu. Cumino cannot verify what a relay
// declares: it tells it, it does not guarantee it.

/** The screen's state: none of its own. */
export const the_state = z.strictObject({})

/** What happens on the screen: she goes on, or back. */
export const what_happens = z.discriminatedUnion('happens', [
  z.strictObject({ happens: z.literal('she_goes_on') }),
  _ui.value.she_goes_back,
])

/** A turn of the screen. */
export const a_turn = z.strictObject({
  state: the_state,
  asks: z.array(_ui.value.what_it_asks).max(8),
  goes: _ui.value.where_it_goes,
})

/** What the screen is given: the address of the relay of the configuration. */
export const what_it_is_given = z.strictObject({
  relay: z.string().min(1).max(2048),
})

/** What the screen shows: the relay's address; what it declares, sees and does not see are the screen's words. */
export const what_it_shows = z.strictObject({
  relay: z.string().min(1).max(2048),
})
