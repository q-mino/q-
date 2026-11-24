// A contact (UI-5; stories 9–11 of `ui`'s README): the card of a bond, by
// the name she gives it and as it introduced itself when that differs, how
// they shook hands, whether it has her yet, the relays of its mailbox;
// renaming it, its name a draft (USR-5); removing it, confirmed; the
// extensions active, each offered to it or not (EXT-7); the question of the
// extensions in common (EXT-8); since part 22.2 the marks of its place, the
// points of each extension active and offered to it (WEB-22). Removing it
// asks a confirmation that holds the screen, a `<dialog>` (WEB-29).

import type * as boundary from '@q-mino/boundary'
import * as ui from '@q-mino/domains/ui/_dsl.ts'
import type * as ui_value from '@q-mino/domains/ui/_value.ts'
import * as a_contact from '@q-mino/domains/ui/a_contact/_dsl.ts'
import type * as a_contact_value from '@q-mino/domains/ui/a_contact/_value.ts'
import type * as activities_value from '@q-mino/domains/user/activities/_value.ts'
import {
  Card,
  Field,
  Gesture,
  List,
  Notice,
  Question,
  Row,
  Screen,
  type ANoticeKind,
} from '../design/index.ts'
import { a_screen, kept, what_it_is_given } from './a_screen.ts'
import { Back, TheCourse, TheMark, ThePoints } from './parts.tsx'
import {
  the_app,
  the_word_or_its_fault,
  what_it_asked_now,
  type TheCommonTexts,
} from './the_app.ts'

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
  /** What came back of the last question, beside it (UI-5): the extensions in common by their names, in their words. */
  readonly the_answer: {
    readonly waiting: string
    readonly in_common: (names: readonly string[]) => string
    readonly none_in_common: string
    readonly no_answer: Readonly<Record<'no_response' | 'the_peer_cannot_answer', string>>
  }
}

/** What came back of the last question, in her words: nothing when none was asked. */
const the_words_of_the_answer = (
  texts: AContactTexts,
  common: TheCommonTexts,
  words: (extension: string) => boundary.the_words_of_an_extension | undefined,
  answer: a_contact_value.the_answer_shown,
): string | undefined => {
  switch (answer.answer) {
    case 'not_asked':
      return undefined
    case 'waiting':
      return texts.the_answer.waiting
    case 'in_common':
      return texts.the_answer.in_common(
        answer.extensions.map((one) => the_word_or_its_fault(common, words(one)?.name, one)),
      )
    case 'none_in_common':
      return texts.the_answer.none_in_common
    case 'no_answer':
      return texts.the_answer.no_answer[answer.why]
  }
}

/**
 * How what came back is told (WEB-29): waiting while it travels; the
 * extensions in common, or none, or no answer, as information: silence is
 * a normal outcome, never an error. [Q, C, 24 Nov 2026]
 */
const the_kind_of_the_answer = (answer: a_contact_value.the_answer_shown): ANoticeKind =>
  answer.answer === 'waiting' ? 'waiting' : 'information'

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
  const bond = kept(() => props.screen.bond)
  const screen = a_screen<a_contact_value.the_state, a_contact_value.what_happens>(app, {
    at_the_start: () => a_contact.at_the_start(bond),
    after: a_contact.after,
    told_the_end: (ended) => ended,
  })
  const given = what_it_is_given(
    app,
    screen.state,
    async (state): Promise<a_contact_value.what_it_is_given> => {
      const [card, extensions, offered, activities, in_common] = await Promise.all([
        app.node.a_contact(bond),
        app.node.the_extensions(),
        app.node.offered_to(bond),
        Promise.all(state.asked.map((one) => app.node.an_activity(one.asked.activity_id))),
        app.node.the_extensions_in_common_with(bond),
      ])
      return {
        card,
        extensions: [...extensions],
        offered,
        activities: activities.filter(
          (one): one is activities_value.activity_card => one !== undefined,
        ),
        in_common,
      }
    },
  )
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
    const read = given.value
    if (read === undefined) return
    screen.happens({
      happens: 'she_asks_for_the_extensions_in_common',
      offered: read.given.offered,
      asked: what_it_asked_now(app.device),
    })
  }
  const state = screen.state.value
  const read = given.value
  const shown =
    state === undefined || read === undefined
      ? undefined
      : a_contact.what_it_shows(state, read.given)
  return (
    <Screen
      title={props.texts.title}
      state={shown?.shows}
      back={
        <Back
          onBack={() => {
            screen.happens({ happens: 'she_goes_back' })
          }}
        />
      }
    >
      {shown?.shows === 'no_such_contact' && (
        <Notice kind="information">{props.texts.no_such_contact}</Notice>
      )}
      {shown?.shows === 'the_contact' && (
        <TheContact
          texts={props.texts}
          it={shown}
          happens={screen.happens}
          starts_renaming={starts_renaming}
          on_the_offer={on_the_offer}
          asks_for_the_extensions_in_common={asks_for_the_extensions_in_common}
        />
      )}
    </Screen>
  )
}

/** The card of the contact, as `what_it_shows` tells it, and her gestures on it. */
const TheContact = (props: {
  texts: AContactTexts
  it: the_contact_shown
  happens: (what: a_contact_value.what_happens) => void
  starts_renaming: (name: string) => Promise<void>
  on_the_offer: (one: a_contact_value.an_extension_on_the_contact) => void
  asks_for_the_extensions_in_common: () => void
}) => {
  const app = the_app()
  const it = props.it
  const said = the_words_of_the_answer(props.texts, app.common, app.words, it.in_common)
  const taps = (does: () => void) => ({ does: 'taps', taps: does }) as const
  return (
    <>
      <Card title={it.card.name}>
        <List>
          {it.card.introduced_as !== it.card.name && (
            <Row glyph="user" title={props.texts.introduced_as(it.card.introduced_as)} />
          )}
          <Row
            glyph={it.card.handshake.way === 'in_person' ? 'hand_heart' : 'link'}
            title={props.texts.the_handshake[it.card.handshake.way](
              props.texts.when(it.card.handshake.at, app.device.clock.time_zone),
            )}
          />
          <Row
            glyph={it.card.confirmation.state === 'received' ? 'check' : 'clock'}
            title={props.texts.the_confirmation[it.card.confirmation.state]}
          />
          {it.card.their_relays.length > 0 && (
            <Row
              glyph="users"
              title={props.texts.their_relays}
              detail={it.card.their_relays.join(' · ')}
            />
          )}
        </List>
        {it.renaming === undefined ? (
          <div data-part="gestures">
            <Gesture
              kind="secondary"
              label={props.texts.rename_it}
              glyph="pencil"
              does={taps(() => {
                void props.starts_renaming(it.card.name)
              })}
            />
            {it.removing !== 'not_asked' ? null : (
              <Gesture
                kind="dangerous"
                label={props.texts.remove_it}
                glyph="x"
                does={taps(() => {
                  props.happens({ happens: 'she_asks_to_remove_it' })
                })}
              />
            )}
          </div>
        ) : (
          <form
            data-state={it.renaming.the_button}
            onSubmit={(event) => {
              event.preventDefault()
              props.happens({
                happens: 'she_renames_it',
                asked: what_it_asked_now(app.device),
              })
            }}
          >
            <Field
              label={props.texts.the_name}
              name="name"
              holds={{
                holds: 'the_screens',
                value: it.renaming.name,
                types: (name) => {
                  props.happens({ happens: 'she_types_the_name', name })
                },
              }}
            />
            <div data-part="gestures">
              <Gesture
                kind="primary"
                label={
                  it.renaming.the_button === 'renaming'
                    ? props.texts.renaming
                    : props.texts.give_the_name
                }
                off={it.renaming.the_button !== 'on'}
                does={{ does: 'submits' }}
              />
              <Gesture
                kind="secondary"
                label={props.texts.stop_renaming}
                does={taps(() => {
                  props.happens({ happens: 'she_stops_renaming' })
                })}
              />
            </div>
          </form>
        )}
        <TheCourse course={the_course_for(it, { for: 'the_name' })} />
        {it.renaming !== undefined && it.removing === 'not_asked' && (
          <div data-part="gestures">
            <Gesture
              kind="dangerous"
              label={props.texts.remove_it}
              glyph="x"
              does={taps(() => {
                props.happens({ happens: 'she_asks_to_remove_it' })
              })}
            />
          </div>
        )}
        {it.removing === 'to_confirm' && (
          <Question
            kind="confirmation"
            title={props.texts.remove_it}
            declines={() => {
              props.happens({ happens: 'she_keeps_it' })
            }}
            answers={
              <>
                <Gesture
                  kind="secondary"
                  label={props.texts.keep_it}
                  does={taps(() => {
                    props.happens({ happens: 'she_keeps_it' })
                  })}
                />
                <Gesture
                  kind="dangerous"
                  label={props.texts.yes_remove_it}
                  does={taps(() => {
                    props.happens({
                      happens: 'she_removes_it',
                      asked: what_it_asked_now(app.device),
                    })
                  })}
                />
              </>
            }
          >
            <p>{props.texts.remove_it_really(it.card.name)}</p>
          </Question>
        )}
        <TheCourse course={the_course_for(it, { for: 'removing' })} />
      </Card>
      <Card title={props.texts.the_extensions}>
        {it.the_extensions.length > 0 ? (
          <List>
            {it.the_extensions.map((one) => (
              <Row
                key={one.extension}
                glyph="puzzle"
                title={the_word_or_its_fault(
                  app.common,
                  app.words(one.extension)?.name,
                  one.extension,
                )}
                detail={
                  <>
                    {one.offered ? props.texts.offered : props.texts.not_offered}
                    <TheCourse
                      course={the_course_for(it, {
                        for: 'the_offer',
                        extension: one.extension,
                      })}
                    />
                  </>
                }
                trail={
                  <Gesture
                    kind="secondary"
                    label={props.texts.the_offer[one.may]}
                    off={one.may === 'wait'}
                    does={taps(() => {
                      props.on_the_offer(one)
                    })}
                  />
                }
              />
            ))}
          </List>
        ) : (
          <p>{props.texts.no_extension_active}</p>
        )}
        <div data-part="gestures">
          <Gesture
            kind="secondary"
            label={props.texts.ask_for_the_extensions_in_common}
            glyph="refresh_cw"
            off={!ui.it_may_ask(the_course_for(it, { for: 'the_extensions_in_common' }))}
            does={taps(props.asks_for_the_extensions_in_common)}
          />
        </div>
        <TheCourse course={the_course_for(it, { for: 'the_extensions_in_common' })} />
        {said !== undefined && (
          <div data-part="the-answer" data-state={it.in_common.answer}>
            <Notice kind={the_kind_of_the_answer(it.in_common)}>{said}</Notice>
          </div>
        )}
      </Card>
      {it.marks.map((mark) => (
        <TheMark key={mark.extension} extension={mark.extension}>
          <ThePoints
            mark={mark}
            course_of={(action) =>
              the_course_for(it, {
                for: 'an_action',
                extension: mark.extension,
                action,
              })
            }
            taps={(action) => {
              props.happens({
                happens: 'she_taps_an_action',
                mark,
                action,
                asked: what_it_asked_now(app.device),
              })
            }}
            opens={(page) => {
              props.happens({ happens: 'she_opens_a_page', mark, page })
            }}
          />
        </TheMark>
      ))}
    </>
  )
}
