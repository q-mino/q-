// The server (UI-5; 1c of the notes on screens): informative, no choice. The
// relay of the configuration her letters go through, what it declares, what
// it sees and what it does not; shown once after her first face, read again
// from the menu; she goes on, to the start.

import * as the_server from '@q-mino/domains/ui/the_server/_dsl.ts'
import type * as the_server_value from '@q-mino/domains/ui/the_server/_value.ts'
import { createMemo, Show } from 'solid-js'
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
  const shown = createMemo(() => {
    const state = screen.state()
    const read = given()
    return state === undefined || read === undefined
      ? undefined
      : the_server.what_it_shows(state, read.given)
  })
  return (
    <section aria-label={props.texts.title}>
      <h1>{props.texts.title}</h1>
      <Show when={shown()}>
        {(it) => (
          <>
            <p>{props.texts.it_carries_your_letters(it().relay)}</p>
            <p>{props.texts.it_sees}</p>
            <p>{props.texts.it_does_not_see}</p>
            <p>{props.texts.it_is_told_not_guaranteed}</p>
            <button
              type="button"
              onClick={() => {
                screen.happens({ happens: 'she_goes_on' })
              }}
            >
              {props.texts.go_on}
            </button>
          </>
        )}
      </Show>
    </section>
  )
}
