// A page of an extension (UI-4, UI-5; EXT-16; story 22 of `ui`'s README):
// its name in the kernel's mark of its extension, where its frame is placed
// while the place still draws it; withdrawn or deactivated meanwhile, no
// longer there. The frame itself is part 22.2's: here its placeholder.

import type * as ui_value from '@q-mino/domains/ui/_value.ts'
import * as a_page from '@q-mino/domains/ui/a_page/_dsl.ts'
import type * as a_page_value from '@q-mino/domains/ui/a_page/_value.ts'
import { createMemo, Match, Switch, untrack } from 'solid-js'
import { a_screen, what_it_is_given } from './a_screen.ts'
import { Back } from './parts.tsx'
import { the_app } from './the_app.ts'
import { the_marks_style } from './what_happened.tsx'

/** The words of a page (provisional, A to confirm). */
export interface APageTexts {
  readonly title: string
  readonly no_longer_there: string
}

export const APage = (props: {
  texts: APageTexts
  screen: Extract<ui_value.a_screen, { screen: 'a_page' }>
}) => {
  const app = the_app()
  const opened = untrack(() => props.screen)
  const screen = a_screen<a_page_value.the_state, a_page_value.what_happens>(app, {
    at_the_start: () => a_page.at_the_start(opened),
    after: a_page.after,
  })
  const given = what_it_is_given(
    app,
    screen.state,
    async (): Promise<a_page_value.what_it_is_given> => {
      const [extensions, offers] = await Promise.all([
        app.node.the_extensions(),
        app.node.the_offers(),
      ])
      return { extensions: [...extensions], offers }
    },
  )
  const shown = createMemo(() => {
    const state = screen.state()
    const read = given()
    return state === undefined || read === undefined
      ? undefined
      : a_page.what_it_shows(state, read.given)
  })
  const the_frame = () => {
    const it = shown()
    return it?.shows === 'the_frame' ? it : undefined
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
        <Match when={shown()?.shows === 'no_longer_there'}>
          <p>{props.texts.no_longer_there}</p>
        </Match>
        <Match when={the_frame()}>
          {(frame) => (
            <section aria-label={app.common.the_mark_of(frame().extension)} style={the_marks_style}>
              <h2>{app.common.the_mark_of(frame().extension)}</h2>
              <p>{frame().page}</p>
              <div data-the-frame={frame().page} />
            </section>
          )}
        </Match>
      </Switch>
    </section>
  )
}
