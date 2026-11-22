// The handshake at a distance, as sentences (UI-5): told the flaw, she makes
// a link; ready, she shares it; again, she makes another, for another bond.

import { _ui, type value } from './_scope_dsl.ts'

/** The screen at its start: the flaw told, nothing asked. */
export const at_the_start = (): value.the_state => ({})

/** After what happens on the screen. */
export const after = (state: value.the_state, happens: value.what_happens): value.a_turn => {
  switch (happens.happens) {
    case 'she_makes_a_link':
      return state.ticket !== undefined && !state.ticket.ended
        ? _ui.dsl.it_stays(state)
        : _ui.dsl.it_stays<value.the_state>(
            { ticket: { bond: happens.bond, asked: happens.asked, ended: false, copied: false } },
            [
              {
                asks: 'an_activity',
                activity_id: happens.asked.activity_id,
                what: { activity: 'prepare_a_ticket', bond: happens.bond, face: happens.face },
              },
            ],
          )
    case 'the_link_is_copied':
      return _ui.dsl.it_stays(
        state.ticket === undefined ? state : { ticket: { ...state.ticket, copied: true } },
      )
    case 'she_goes_back':
      return _ui.dsl.it_goes(state, { goes: 'back' })
    case 'what_it_asked_ended':
      return state.ticket?.asked.activity_id === happens.activity_id
        ? _ui.dsl.it_stays({ ticket: { ...state.ticket, ended: true } })
        : _ui.dsl.it_stays(state)
  }
}

/** What the screen shows, given her ticket once ready and the activity it asked. */
export const what_it_shows = (
  state: value.the_state,
  given: value.what_it_is_given,
): value.what_it_shows => {
  if (state.ticket === undefined) return { shows: 'the_flaw_told' }
  const course = _ui.dsl.the_course_of(state.ticket.asked, given.activity)
  if (course.course === 'ended' && course.how.ended !== 'done')
    return { shows: 'the_link_cannot_be_prepared', how: course.how }
  return given.ticket?.bond === state.ticket.bond
    ? {
        shows: 'the_link',
        ticket: given.ticket,
        gesture: given.the_phone === 'shares' ? 'share' : state.ticket.copied ? 'copied' : 'copy',
      }
    : { shows: 'getting_the_link_ready' }
}
