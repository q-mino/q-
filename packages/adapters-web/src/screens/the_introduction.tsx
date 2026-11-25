// The introduction (UI-6): three cards that tell what Cumino is, turned one
// after the other; where she is among them; going on (the next card, the
// server the first time, back where she was again), the card before, and,
// the first time, skipping the rest. Back drawn only when read again: the
// first time the first face is behind her, as on the server's screen.
// [Q, C, 25 Nov 2026]

import * as the_introduction from '@q-mino/domains/ui/the_introduction/_dsl.ts'
import type * as the_introduction_value from '@q-mino/domains/ui/the_introduction/_value.ts'
import type * as ui_value from '@q-mino/domains/ui/_value.ts'
import { Card, Flaw, Gesture, Icon, Screen, type AGlyph } from '../design/index.ts'
import { a_screen } from './a_screen.ts'
import { Back } from './parts.tsx'
import { the_app } from './the_app.ts'

/** The words of a card: its title and what it says, a paragraph each. */
export interface ACardsTexts {
  readonly title: string
  readonly says: readonly string[]
}

/** The words of the introduction (provisional, A to confirm). */
export interface TheIntroductionTexts {
  readonly title: string
  readonly the_cards: Readonly<Record<the_introduction_value.a_card, ACardsTexts>>
  /** What the card of the letters says Cumino does not guarantee, in the sign of a flaw. */
  readonly it_informs: string
  /** Where she is among the cards, for a screen reader: the card's number and how many. */
  readonly where_she_is: (number: number, of: number) => string
  readonly to_the_next_card: string
  readonly to_the_server: string
  readonly back_where_she_was: string
  readonly to_the_card_before: string
  readonly skip: string
}

/** The glyph of each card. */
const the_glyph_of: Readonly<Record<the_introduction_value.a_card, AGlyph>> = {
  what_cumino_is: 'hand_heart',
  how_the_letters_travel: 'mail',
  the_extensions: 'puzzle',
}

export const TheIntroduction = (props: {
  texts: TheIntroductionTexts
  screen: Extract<ui_value.a_screen, { screen: 'the_introduction' }>
}) => {
  const app = the_app()
  const screen = a_screen<the_introduction_value.the_state, the_introduction_value.what_happens>(
    app,
    {
      at_the_start: () => the_introduction.at_the_start(props.screen.read),
      after: the_introduction.after,
    },
  )
  const state = screen.state.value
  const it = state === undefined ? undefined : the_introduction.what_it_shows(state)
  const taps = (happens: the_introduction_value.what_happens) =>
    ({
      does: 'taps',
      taps: () => {
        screen.happens(happens)
      },
    }) as const
  const going_on = {
    to_the_next_card: props.texts.to_the_next_card,
    to_the_server: props.texts.to_the_server,
    back_where_she_was: props.texts.back_where_she_was,
  } as const
  const number = it === undefined ? 0 : it.the_cards.indexOf(it.card) + 1
  return (
    <Screen
      title={props.texts.title}
      state={it?.card}
      back={
        props.screen.read === 'again' && (
          <Back
            onBack={() => {
              screen.happens({ happens: 'she_goes_back' })
            }}
          />
        )
      }
      gestures={
        it !== undefined && (
          <div data-part="gestures">
            {it.turning_back === 'to_the_card_before' && (
              <Gesture
                kind="secondary"
                glyph="arrow_left"
                label={props.texts.to_the_card_before}
                does={taps({ happens: 'she_turns_to_the_card_before' })}
              />
            )}
            {it.skipping === 'to_the_server' && (
              <Gesture
                kind="quiet"
                label={props.texts.skip}
                does={taps({ happens: 'she_skips_it' })}
              />
            )}
            <Gesture
              kind="primary"
              glyph={it.going_on === 'to_the_next_card' ? 'arrow_right' : 'check'}
              label={going_on[it.going_on]}
              does={taps({ happens: 'she_turns_to_the_next_card' })}
            />
          </div>
        )
      }
    >
      {it !== undefined && (
        <div data-part="card" data-state={it.card}>
          <Card title={props.texts.the_cards[it.card].title}>
            <span data-part="glyph">
              <Icon glyph={the_glyph_of[it.card]} />
            </span>
            {props.texts.the_cards[it.card].says.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </Card>
          {it.card === 'how_the_letters_travel' && (
            <Flaw title={app.common.what_it_does_not_guarantee}>{props.texts.it_informs}</Flaw>
          )}
          <ol data-part="cards" aria-label={props.texts.where_she_is(number, it.the_cards.length)}>
            {it.the_cards.map((card) => (
              <li key={card} aria-current={card === it.card ? 'step' : undefined} />
            ))}
          </ol>
        </div>
      )}
    </Screen>
  )
}
