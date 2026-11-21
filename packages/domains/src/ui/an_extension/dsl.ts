// An extension's own screen, as sentences (UI-5): she asks to activate it and
// is told what it asks; she accepts the manifest she was shown, or not; she
// deactivates it; she taps an action or opens a page of its mark; she sends a
// letter of its again, or puts it aside. Each once at a time for what it is
// for (UI-3).

import { _ui, type activities, type value } from './_scope_dsl.ts'

/** The screen at its start, for an extension. */
export const at_the_start = (extension: string): value.the_state => ({
  extension,
  the_notice: 'closed',
  asked: [],
})

const the_same_purpose = (one: value.what_it_is_for, other: value.what_it_is_for): boolean =>
  JSON.stringify(one) === JSON.stringify(other)

const in_progress_for = (state: value.the_state, purpose: value.what_it_is_for): boolean =>
  state.asked.some((one) => !one.ended && the_same_purpose(one.for, purpose))

/** Ask for a purpose, unless one for it is in progress. */
const ask = (
  state: value.the_state,
  asked: _ui.value.what_it_asked,
  purpose: value.what_it_is_for,
  asks: readonly _ui.value.what_it_asks[],
): value.a_turn =>
  in_progress_for(state, purpose) || asks.length === 0
    ? _ui.dsl.it_stays(state)
    : _ui.dsl.it_stays(
        { ...state, asked: [...state.asked, { asked, for: purpose, ended: false }].slice(-64) },
        asks,
      )

/** A mark of this extension, on its own place. */
const its_own_mark = (state: value.the_state, mark: _ui.value.a_mark): boolean =>
  mark.extension === state.extension &&
  mark.told.place === 'the_extension' &&
  mark.told.extension === state.extension

/** After what happens on the screen. */
export const after = (state: value.the_state, happens: value.what_happens): value.a_turn => {
  switch (happens.happens) {
    case 'she_asks_to_activate_it':
      return _ui.dsl.it_stays({ ...state, the_notice: 'open' })
    case 'she_accepts':
      return state.the_notice !== 'open' || happens.manifest.name !== state.extension
        ? _ui.dsl.it_stays(state)
        : ask({ ...state, the_notice: 'closed' }, happens.asked, { for: 'activating' }, [
            {
              asks: 'an_activity',
              activity_id: happens.asked.activity_id,
              what: { activity: 'activate_an_extension', manifest: happens.manifest },
            },
          ])
    case 'she_does_not_accept':
      return _ui.dsl.it_stays({ ...state, the_notice: 'closed' })
    case 'she_deactivates_it':
      return ask(state, happens.asked, { for: 'deactivating' }, [
        {
          asks: 'an_activity',
          activity_id: happens.asked.activity_id,
          what: { activity: 'deactivate_an_extension', extension: state.extension },
        },
      ])
    case 'she_taps_an_action':
      return its_own_mark(state, happens.mark)
        ? ask(
            state,
            happens.asked,
            { for: 'an_action', action: happens.action },
            _ui.dsl.an_action_tapped(happens.mark, happens.action, happens.asked.activity_id),
          )
        : _ui.dsl.it_stays(state)
    case 'she_opens_a_page':
      return _ui.dsl.it_goes(
        state,
        its_own_mark(state, happens.mark)
          ? _ui.dsl.a_page_opened(happens.mark, happens.page)
          : { goes: 'nowhere' },
      )
    case 'she_sends_a_letter_again':
      return _ui.dsl.a_letter_of(happens.held, state.extension)
        ? ask(state, happens.asked, { for: 'a_letter', letter: happens.held.letter }, [
            _ui.dsl.a_letter_sent_again(happens.held, happens.asked.activity_id),
          ])
        : _ui.dsl.it_stays(state)
    case 'she_puts_a_letter_aside':
      return _ui.dsl.a_letter_of(happens.held, state.extension)
        ? ask(state, happens.asked, { for: 'a_letter', letter: happens.held.letter }, [
            _ui.dsl.a_letter_put_aside(happens.held, happens.because, happens.asked.activity_id),
          ])
        : _ui.dsl.it_stays(state)
    case 'she_goes_back':
      return _ui.dsl.it_goes(state, { goes: 'back' })
    case 'what_it_asked_ended':
      return _ui.dsl.it_stays({
        ...state,
        asked: state.asked.map((one) =>
          one.asked.activity_id === happens.activity_id ? { ...one, ended: true } : one,
        ),
      })
  }
}

/** What the screen shows, given the extension, its letters held, what happened and the activities it asked. */
export const what_it_shows = (
  state: value.the_state,
  given: value.what_it_is_given,
): value.what_it_shows => {
  const extension = given.extension
  if (extension?.extension !== state.extension) return { shows: 'no_such_extension' }
  const course_of = (asked: _ui.value.what_it_asked): _ui.value.a_course =>
    _ui.dsl.the_course_of(
      asked,
      given.activities.find(
        (activity: activities.value.activity_card) => activity.activity_id === asked.activity_id,
      ),
    )
  const in_progress = (purpose: value.what_it_is_for): boolean =>
    state.asked.some(
      (one) => the_same_purpose(one.for, purpose) && course_of(one.asked).course === 'in_progress',
    )
  const the_last_for = (letter: string): _ui.value.a_course => {
    const asked = state.asked
      .filter((one) => one.for.for === 'a_letter' && one.for.letter === letter)
      .at(-1)
    return asked === undefined ? { course: 'nothing_asked' } : course_of(asked.asked)
  }
  const place: _ui.value.a_place = { place: 'the_extension', extension: state.extension }
  return {
    shows: 'the_extension',
    extension: extension.extension,
    version: extension.version,
    is: extension.is,
    ...(state.the_notice === 'open' ? { the_notice: extension.what_it_asks } : {}),
    may:
      in_progress({ for: 'activating' }) || in_progress({ for: 'deactivating' })
        ? 'wait'
        : extension.is === 'active'
          ? 'deactivate'
          : extension.is === 'not_active'
            ? 'activate'
            : 'accept_the_new_manifest',
    mark: {
      ...(extension.is === 'active' ? { points: _ui.dsl.the_mark_of(extension, place) } : {}),
      held_letters: given.held_letters
        .filter((held) => _ui.dsl.a_letter_of(held, state.extension))
        .map((held) => ({ held, course: the_last_for(held.letter) })),
      happened: given.happened.filter((happened) =>
        _ui.dsl.it_happened_to(happened, state.extension),
      ),
    },
    courses: state.asked.map((one) => ({ for: one.for, course: course_of(one.asked) })),
  }
}
