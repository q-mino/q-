// An invitation, as sentences (UI-5): she names him, his name by default; she
// accepts, and her ticket is prepared; once it is ready, his ticket is opened
// on it; or she declines, and goes back with nothing asked.

import { _ui, type activities, type value } from './_scope_dsl.ts'

/** The longest name a bond takes (`open_their_ticket`, 64). */
const the_longest_name = 64

/** The screen at its start, for a link: the name his ticket introduces him with. */
export const at_the_start = (link: _ui.value.what_it_holds): value.the_state => ({
  link,
  name: link.holds === 'a_ticket' ? link.ticket.introduced_as : '',
  step: { step: 'to_accept' },
})

const a_name_to_give = (name: string): boolean =>
  name.trim().length > 0 && name.trim().length <= the_longest_name

/** After what happens on the screen. */
export const after = (state: value.the_state, happens: value.what_happens): value.a_turn => {
  switch (happens.happens) {
    case 'she_types_the_name':
      return state.step.step === 'to_accept'
        ? _ui.dsl.it_stays({ ...state, name: happens.name })
        : _ui.dsl.it_stays(state)
    case 'she_accepts':
      return state.link.holds !== 'a_ticket' ||
        state.step.step !== 'to_accept' ||
        !a_name_to_give(state.name)
        ? _ui.dsl.it_stays(state)
        : _ui.dsl.it_stays(
            {
              ...state,
              step: {
                step: 'accepted',
                bond: happens.bond,
                prepared: { asked: happens.to_prepare, ended: false },
                to_open: happens.to_open,
              },
            },
            [
              {
                asks: 'an_activity',
                activity_id: happens.to_prepare.activity_id,
                what: { activity: 'prepare_a_ticket', bond: happens.bond, face: happens.face },
              },
            ],
          )
    case 'her_ticket_is_ready':
      return the_ticket_ready(state, happens.bond)
    case 'she_declines':
    case 'she_goes_back':
      return _ui.dsl.it_goes(state, { goes: 'back' })
    case 'what_it_asked_ended':
      return _ui.dsl.it_stays(ended(state, happens.activity_id))
  }
}

/** Her ticket ready for the bond she accepted on: his ticket is opened on it, once. */
const the_ticket_ready = (state: value.the_state, bond: string): value.a_turn => {
  const step = state.step
  if (
    state.link.holds !== 'a_ticket' ||
    step.step !== 'accepted' ||
    step.bond !== bond ||
    step.opened !== undefined
  )
    return _ui.dsl.it_stays(state)
  return _ui.dsl.it_stays(
    { ...state, step: { ...step, opened: { asked: step.to_open, ended: false } } },
    [
      {
        asks: 'an_activity',
        activity_id: step.to_open.activity_id,
        what: {
          activity: 'open_their_ticket',
          bond,
          their_ticket: state.link.ticket,
          name: state.name.trim(),
        },
      },
    ],
  )
}

/** The state once an activity it asked ended. */
const ended = (state: value.the_state, activity_id: string): value.the_state => {
  const step = state.step
  if (step.step !== 'accepted') return state
  if (step.prepared.asked.activity_id === activity_id)
    return { ...state, step: { ...step, prepared: { ...step.prepared, ended: true } } }
  if (step.opened?.asked.activity_id === activity_id)
    return { ...state, step: { ...step, opened: { ...step.opened, ended: true } } }
  return state
}

/** What the screen shows, given the activities it asked. */
export const what_it_shows = (
  state: value.the_state,
  given: value.what_it_is_given,
): value.what_it_shows => {
  if (state.link.holds !== 'a_ticket') return { shows: 'not_an_invitation' }
  const introduced_as = state.link.ticket.introduced_as
  const step = state.step
  if (step.step === 'to_accept')
    return {
      shows: 'the_invitation',
      introduced_as,
      name: state.name,
      the_button: a_name_to_give(state.name) ? 'on' : 'off',
    }
  const course_of = (asked: _ui.value.what_it_asked): _ui.value.a_course =>
    _ui.dsl.the_course_of(
      asked,
      given.activities.find((activity) => activity.activity_id === asked.activity_id),
    )
  const prepared = course_of(step.prepared.asked)
  if (prepared.course === 'ended' && prepared.how.ended !== 'done')
    return { shows: 'the_invitation_no_longer_holds', introduced_as, how: prepared.how }
  if (step.opened === undefined) return { shows: 'on_its_way', introduced_as }
  return after_the_opening(introduced_as, course_of(step.opened.asked))
}

const after_the_opening = (
  introduced_as: string,
  opened: _ui.value.a_course,
): value.what_it_shows => {
  if (opened.course !== 'ended') return { shows: 'on_its_way', introduced_as }
  const how: activities.value.how_it_ended = opened.how
  return how.ended === 'done' || how.ended === 'done_already'
    ? { shows: 'bonded', introduced_as, already: how.ended === 'done_already' }
    : { shows: 'the_invitation_no_longer_holds', introduced_as, how }
}
