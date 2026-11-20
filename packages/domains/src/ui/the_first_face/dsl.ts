// The first face, as sentences (UI-5): she types her name, kept as a draft; she
// makes her first face with it; once made, the draft is dropped and the app
// starts again from her faces, which chooses it (USR-6).

import { _ui, type activities, type value } from './_scope_dsl.ts'

const for_the_name: _ui.value.a_draft_for = { for: 'the_name_of_my_first_face' }

/** The longest name a face takes (`make_my_first_face`, 64). */
const the_longest_name = 64

/** The screen at its start: the name of her draft, if she kept one. */
export const at_the_start = (draft: string | undefined): value.the_state => ({ name: draft ?? '' })

/** A name she may make a face with: some text, not too long. */
const a_name_to_make = (name: string): boolean =>
  name.trim().length > 0 && name.trim().length <= the_longest_name

const stays = _ui.dsl.it_stays

/** After what happens on the screen. */
export const after = (state: value.the_state, happens: value.what_happens): value.a_turn => {
  switch (happens.happens) {
    case 'she_types_the_name':
      return stays(
        { ...state, name: happens.name },
        happens.name === ''
          ? [{ asks: 'to_drop_a_draft', for: for_the_name }]
          : [{ asks: 'to_keep_a_draft', for: for_the_name, text: happens.name }],
      )
    case 'she_makes_the_face':
      return it_is_making(state) || !a_name_to_make(state.name)
        ? stays(state)
        : stays({ ...state, asked: { asked: happens.asked, face: happens.face, ended: false } }, [
            {
              asks: 'an_activity',
              activity_id: happens.asked.activity_id,
              what: { activity: 'make_my_first_face', face: happens.face, name: state.name.trim() },
            },
          ])
    case 'what_it_asked_ended':
      return happens.activity_id !== state.asked?.asked.activity_id
        ? stays(state)
        : after_the_making(state, happens.how)
  }
}

/** Once the making ended: made (now or before), the draft dropped and the start again; else she may try again. */
const after_the_making = (
  state: value.the_state,
  how: activities.value.how_it_ended,
): value.a_turn =>
  how.ended === 'done' || how.ended === 'done_already'
    ? _ui.dsl.it_goes(state, { goes: 'to_the_start' }, [
        { asks: 'to_drop_a_draft', for: for_the_name },
      ])
    : stays({
        ...state,
        asked: state.asked === undefined ? undefined : { ...state.asked, ended: true },
      })

const it_is_making = (state: value.the_state): boolean =>
  state.asked !== undefined && !state.asked.ended

/** What the screen shows, given the activity it asked as `user` reads it. */
export const what_it_shows = (
  state: value.the_state,
  activity: activities.value.activity_card | undefined,
): value.what_it_shows => {
  const course = _ui.dsl.the_course_of(state.asked?.asked, activity)
  return {
    name: state.name,
    the_button:
      course.course === 'in_progress' ? 'making' : a_name_to_make(state.name) ? 'on' : 'off',
    course,
  }
}
