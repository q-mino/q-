// A page of an extension, as sentences (UI-5): the part is there while the
// place still draws the page; she goes back.

import { _ui, type value } from './_scope_dsl.ts'

/** The screen at its start, for a page opened from a mark. */
export const at_the_start = (screen: {
  readonly extension: string
  readonly page: string
  readonly told: _ui.value.a_place
}): value.the_state => ({
  mark: {
    extension: screen.extension,
    told: screen.told,
    actions: [],
    slots: [],
    pages: [screen.page],
  },
  page: screen.page,
})

/** Where each gesture of the screen goes: back, its one gesture. */
const where_it_goes: Readonly<Record<value.what_happens['happens'], _ui.value.where_it_goes>> = {
  she_goes_back: { goes: 'back' },
}

/** After what happens on the screen. */
export const after = (state: value.the_state, happens: value.what_happens): value.a_turn =>
  _ui.dsl.it_goes(state, where_it_goes[happens.happens])

/** What the screen shows: the part while its place still draws the page (the extension active, on a bond offered to it). */
export const what_it_shows = (
  state: value.the_state,
  given: value.what_it_is_given,
): value.what_it_shows => {
  const still = _ui.dsl
    .the_marks_at(state.mark.told, { extensions: given.extensions, offered: given.offers })
    .some((mark) => mark.extension === state.mark.extension && mark.pages.includes(state.page))
  return still
    ? {
        shows: 'the_part',
        extension: state.mark.extension,
        page: state.page,
        told: state.mark.told,
      }
    : { shows: 'no_longer_there' }
}
