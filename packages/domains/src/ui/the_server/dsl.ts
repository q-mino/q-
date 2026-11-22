// The server, as sentences (UI-5): she reads it and goes on, to the start (her
// contacts, after her first face as from the menu).

import { _ui, type value } from './_scope_dsl.ts'

/** The screen at its start. */
export const at_the_start = (): value.the_state => ({})

/** After what happens on the screen: on or back, the app starts again from what her node holds. */
export const after = (state: value.the_state, happens: value.what_happens): value.a_turn => {
  switch (happens.happens) {
    case 'she_goes_on':
    case 'she_goes_back':
      return _ui.dsl.it_goes(state, { goes: 'to_the_start' })
  }
}

/** What the screen shows, given the relay of the configuration. */
export const what_it_shows = (
  _state: value.the_state,
  given: value.what_it_is_given,
): value.what_it_shows => ({ relay: given.relay })
