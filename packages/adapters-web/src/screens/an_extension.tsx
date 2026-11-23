// An extension's own screen (UI-5; EXT-7, EXT-16, USR-7, USR-8; stories
// 19–21 of `ui`'s README): its name, version and state; to activate it, the
// notice of what it asks, the flaws the kernel cannot fence included, and
// the manifest she was shown accepted or not; a new manifest accepted the
// same way; deactivating it. In the kernel's mark of it, its letters held
// and what happened to it, and since part 22.2 the points of its place
// (WEB-22): its actions, its slots, the pages it opens.

import type * as boundary from '@q-mino/boundary'
import type * as ui_value from '@q-mino/domains/ui/_value.ts'
import * as an_extension from '@q-mino/domains/ui/an_extension/_dsl.ts'
import type * as an_extension_value from '@q-mino/domains/ui/an_extension/_value.ts'
import type * as user_value from '@q-mino/domains/user/_value.ts'
import type * as activities_value from '@q-mino/domains/user/activities/_value.ts'
import { createMemo, For, Match, Show, Switch, untrack } from 'solid-js'
import { a_screen, what_it_is_given } from './a_screen.ts'
import { Back, TheCourse, TheMark, ThePoints } from './parts.tsx'
import {
  in_its_words,
  the_app,
  the_word_or_its_fault,
  what_it_asked_now,
  type TheCommonTexts,
} from './the_app.ts'
import { TheNews, type TheNewsTexts } from './what_happened.tsx'

type the_extension_shown = Extract<an_extension_value.what_it_shows, { shows: 'the_extension' }>
type what_an_extension_asks = user_value.what_an_extension_asks
type a_place_asked = Extract<what_an_extension_asks, { asks: 'a_place_on_your_screens' }>

/** The words of an extension's own screen (provisional, A to confirm). */
export interface AnExtensionTexts {
  readonly title: string
  readonly no_such_extension: string
  readonly the_version: (version: string) => string
  readonly is: Readonly<Record<the_extension_shown['is'], string>>
  /** The gesture the screen allows, by its case. */
  readonly may: Readonly<Record<the_extension_shown['may'], string>>
  /** The notice's heading, with the manifest she is shown. */
  readonly the_notice: (extension: string, version: string) => string
  /** What an extension asks, by its case (USR-7), the flaws included; the two with data below. */
  readonly what_it_asks: Readonly<
    Record<
      Exclude<what_an_extension_asks['asks'], 'to_answer_your_bonds' | 'a_place_on_your_screens'>,
      string
    >
  >
  readonly to_answer_your_bonds: (leaves: readonly string[]) => string
  /** A place on her screens, by its point: its name and its place. */
  readonly a_place_on_your_screens: Readonly<
    Record<a_place_asked['point'], (name: string, place: string) => string>
  >
  readonly accept: string
  readonly do_not_accept: string
  readonly no_news: string
  readonly the_news: TheNewsTexts
}

/** The plural of a point, as an extension's words name its labels (EXT-16). */
const the_labels_of = {
  action: 'actions',
  slot: 'slots',
  page: 'pages',
} as const satisfies Record<a_place_asked['point'], keyof boundary.the_words_of_an_extension>

/** What an extension asks, in her words: a place by its label in the extension's words, or the fault of its missing (WEB-22). */
const the_words_of_what_it_asks = (
  texts: AnExtensionTexts,
  common: TheCommonTexts,
  words: boundary.the_words_of_an_extension | undefined,
  asks: what_an_extension_asks,
): string => {
  switch (asks.asks) {
    case 'to_answer_your_bonds':
      return texts.to_answer_your_bonds(asks.leaves)
    case 'a_place_on_your_screens':
      return in_its_words(
        common,
        words?.[the_labels_of[asks.point]][asks.name],
        asks.name,
        (label) => texts.a_place_on_your_screens[asks.point](label, asks.place),
      )
    case 'to_see_the_peers_key':
    case 'to_see_the_name_of_the_bond':
    case 'to_send_requests_on_your_bonds':
    case 'a_storage_of_its_own':
    case 'the_network_as_far_as_the_browser_leaves_it':
    case 'its_frames_act_with_no_tap':
      return texts.what_it_asks[asks.asks]
  }
}

const nothing_asked: ui_value.a_course = { course: 'nothing_asked' }

/** The course of its activation or deactivation, the last she asked. */
/** The course of the last activity of an action of its mark (UI-3). */
const the_course_of_an_action = (shown: the_extension_shown, action: string): ui_value.a_course =>
  shown.courses.filter((one) => one.for.for === 'an_action' && one.for.action === action).at(-1)
    ?.course ?? nothing_asked

const the_course_of_its_state = (shown: the_extension_shown): ui_value.a_course =>
  shown.courses
    .filter((one) => one.for.for === 'activating' || one.for.for === 'deactivating')
    .at(-1)?.course ?? nothing_asked

export const AnExtension = (props: {
  texts: AnExtensionTexts
  screen: Extract<ui_value.a_screen, { screen: 'an_extension' }>
}) => {
  const app = the_app()
  const extension = untrack(() => props.screen.extension)
  const screen = a_screen<an_extension_value.the_state, an_extension_value.what_happens>(app, {
    at_the_start: () => an_extension.at_the_start(extension),
    after: an_extension.after,
    told_the_end: (ended) => ended,
  })
  const given = what_it_is_given(
    app,
    screen.state,
    async (state): Promise<an_extension_value.what_it_is_given> => {
      const [extensions, held_letters, happened, activities] = await Promise.all([
        app.node.the_extensions(),
        app.node.the_held_letters(),
        app.node.what_happened(),
        Promise.all(state.asked.map((one) => app.node.an_activity(one.asked.activity_id))),
      ])
      return {
        extension: extensions.find((one) => one.extension === state.extension),
        held_letters: [...held_letters],
        happened: [...happened],
        activities: activities.filter(
          (card): card is activities_value.activity_card => card !== undefined,
        ),
      }
    },
  )
  const shown = createMemo(() => {
    const state = screen.state()
    const read = given()
    return state === undefined || read === undefined
      ? undefined
      : an_extension.what_it_shows(state, read.given)
  })
  const the_extension = () => {
    const it = shown()
    return it?.shows === 'the_extension' ? it : undefined
  }
  /** The manifest she is shown: the one of the extension read, whose notice the screen tells. */
  const the_manifest = () => given()?.given.extension?.manifest
  const may = (it: the_extension_shown): void => {
    switch (it.may) {
      case 'activate':
      case 'accept_the_new_manifest':
        screen.happens({ happens: 'she_asks_to_activate_it' })
        return
      case 'deactivate':
        screen.happens({ happens: 'she_deactivates_it', asked: what_it_asked_now(app.device) })
        return
      case 'wait':
        return
    }
  }
  const accepts = (): void => {
    const manifest = the_manifest()
    if (manifest === undefined) return
    screen.happens({ happens: 'she_accepts', manifest, asked: what_it_asked_now(app.device) })
  }
  return (
    <section aria-label={props.texts.title}>
      <Back
        onBack={() => {
          screen.happens({ happens: 'she_goes_back' })
        }}
      />
      <h1>{props.texts.title}</h1>
      <Switch>
        <Match when={shown()?.shows === 'no_such_extension'}>
          <p>{props.texts.no_such_extension}</p>
        </Match>
        <Match when={the_extension()}>
          {(it) => (
            <>
              <h2>
                {the_word_or_its_fault(app.common, app.words(it().extension)?.name, it().extension)}
              </h2>
              <p>
                <small>{props.texts.the_version(it().version)}</small>{' '}
                <small>{props.texts.is[it().is]}</small>
              </p>
              <button
                type="button"
                disabled={it().may === 'wait'}
                onClick={() => {
                  may(it())
                }}
              >
                {props.texts.may[it().may]}
              </button>
              <TheCourse course={the_course_of_its_state(it())} />
              <Show when={it().the_notice}>
                {(notice) => (
                  <section>
                    <Show when={the_manifest()}>
                      {(manifest) => (
                        <h3>
                          {in_its_words(
                            app.common,
                            app.words(manifest().name)?.name,
                            manifest().name,
                            (name) => props.texts.the_notice(name, manifest().version),
                          )}
                        </h3>
                      )}
                    </Show>
                    <ol>
                      <For each={notice()}>
                        {(asks) => (
                          <li>
                            {the_words_of_what_it_asks(
                              props.texts,
                              app.common,
                              app.words(it().extension),
                              asks,
                            )}
                          </li>
                        )}
                      </For>
                    </ol>
                    <button type="button" onClick={accepts}>
                      {props.texts.accept}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        screen.happens({ happens: 'she_does_not_accept' })
                      }}
                    >
                      {props.texts.do_not_accept}
                    </button>
                  </section>
                )}
              </Show>
              <TheMark extension={it().extension}>
                <Show when={it().mark.points}>
                  {(points) => (
                    <ThePoints
                      mark={points()}
                      active={it().is === 'active'}
                      course_of={(action) => the_course_of_an_action(it(), action)}
                      taps={(action) => {
                        screen.happens({
                          happens: 'she_taps_an_action',
                          mark: points(),
                          action,
                          asked: what_it_asked_now(app.device),
                        })
                      }}
                      opens={(page) => {
                        screen.happens({ happens: 'she_opens_a_page', mark: points(), page })
                      }}
                    />
                  )}
                </Show>
                <Show
                  when={it().mark.held_letters.length + it().mark.happened.length > 0}
                  fallback={<p>{props.texts.no_news}</p>}
                >
                  <TheNews
                    texts={props.texts.the_news}
                    held_letters={it().mark.held_letters}
                    happened={it().mark.happened}
                    sends_again={(held) => {
                      screen.happens({
                        happens: 'she_sends_a_letter_again',
                        held,
                        asked: what_it_asked_now(app.device),
                      })
                    }}
                    puts_aside={(held, because) => {
                      screen.happens({
                        happens: 'she_puts_a_letter_aside',
                        held,
                        because,
                        asked: what_it_asked_now(app.device),
                      })
                    }}
                  />
                </Show>
              </TheMark>
            </>
          )}
        </Match>
      </Switch>
    </section>
  )
}
