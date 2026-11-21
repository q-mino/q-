// A contact (UI-5; stories 9–11 of `ui`'s README): the card of a bond, by
// the name she gives it and as it introduced itself when that differs, how
// they shook hands, whether it has her yet, the relays of its mailbox;
// renaming it, its name a draft (USR-5); removing it, confirmed; the
// extensions active, each offered to it or not (EXT-7); the question of the
// extensions in common (EXT-8); since part 22.2 the marks of its place, the
// points of each extension active and offered to it (WEB-22).

import * as ui from '@q-mino/domains/ui/_dsl.ts'
import type * as ui_value from '@q-mino/domains/ui/_value.ts'
import * as a_contact from '@q-mino/domains/ui/a_contact/_dsl.ts'
import type * as a_contact_value from '@q-mino/domains/ui/a_contact/_value.ts'
import type * as activities_value from '@q-mino/domains/user/activities/_value.ts'
import { createMemo, For, Match, Show, Switch, untrack } from 'solid-js'
import { a_screen, what_it_is_given } from './a_screen.ts'
import { Back, TheCourse, TheMark, ThePoints } from './parts.tsx'
import { the_app, what_it_asked_now } from './the_app.ts'

type the_contact_shown = Extract<a_contact_value.what_it_shows, { shows: 'the_contact' }>

/** The words of a contact (provisional, A to confirm). */
export interface AContactTexts {
  readonly title: string
  readonly no_such_contact: string
  readonly introduced_as: (name: string) => string
  /** How they shook hands, by its way, and when. */
  readonly the_handshake: Readonly<
    Record<ui_value.a_contact_card['handshake']['way'], (when: string) => string>
  >
  /** An instant, told in her zone. */
  readonly when: (at: string, time_zone: string) => string
  /** Whether it has her yet, by the confirmation's state (BND-4). */
  readonly the_confirmation: Readonly<Record<ui_value.the_confirmation['state'], string>>
  readonly their_relays: string
  readonly rename_it: string
  readonly the_name: string
  readonly give_the_name: string
  readonly renaming: string
  readonly stop_renaming: string
  readonly remove_it: string
  readonly remove_it_really: (name: string) => string
  readonly yes_remove_it: string
  readonly keep_it: string
  readonly the_extensions: string
  readonly no_extension_active: string
  readonly offered: string
  readonly not_offered: string
  /** The gesture on an extension's offer, by its case. */
  readonly the_offer: Readonly<Record<a_contact_value.an_extension_on_the_contact['may'], string>>
  readonly ask_for_the_extensions_in_common: string
}

const nothing_asked: ui_value.a_course = { course: 'nothing_asked' }

/** The course of the last activity asked for this, as `what_it_shows` tells it. */
const the_course_for = (
  shown: the_contact_shown,
  purpose: a_contact_value.what_it_is_for,
): ui_value.a_course =>
  shown.courses.filter((one) => JSON.stringify(one.for) === JSON.stringify(purpose)).at(-1)
    ?.course ?? nothing_asked

export const AContact = (props: {
  texts: AContactTexts
  screen: Extract<ui_value.a_screen, { screen: 'a_contact' }>
}) => {
  const app = the_app()
  const bond = untrack(() => props.screen.bond)
  const screen = a_screen<a_contact_value.the_state, a_contact_value.what_happens>(app, {
    at_the_start: () => a_contact.at_the_start(bond),
    after: a_contact.after,
    told_the_end: (ended) => ended,
  })
  const given = what_it_is_given(
    app,
    screen.state,
    async (state): Promise<a_contact_value.what_it_is_given> => {
      const [card, extensions, offered, activities] = await Promise.all([
        app.node.a_contact(bond),
        app.node.the_extensions(),
        app.node.offered_to(bond),
        Promise.all(state.asked.map((one) => app.node.an_activity(one.asked.activity_id))),
      ])
      return {
        card,
        extensions: [...extensions],
        offered,
        activities: activities.filter(
          (one): one is activities_value.activity_card => one !== undefined,
        ),
      }
    },
  )
  const shown = createMemo(() => {
    const state = screen.state()
    const read = given()
    return state === undefined || read === undefined
      ? undefined
      : a_contact.what_it_shows(state, read.given)
  })
  const the_contact = () => {
    const it = shown()
    return it?.shows === 'the_contact' ? it : undefined
  }
  /** Whether an extension is active, as the screen read it (a frame is served only then, EXT-4). */
  const is_active = (extension: string): boolean =>
    given()?.given.extensions.some((one) => one.extension === extension && one.is === 'active') ??
    false
  /** She starts renaming it: with her draft, if one is kept, or the name she gives it. */
  const starts_renaming = async (name: string): Promise<void> => {
    const draft = await app.node.a_draft({ for: 'the_name_i_give_a_bond', bond })
    screen.happens({ happens: 'she_starts_renaming', name: draft ?? name })
  }
  const on_the_offer = (one: a_contact_value.an_extension_on_the_contact): void => {
    switch (one.may) {
      case 'offer':
        screen.happens({
          happens: 'she_offers_an_extension',
          extension: one.extension,
          asked: what_it_asked_now(app.device),
        })
        return
      case 'withdraw_the_offer':
        screen.happens({
          happens: 'she_withdraws_the_offer',
          extension: one.extension,
          asked: what_it_asked_now(app.device),
        })
        return
      case 'wait':
        return
    }
  }
  /** She asks it for the extensions in common, with those her node offers it, as read. */
  const asks_for_the_extensions_in_common = (): void => {
    const read = given()
    if (read === undefined) return
    screen.happens({
      happens: 'she_asks_for_the_extensions_in_common',
      offered: read.given.offered,
      asked: what_it_asked_now(app.device),
    })
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
        <Match when={shown()?.shows === 'no_such_contact'}>
          <p>{props.texts.no_such_contact}</p>
        </Match>
        <Match when={the_contact()}>
          {(it) => (
            <>
              <h2>{it().card.name}</h2>
              <Show when={it().card.introduced_as !== it().card.name}>
                <p>{props.texts.introduced_as(it().card.introduced_as)}</p>
              </Show>
              <p>
                {props.texts.the_handshake[it().card.handshake.way](
                  props.texts.when(it().card.handshake.at, app.device.clock.time_zone),
                )}
              </p>
              <p>{props.texts.the_confirmation[it().card.confirmation.state]}</p>
              <Show when={it().card.their_relays.length > 0}>
                <p>{props.texts.their_relays}</p>
                <ul>
                  <For each={it().card.their_relays}>{(relay) => <li>{relay}</li>}</For>
                </ul>
              </Show>
              <Show
                when={it().renaming}
                fallback={
                  <button
                    type="button"
                    onClick={() => {
                      void starts_renaming(it().card.name)
                    }}
                  >
                    {props.texts.rename_it}
                  </button>
                }
              >
                {(renaming) => (
                  <form
                    onSubmit={(event) => {
                      event.preventDefault()
                      screen.happens({
                        happens: 'she_renames_it',
                        asked: what_it_asked_now(app.device),
                      })
                    }}
                  >
                    <label>
                      {props.texts.the_name}{' '}
                      <input
                        name="name"
                        value={renaming().name}
                        onInput={(event) => {
                          screen.happens({
                            happens: 'she_types_the_name',
                            name: event.currentTarget.value,
                          })
                        }}
                      />
                    </label>
                    <button type="submit" disabled={renaming().the_button !== 'on'}>
                      {renaming().the_button === 'renaming'
                        ? props.texts.renaming
                        : props.texts.give_the_name}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        screen.happens({ happens: 'she_stops_renaming' })
                      }}
                    >
                      {props.texts.stop_renaming}
                    </button>
                  </form>
                )}
              </Show>
              <TheCourse course={the_course_for(it(), { for: 'the_name' })} />
              <Switch>
                <Match when={it().removing === 'not_asked'}>
                  <button
                    type="button"
                    onClick={() => {
                      screen.happens({ happens: 'she_asks_to_remove_it' })
                    }}
                  >
                    {props.texts.remove_it}
                  </button>
                </Match>
                <Match when={it().removing === 'to_confirm'}>
                  <p>{props.texts.remove_it_really(it().card.name)}</p>
                  <button
                    type="button"
                    onClick={() => {
                      screen.happens({
                        happens: 'she_removes_it',
                        asked: what_it_asked_now(app.device),
                      })
                    }}
                  >
                    {props.texts.yes_remove_it}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      screen.happens({ happens: 'she_keeps_it' })
                    }}
                  >
                    {props.texts.keep_it}
                  </button>
                </Match>
              </Switch>
              <TheCourse course={the_course_for(it(), { for: 'removing' })} />
              <section aria-label={props.texts.the_extensions}>
                <h2>{props.texts.the_extensions}</h2>
                <Show
                  when={it().the_extensions.length > 0}
                  fallback={<p>{props.texts.no_extension_active}</p>}
                >
                  <ul>
                    <For each={it().the_extensions}>
                      {(one) => (
                        <li>
                          {one.extension}{' '}
                          <small>
                            {one.offered ? props.texts.offered : props.texts.not_offered}
                          </small>{' '}
                          <button
                            type="button"
                            disabled={one.may === 'wait'}
                            onClick={() => {
                              on_the_offer(one)
                            }}
                          >
                            {props.texts.the_offer[one.may]}
                          </button>
                          <TheCourse
                            course={the_course_for(it(), {
                              for: 'the_offer',
                              extension: one.extension,
                            })}
                          />
                        </li>
                      )}
                    </For>
                  </ul>
                </Show>
                <button
                  type="button"
                  disabled={
                    !ui.it_may_ask(the_course_for(it(), { for: 'the_extensions_in_common' }))
                  }
                  onClick={asks_for_the_extensions_in_common}
                >
                  {props.texts.ask_for_the_extensions_in_common}
                </button>
                <TheCourse course={the_course_for(it(), { for: 'the_extensions_in_common' })} />
              </section>
              <For each={it().marks}>
                {(mark) => (
                  <TheMark extension={mark.extension}>
                    <ThePoints
                      mark={mark}
                      active={is_active(mark.extension)}
                      course_of={(action) =>
                        the_course_for(it(), {
                          for: 'an_action',
                          extension: mark.extension,
                          action,
                        })
                      }
                      taps={(action) => {
                        screen.happens({
                          happens: 'she_taps_an_action',
                          mark,
                          action,
                          asked: what_it_asked_now(app.device),
                        })
                      }}
                      opens={(page) => {
                        screen.happens({ happens: 'she_opens_a_page', mark, page })
                      }}
                    />
                  </TheMark>
                )}
              </For>
            </>
          )}
        </Match>
      </Switch>
    </section>
  )
}
