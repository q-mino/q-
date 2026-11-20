// A contact, as sentences (UI-5): she renames it, its name kept as a draft
// until it is renamed or she stops; she removes it, once confirmed, and goes
// back; she offers an extension to it or withdraws the offer; she asks it for
// the extensions in common; she taps an action or opens a page of a mark.
// Each activity once at a time for what it is for: a tap repeated meanwhile
// asks nothing (UI-3).

import { _ui, type activities, type value } from './_scope_dsl.ts'

/** The longest name a bond takes (`rename_a_bond`, 64). */
const the_longest_name = 64

/** The screen at its start, for a bond. */
export const at_the_start = (bond: string): value.the_state => ({
  bond,
  removing: 'not_asked',
  asked: [],
})

const the_draft_of = (state: value.the_state): _ui.value.a_draft_for => ({
  for: 'the_name_i_give_a_bond',
  bond: state.bond,
})

const a_name_to_give = (name: string): boolean =>
  name.trim().length > 0 && name.trim().length <= the_longest_name

/** Two purposes alike: the same gesture, on the same extension or action. */
const the_same_purpose = (one: value.what_it_is_for, other: value.what_it_is_for): boolean =>
  JSON.stringify(one) === JSON.stringify(other)

/** Whether an activity for this is in progress. */
const in_progress_for = (state: value.the_state, purpose: value.what_it_is_for): boolean =>
  state.asked.some((one) => !one.ended && the_same_purpose(one.for, purpose))

/** The state with one more activity asked, the oldest dropped past 64. */
const with_asked = (
  state: value.the_state,
  asked: _ui.value.what_it_asked,
  purpose: value.what_it_is_for,
): value.the_state => ({
  ...state,
  asked: [...state.asked, { asked, for: purpose, ended: false }].slice(-64),
})

/** Ask an activity for a purpose, unless one for it is in progress. */
const ask = (
  state: value.the_state,
  asked: _ui.value.what_it_asked,
  purpose: value.what_it_is_for,
  what: activities.value.what_is_asked,
): value.a_turn =>
  in_progress_for(state, purpose)
    ? _ui.dsl.it_stays(state)
    : _ui.dsl.it_stays(with_asked(state, asked, purpose), [
        { asks: 'an_activity', activity_id: asked.activity_id, what },
      ])

/** After what happens on the screen. */
export const after = (state: value.the_state, happens: value.what_happens): value.a_turn => {
  switch (happens.happens) {
    case 'she_starts_renaming':
      return _ui.dsl.it_stays({ ...state, renaming: { name: happens.name } })
    case 'she_types_the_name':
      return state.renaming === undefined
        ? _ui.dsl.it_stays(state)
        : _ui.dsl.it_stays({ ...state, renaming: { name: happens.name } }, [
            { asks: 'to_keep_a_draft', for: the_draft_of(state), text: happens.name },
          ])
    case 'she_renames_it':
      return state.renaming === undefined || !a_name_to_give(state.renaming.name)
        ? _ui.dsl.it_stays(state)
        : ask(
            state,
            happens.asked,
            { for: 'the_name' },
            {
              activity: 'rename_a_bond',
              bond: state.bond,
              name: state.renaming.name.trim(),
            },
          )
    case 'she_stops_renaming':
      return _ui.dsl.it_stays(without_renaming(state), [
        { asks: 'to_drop_a_draft', for: the_draft_of(state) },
      ])
    case 'she_asks_to_remove_it':
      return _ui.dsl.it_stays({ ...state, removing: 'to_confirm' })
    case 'she_keeps_it':
      return _ui.dsl.it_stays({ ...state, removing: 'not_asked' })
    case 'she_removes_it':
      return state.removing !== 'to_confirm'
        ? _ui.dsl.it_stays(state)
        : ask(
            state,
            happens.asked,
            { for: 'removing' },
            {
              activity: 'remove_a_bond',
              bond: state.bond,
            },
          )
    case 'she_offers_an_extension':
      return ask(
        state,
        happens.asked,
        { for: 'the_offer', extension: happens.extension },
        {
          activity: 'offer_an_extension_to_a_bond',
          extension: happens.extension,
          bond: state.bond,
        },
      )
    case 'she_withdraws_the_offer':
      return ask(
        state,
        happens.asked,
        { for: 'the_offer', extension: happens.extension },
        {
          activity: 'withdraw_the_offer_from_a_bond',
          extension: happens.extension,
          bond: state.bond,
        },
      )
    case 'she_asks_for_the_extensions_in_common':
      return ask(
        state,
        happens.asked,
        { for: 'the_extensions_in_common' },
        {
          activity: 'ask_a_bond_for_the_extensions_in_common',
          bond: state.bond,
          offered: happens.offered,
        },
      )
    case 'she_taps_an_action':
      return a_mark_of_this_bond(state, happens.mark)
        ? an_action(state, happens.mark, happens.action, happens.asked)
        : _ui.dsl.it_stays(state)
    case 'she_opens_a_page':
      return _ui.dsl.it_goes(
        state,
        a_mark_of_this_bond(state, happens.mark)
          ? _ui.dsl.a_page_opened(happens.mark, happens.page)
          : { goes: 'nowhere' },
      )
    case 'she_goes_back':
      return _ui.dsl.it_goes(state, { goes: 'back' })
    case 'what_it_asked_ended':
      return after_an_end(state, happens.activity_id, happens.how)
  }
}

const without_renaming = (state: value.the_state): value.the_state => ({
  bond: state.bond,
  removing: state.removing,
  asked: state.asked,
})

/** A mark drawn on this bond's screen: told this bond. */
const a_mark_of_this_bond = (state: value.the_state, mark: _ui.value.a_mark): boolean =>
  mark.told.place === 'a_bond' && mark.told.bond === state.bond

/** An action of a mark tapped: once at a time for that action (UI-3, UI-4). */
const an_action = (
  state: value.the_state,
  mark: _ui.value.a_mark,
  action: string,
  asked: _ui.value.what_it_asked,
): value.a_turn => {
  const purpose: value.what_it_is_for = { for: 'an_action', extension: mark.extension, action }
  const asks = _ui.dsl.an_action_tapped(mark, action, asked.activity_id)
  return in_progress_for(state, purpose) || asks.length === 0
    ? _ui.dsl.it_stays(state)
    : _ui.dsl.it_stays(with_asked(state, asked, purpose), asks)
}

/** After an activity of the screen ended: renamed, the draft dropped; removed (now or before), back; else it stays, told. */
const after_an_end = (
  state: value.the_state,
  activity_id: string,
  how: activities.value.how_it_ended,
): value.a_turn => {
  const ended = state.asked.find((one) => one.asked.activity_id === activity_id)
  if (ended === undefined) return _ui.dsl.it_stays(state)
  const after_it: value.the_state = {
    ...state,
    asked: state.asked.map((one) => (one === ended ? { ...one, ended: true } : one)),
  }
  const it_is_done = how.ended === 'done' || how.ended === 'done_already'
  if (ended.for.for === 'the_name' && how.ended === 'done')
    return _ui.dsl.it_stays(without_renaming(after_it), [
      { asks: 'to_drop_a_draft', for: the_draft_of(state) },
    ])
  if (ended.for.for === 'removing' && it_is_done)
    return _ui.dsl.it_goes({ ...after_it, removing: 'not_asked' }, { goes: 'back' })
  return _ui.dsl.it_stays(after_it)
}

/** What the screen shows, given the card, the extensions, the offers and the activities it asked. */
export const what_it_shows = (
  state: value.the_state,
  given: value.what_it_is_given,
): value.what_it_shows => {
  if (given.card === undefined) return { shows: 'no_such_contact' }
  const offered = given.offered.map((one) => one.extension)
  const course_of = (one: value.an_activity_asked): _ui.value.a_course =>
    _ui.dsl.the_course_of(
      one.asked,
      given.activities.find((activity) => activity.activity_id === one.asked.activity_id),
    )
  const in_progress = (purpose: value.what_it_is_for): boolean =>
    state.asked.some(
      (one) => the_same_purpose(one.for, purpose) && course_of(one).course === 'in_progress',
    )
  return {
    shows: 'the_contact',
    card: given.card,
    ...(state.renaming === undefined
      ? {}
      : {
          renaming: {
            name: state.renaming.name,
            the_button: in_progress({ for: 'the_name' })
              ? 'renaming'
              : a_name_to_give(state.renaming.name)
                ? 'on'
                : 'off',
          },
        }),
    removing: in_progress({ for: 'removing' }) ? 'removing' : state.removing,
    the_extensions: given.extensions
      .filter((extension) => extension.is === 'active')
      .map((extension) => ({
        extension: extension.extension,
        offered: offered.includes(extension.extension),
        may: in_progress({ for: 'the_offer', extension: extension.extension })
          ? 'wait'
          : offered.includes(extension.extension)
            ? 'withdraw_the_offer'
            : 'offer',
      })),
    marks: [
      ..._ui.dsl.the_marks_at(
        { place: 'a_bond', bond: state.bond },
        {
          extensions: given.extensions,
          offered: offered.map((extension) => ({ extension, bonds: [state.bond] })),
        },
      ),
    ],
    courses: state.asked.map((one) => ({ for: one.for, course: course_of(one) })),
  }
}
