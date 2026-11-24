// The server (UI-5; 1c of the notes on screens): informative, no choice. The
// relay of the configuration her letters go through, what it declares, what
// it sees and what it does not; shown once after her first face, read again
// from the menu; she goes on, to the start. Since the MVP's part 2 drawn with the
// design's components (WEB-29).

import * as the_server from '@q-mino/domains/ui/the_server/_dsl.ts'
import type * as the_server_value from '@q-mino/domains/ui/the_server/_value.ts'
import { Card, Flaw, Gesture, Screen } from '../design/index.ts'
import { a_screen, what_it_is_given } from './a_screen.ts'
import { the_app } from './the_app.ts'

/** The words of the server's screen (Alessandro, 22 Nov 2026). */
export interface TheServerTexts {
  readonly title: string
  /** Her letters go through this relay, and what it declares to be. */
  readonly it_carries_your_letters: (address: string) => string
  readonly it_sees: string
  readonly it_does_not_see: string
  /** What a relay declares, Cumino tells: it cannot verify it. */
  readonly it_is_told_not_guaranteed: string
  readonly go_on: string
}

export const TheServer = (props: { texts: TheServerTexts }) => {
  const app = the_app()
  const screen = a_screen<the_server_value.the_state, the_server_value.what_happens>(app, {
    at_the_start: the_server.at_the_start,
    after: the_server.after,
  })
  const given = what_it_is_given(
    app,
    screen.state,
    async (): Promise<the_server_value.what_it_is_given> => ({
      relay: (await app.node.the_relay()).address,
    }),
  )
  const state = screen.state.value
  const read = given.value
  const it =
    state === undefined || read === undefined
      ? undefined
      : the_server.what_it_shows(state, read.given)
  const taps = (does: () => void) => ({ does: 'taps', taps: does }) as const
  return (
    <Screen
      title={props.texts.title}
      gestures={
        it !== undefined && (
          <Gesture
            kind="primary"
            label={props.texts.go_on}
            does={taps(() => {
              screen.happens({ happens: 'she_goes_on' })
            })}
          />
        )
      }
    >
      {it !== undefined && (
        <>
          <Card>
            <p>{props.texts.it_carries_your_letters(it.relay)}</p>
            <p>{props.texts.it_sees}</p>
            <p>{props.texts.it_does_not_see}</p>
          </Card>
          <Flaw title={app.common.what_it_does_not_guarantee}>
            {props.texts.it_is_told_not_guaranteed}
          </Flaw>
        </>
      )}
    </Screen>
  )
}
