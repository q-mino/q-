// The handshake in person, as sentences (UI-5): the screen opened prepares a
// ticket of hers; ready, she shows its QR and scans theirs; the first ticket
// she scans is opened on her ticket's bond, by the name it introduces itself
// with; then she may open the contact, or shake another hand.

import { _ui, type activities, type value } from './_scope_dsl.ts'

/** The screen at its start: nothing prepared, the camera off. */
export const at_the_start = (): value.the_state => ({ camera: 'off' })

const a_ticket = (asked: _ui.value.what_it_asked, bond: string, face: string): value.a_turn =>
  _ui.dsl.it_stays<value.the_state>(
    { ticket: { bond, prepared: { asked, ended: false } }, camera: 'off' },
    [
      {
        asks: 'an_activity',
        activity_id: asked.activity_id,
        what: { activity: 'prepare_a_ticket', bond, face },
      },
    ],
  )

/** Whether a ticket she scanned is being opened: a new scan opens nothing until it ends (opened, she is bonded and the camera is no longer wanted; not opened, she scans again). */
const it_has_their_ticket = (state: value.the_state): boolean =>
  state.scanned?.scanned === 'their_ticket' && !state.scanned.opened.ended

/** After what happens on the screen. */
export const after = (state: value.the_state, happens: value.what_happens): value.a_turn => {
  switch (happens.happens) {
    case 'the_screen_is_opened':
      return state.ticket === undefined
        ? a_ticket(happens.asked, happens.bond, happens.face)
        : _ui.dsl.it_stays(state)
    case 'the_camera_is':
      return _ui.dsl.it_stays({ ...state, camera: happens.camera })
    case 'she_scans':
      return after_a_scan(state, happens.holds, happens.asked)
    case 'she_shakes_another_hand':
      return a_ticket(happens.asked, happens.bond, happens.face)
    case 'she_opens_the_contact':
      return state.ticket === undefined
        ? _ui.dsl.it_stays(state)
        : _ui.dsl.it_goes(state, {
            goes: 'to_a_screen',
            screen: { screen: 'a_contact', bond: state.ticket.bond },
          })
    case 'she_goes_back':
      return _ui.dsl.it_goes(state, { goes: 'back' })
    case 'what_it_asked_ended':
      return _ui.dsl.it_stays(ended(state, happens.activity_id))
  }
}

/** A scan: the first ticket opens on her ticket's bond, by its name; a text with no ticket is told, and she scans on. */
const after_a_scan = (
  state: value.the_state,
  holds: _ui.value.what_it_holds,
  asked: _ui.value.what_it_asked,
): value.a_turn => {
  if (state.ticket === undefined || it_has_their_ticket(state)) return _ui.dsl.it_stays(state)
  if (holds.holds !== 'a_ticket')
    return _ui.dsl.it_stays({ ...state, scanned: { scanned: holds.holds } })
  return _ui.dsl.it_stays(
    {
      ...state,
      scanned: { scanned: 'their_ticket', ticket: holds.ticket, opened: { asked, ended: false } },
    },
    [
      {
        asks: 'an_activity',
        activity_id: asked.activity_id,
        what: {
          activity: 'open_their_ticket',
          bond: state.ticket.bond,
          their_ticket: holds.ticket,
          name: holds.ticket.introduced_as,
        },
      },
    ],
  )
}

/** The state once an activity it asked ended. */
const ended = (state: value.the_state, activity_id: string): value.the_state => ({
  ...state,
  ...(state.ticket?.prepared.asked.activity_id === activity_id
    ? { ticket: { ...state.ticket, prepared: { ...state.ticket.prepared, ended: true } } }
    : {}),
  ...(state.scanned?.scanned === 'their_ticket' &&
  state.scanned.opened.asked.activity_id === activity_id
    ? { scanned: { ...state.scanned, opened: { ...state.scanned.opened, ended: true } } }
    : {}),
})

/** What the screen shows, given her ticket once ready and the activities it asked. */
export const what_it_shows = (
  state: value.the_state,
  given: value.what_it_is_given,
): value.what_it_shows => {
  const card_of = (asked: _ui.value.what_it_asked): activities.value.activity_card | undefined =>
    given.activities.find((activity) => activity.activity_id === asked.activity_id)
  if (state.ticket === undefined) return { shows: 'getting_the_ticket_ready' }
  const prepared = _ui.dsl.the_course_of(
    state.ticket.prepared.asked,
    card_of(state.ticket.prepared.asked),
  )
  if (prepared.course === 'ended' && prepared.how.ended !== 'done')
    return { shows: 'the_ticket_cannot_be_prepared', how: prepared.how }
  const ticket = given.ticket?.bond === state.ticket.bond ? given.ticket : undefined
  if (ticket === undefined) return { shows: 'getting_the_ticket_ready' }
  const scanned = state.scanned
  if (scanned?.scanned !== 'their_ticket')
    return { shows: 'ready', ticket, camera: state.camera, scanned: scanned?.scanned ?? 'nothing' }
  const opened = _ui.dsl.the_course_of(scanned.opened.asked, card_of(scanned.opened.asked))
  const introduced_as = scanned.ticket.introduced_as
  if (opened.course !== 'ended') return { shows: 'opening_their_ticket', introduced_as }
  if (opened.how.ended === 'done' || opened.how.ended === 'done_already')
    return {
      shows: 'bonded',
      introduced_as,
      already: opened.how.ended === 'done_already',
      said: opened.how.said,
    }
  return {
    shows: 'their_ticket_cannot_be_opened',
    introduced_as,
    how: opened.how,
    ticket,
    camera: state.camera,
  }
}
