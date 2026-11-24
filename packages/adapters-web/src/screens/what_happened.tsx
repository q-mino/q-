// What happened (UI-5; F6, USR-8: nothing happens in silence; story 23 of
// `ui`'s README): what is in progress, each told by what she asked; the
// letters held and what happened without a fact, the kernel's by
// themselves, each extension's in the kernel's mark of it (EXT-16). A held
// letter she sends again, or puts aside with her reason. The news of a mark
// are drawn by `TheNews`, which an extension's own screen draws too.

import * as ui from '@q-mino/domains/ui/_dsl.ts'
import type * as ui_value from '@q-mino/domains/ui/_value.ts'
import * as what_happened from '@q-mino/domains/ui/what_happened/_dsl.ts'
import type * as what_happened_value from '@q-mino/domains/ui/what_happened/_value.ts'
import type * as user_value from '@q-mino/domains/user/_value.ts'
import type * as activities_value from '@q-mino/domains/user/activities/_value.ts'
import { a_screen, what_it_is_given } from './a_screen.ts'
import { Back, TheCourse, TheMark } from './parts.tsx'
import { the_app, what_it_asked_now, type TheApp } from './the_app.ts'

type what_happened_without_a_fact = user_value.what_happened_without_a_fact

/** The words of the letters held and of what happened without a fact (provisional, A to confirm), shared by what happened and an extension's own screen. */
export interface TheNewsTexts {
  readonly the_held_letters: string
  /** Why a letter is held, by its case (DOM-15); the world's words follow when it could not be delivered. */
  readonly why_it_is_held: Readonly<Record<user_value.why_it_is_held['why'], string>>
  readonly send_it_again: string
  /** The field of her reason to put it aside. */
  readonly why_aside: string
  readonly put_it_aside: string
  readonly what_happened: string
  /** What happened, by its case (USR-8), told before its detail when it has one. */
  readonly happened: Readonly<Record<what_happened_without_a_fact['happened'], string>>
  /** Why a request met silence (F8: she is told which). */
  readonly the_silence_because: Readonly<
    Record<
      Extract<what_happened_without_a_fact, { happened: 'a_request_met_silence' }>['because'],
      string
    >
  >
  /** Which fall of an extension (EXT-15). */
  readonly the_fall: Readonly<
    Record<Extract<what_happened_without_a_fact, { happened: 'an_extension_fell' }>['fall'], string>
  >
}

/** The words of what happened (provisional, A to confirm). */
export interface WhatHappenedTexts {
  readonly title: string
  readonly nothing_happened: string
  readonly in_progress: string
  /** An activity in progress, by what she asked (USR-2). */
  readonly the_activities: Readonly<Record<activities_value.what_is_asked['activity'], string>>
  /** The kernel's news, by themselves. */
  readonly the_kernels: string
  readonly the_news: TheNewsTexts
}

/** The detail of what happened, when its case has one. */
const the_detail = (
  texts: TheNewsTexts,
  happened: what_happened_without_a_fact,
): string | undefined => {
  switch (happened.happened) {
    case 'a_request_met_silence':
      return texts.the_silence_because[happened.because]
    case 'a_letter_was_refused':
      return happened.leaf === '' ? undefined : happened.leaf
    case 'an_extension_fell':
      return texts.the_fall[happened.fall]
    case 'a_letter_could_not_be_opened':
    case 'a_response_came_unasked':
    case 'a_response_could_not_be_sent':
    case 'a_request_could_not_be_sent':
    case 'an_extension_did_what_it_does_not_declare':
    case 'a_request_was_not_answered':
      return undefined
  }
}

/** What happened, in her words: its case, then its detail (as the end of an activity is told). */
export const the_words_of_what_happened = (
  texts: TheNewsTexts,
  happened: what_happened_without_a_fact,
): string => {
  const detail = the_detail(texts, happened)
  const told = texts.happened[happened.happened]
  return detail === undefined ? told : `${told}: ${detail}`
}

/** A held letter shown, with the course of what she asked of it. */
export interface ALetterShown {
  readonly held: user_value.a_held_letter
  readonly course: ui_value.a_course
}

/** The world's words of a letter that could not be delivered. */
const the_worlds_words = (held: user_value.a_held_letter): string | undefined =>
  held.why.why === 'it_could_not_be_delivered' && held.why.because !== ''
    ? held.why.because
    : undefined

/**
 * The news of the kernel or of a mark: its letters held, each sent again or
 * put aside with her reason, once at a time; what happened. The letters are
 * kept by their names, so that her reason, typed, stays while her node is
 * read again.
 */
export const TheNews = (props: {
  texts: TheNewsTexts
  held_letters: readonly ALetterShown[]
  happened: readonly what_happened_without_a_fact[]
  sends_again: (held: user_value.a_held_letter) => void
  puts_aside: (held: user_value.a_held_letter, because: string) => void
}) => {
  // Kept by the letters' names (`key`), so that her reason, typed, stays.
  return (
    <>
      {props.held_letters.length > 0 && (
        <>
          <h3>{props.texts.the_held_letters}</h3>
          <ul>
            {props.held_letters.map((one) => (
              <li key={one.held.letter} data-state={one.held.why.why}>
                <p>{one.held.what}</p>
                <p>
                  <small>{props.texts.why_it_is_held[one.held.why.why]}</small>
                  <TheWorldsWords held={one.held} />
                </p>
                <button
                  type="button"
                  disabled={!ui.it_may_ask(one.course)}
                  onClick={() => {
                    props.sends_again(one.held)
                  }}
                >
                  {props.texts.send_it_again}
                </button>
                <form
                  onSubmit={(event) => {
                    event.preventDefault()
                    const because = new FormData(event.currentTarget).get('because')
                    props.puts_aside(one.held, typeof because === 'string' ? because : '')
                  }}
                >
                  <label>
                    {props.texts.why_aside} <input name="because" maxLength={1024} />
                  </label>
                  <button type="submit" disabled={!ui.it_may_ask(one.course)}>
                    {props.texts.put_it_aside}
                  </button>
                </form>
                <TheCourse course={one.course} />
              </li>
            ))}
          </ul>
        </>
      )}
      {props.happened.length > 0 && (
        <>
          <h3>{props.texts.what_happened}</h3>
          <ul>
            {props.happened.map((one, index) => (
              <li key={index} data-state={one.happened}>
                {the_words_of_what_happened(props.texts, one)}
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  )
}

/** The world's words beside a letter that could not be delivered, none otherwise. */
const TheWorldsWords = (props: { held: user_value.a_held_letter }) => {
  const because = the_worlds_words(props.held)
  return because === undefined ? null : <small> ({because})</small>
}

/** The activities a screen asked, as `user` reads them (none not read yet). */
const the_activities_asked = async (
  app: TheApp,
  asked: readonly { readonly asked: ui_value.what_it_asked }[],
): Promise<activities_value.activity_card[]> =>
  (await Promise.all(asked.map((one) => app.node.an_activity(one.asked.activity_id)))).filter(
    (card): card is activities_value.activity_card => card !== undefined,
  )

export const WhatHappened = (props: { texts: WhatHappenedTexts }) => {
  const app = the_app()
  const screen = a_screen<what_happened_value.the_state, what_happened_value.what_happens>(app, {
    at_the_start: what_happened.at_the_start,
    after: what_happened.after,
    told_the_end: (ended) => ended,
  })
  const given = what_it_is_given(
    app,
    screen.state,
    async (state): Promise<what_happened_value.what_it_is_given> => {
      const [in_progress, held_letters, happened, activities] = await Promise.all([
        app.node.the_activities_in_progress(),
        app.node.the_held_letters(),
        app.node.what_happened(),
        the_activities_asked(app, state.asked),
      ])
      return {
        in_progress: [...in_progress],
        held_letters: [...held_letters],
        happened: [...happened],
        activities,
      }
    },
  )
  const sends_again = (held: user_value.a_held_letter): void => {
    screen.happens({
      happens: 'she_sends_a_letter_again',
      held,
      asked: what_it_asked_now(app.device),
    })
  }
  const puts_aside = (held: user_value.a_held_letter, because: string): void => {
    screen.happens({
      happens: 'she_puts_a_letter_aside',
      held,
      because,
      asked: what_it_asked_now(app.device),
    })
  }
  const state = screen.state.value
  const read = given.value
  const shown =
    state === undefined || read === undefined
      ? undefined
      : what_happened.what_it_shows(state, read.given)
  return (
    <section aria-label={props.texts.title} data-state={shown?.shows}>
      <Back
        onBack={() => {
          screen.happens({ happens: 'she_goes_back' })
        }}
      />
      <h1>{props.texts.title}</h1>
      {shown?.shows === 'nothing_happened' && <p>{props.texts.nothing_happened}</p>}
      {shown?.shows === 'what_happened' && (
        <>
          {shown.in_progress.length > 0 && (
            <>
              <h2>{props.texts.in_progress}</h2>
              <ul>
                {shown.in_progress.map((card) => (
                  <li key={card.activity_id}>{props.texts.the_activities[card.what.activity]}</li>
                ))}
              </ul>
            </>
          )}
          {shown.the_kernels.held_letters.length + shown.the_kernels.happened.length > 0 && (
            <section aria-label={props.texts.the_kernels}>
              <h2>{props.texts.the_kernels}</h2>
              <TheNews
                texts={props.texts.the_news}
                held_letters={shown.the_kernels.held_letters}
                happened={shown.the_kernels.happened}
                sends_again={sends_again}
                puts_aside={puts_aside}
              />
            </section>
          )}
          {/* The marks kept by their extensions' names, as the letters by theirs. */}
          {shown.in_their_marks.map((mark) => (
            <TheMark key={mark.extension} extension={mark.extension}>
              <TheNews
                texts={props.texts.the_news}
                held_letters={mark.held_letters}
                happened={mark.happened}
                sends_again={sends_again}
                puts_aside={puts_aside}
              />
            </TheMark>
          ))}
        </>
      )}
    </section>
  )
}
