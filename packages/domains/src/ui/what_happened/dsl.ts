// What happened, as sentences (UI-5): she sends a held letter again, or puts
// it aside with her reason, once at a time for a letter (UI-3); the kernel's
// by themselves, an extension's in its mark.

import { _ui, type value, type user } from './_scope_dsl.ts'

/** The screen at its start: nothing asked. */
export const at_the_start = (): value.the_state => ({ asked: [] })

const in_progress_for = (state: value.the_state, letter: string): boolean =>
  state.asked.some((one) => !one.ended && one.letter === letter)

const ask = (
  state: value.the_state,
  held: user.value.a_held_letter,
  asked: _ui.value.what_it_asked,
  asks: _ui.value.what_it_asks,
): value.a_turn =>
  in_progress_for(state, held.letter)
    ? _ui.dsl.it_stays(state)
    : _ui.dsl.it_stays(
        { asked: [...state.asked, { asked, letter: held.letter, ended: false }].slice(-64) },
        [asks],
      )

/** After what happens on the screen. */
export const after = (state: value.the_state, happens: value.what_happens): value.a_turn => {
  switch (happens.happens) {
    case 'she_sends_a_letter_again':
      return ask(
        state,
        happens.held,
        happens.asked,
        _ui.dsl.a_letter_sent_again(happens.held, happens.asked.activity_id),
      )
    case 'she_puts_a_letter_aside':
      return ask(
        state,
        happens.held,
        happens.asked,
        _ui.dsl.a_letter_put_aside(happens.held, happens.because, happens.asked.activity_id),
      )
    case 'she_goes_back':
      return _ui.dsl.it_goes(state, { goes: 'back' })
    case 'what_it_asked_ended':
      return _ui.dsl.it_stays({
        asked: state.asked.map((one) =>
          one.asked.activity_id === happens.activity_id ? { ...one, ended: true } : one,
        ),
      })
  }
}

/** The extensions named by what is held or happened, by name. */
const the_extensions_named = (given: value.what_it_is_given): readonly string[] =>
  [
    ...new Set([
      ...given.held_letters.flatMap((held) =>
        held.whose.of === 'an_extension' ? [held.whose.extension] : [],
      ),
      ...given.happened.flatMap((happened) =>
        'extension' in happened ? [happened.extension] : [],
      ),
    ]),
  ].sort()

/** What the screen shows, given what is in progress, held and happened, and the activities it asked. */
export const what_it_shows = (
  state: value.the_state,
  given: value.what_it_is_given,
): value.what_it_shows => {
  if (given.in_progress.length + given.held_letters.length + given.happened.length === 0)
    return { shows: 'nothing_happened' }
  const shown = (held: user.value.a_held_letter): value.a_letter_shown => {
    const asked = state.asked.filter((one) => one.letter === held.letter).at(-1)
    return {
      held,
      course: _ui.dsl.the_course_of(
        asked?.asked,
        given.activities.find((activity) => activity.activity_id === asked?.asked.activity_id),
      ),
    }
  }
  return {
    shows: 'what_happened',
    in_progress: given.in_progress,
    the_kernels: {
      held_letters: given.held_letters.filter((held) => held.whose.of === 'the_kernel').map(shown),
      happened: given.happened.filter((happened) => !('extension' in happened)),
    },
    in_their_marks: the_extensions_named(given).map((extension) => ({
      extension,
      held_letters: given.held_letters
        .filter((held) => _ui.dsl.a_letter_of(held, extension))
        .map(shown),
      happened: given.happened.filter((happened) => _ui.dsl.it_happened_to(happened, extension)),
    })),
  }
}
