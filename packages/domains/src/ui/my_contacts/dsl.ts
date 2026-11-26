// Her contacts, as sentences (UI-5): she opens a contact; she opens the menu
// and chooses where to go; she is told when something happened; each row
// holds the slots of the extensions offered to its bond (MSG-15).

import { _ui, type value } from './_scope_dsl.ts'

/** The menu, in its order: the two handshakes, the extensions, what happened, the introduction and the server (both read again, UI-5, UI-6). */
const the_menu: readonly value.an_entry[] = [
  'the_handshake_in_person',
  'the_handshake_at_a_distance',
  'the_extensions',
  'what_happened',
  'the_introduction',
  'the_server',
]

/** The screen of an entry of the menu: the introduction read again (UI-6). */
const the_screen_of = (entry: value.an_entry): _ui.value.a_screen =>
  entry === 'the_introduction' ? { screen: entry, read: 'again' } : { screen: entry }

/** The screen at its start: the menu closed. */
export const at_the_start = (): value.the_state => ({ menu: 'closed' })

/** After what happens on the screen. */
export const after = (state: value.the_state, happens: value.what_happens): value.a_turn => {
  switch (happens.happens) {
    case 'she_opens_a_contact':
      return _ui.dsl.it_goes(state, {
        goes: 'to_a_screen',
        screen: { screen: 'a_contact', bond: happens.bond },
      })
    case 'she_opens_the_menu':
      return _ui.dsl.it_stays({ menu: 'open' })
    case 'she_closes_the_menu':
      return _ui.dsl.it_stays({ menu: 'closed' })
    case 'she_chooses':
      return _ui.dsl.it_goes(
        { menu: 'closed' },
        { goes: 'to_a_screen', screen: the_screen_of(happens.entry) },
      )
    case 'she_opens_what_happened':
      return _ui.dsl.it_goes(state, {
        goes: 'to_a_screen',
        screen: { screen: 'what_happened' },
      })
  }
}

/** What the screen shows, given her contacts and the count of what happened. */
export const what_it_shows = (
  state: value.the_state,
  given: value.what_it_is_given,
): value.what_it_shows => ({
  contacts:
    given.contacts.length === 0
      ? { are: 'none_yet', ways: ['the_handshake_in_person', 'the_handshake_at_a_distance'] }
      : { are: 'some', list: given.contacts.map((contact) => in_the_list(contact, given)) },
  ...(state.menu === 'open' ? { menu: [...the_menu] } : {}),
  ...(given.held_letters + given.happened > 0
    ? { something_happened: { held_letters: given.held_letters, happened: given.happened } }
    : {}),
})

/**
 * A contact in the list: as it introduced itself only when she named it
 * otherwise (9 of the notes: "si presenta come"); its row's marks, the
 * extensions offered to its bond with a slot there (MSG-15: a row holds no
 * action, which its manifest cannot declare there, EXT-16).
 */
const in_the_list = (
  contact: _ui.value.a_contact_seen,
  given: value.what_it_is_given,
): value.a_contact_in_the_list => ({
  bond: contact.bond,
  name: contact.name,
  ...(contact.introduced_as === contact.name ? {} : { introduced_as: contact.introduced_as }),
  they_have_me: contact.confirmation.state === 'received',
  marks: [
    ..._ui.dsl.the_marks_at(
      { place: 'a_bond_in_my_contacts', bond: contact.bond },
      { extensions: given.extensions, offered: given.offers },
    ),
  ],
})
