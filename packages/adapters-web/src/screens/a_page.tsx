// A page of an extension (UI-4, UI-5; EXT-16; story 22 of `ui`'s README):
// its name in the kernel's mark of its extension, where its part is placed
// while the place still draws it; withdrawn or deactivated meanwhile, no
// longer there. What it shows is not drawn yet (`APartNotDrawn`, WEB-23).

import type * as ui_value from '@q-mino/domains/ui/_value.ts'
import * as a_page from '@q-mino/domains/ui/a_page/_dsl.ts'
import type * as a_page_value from '@q-mino/domains/ui/a_page/_value.ts'
import { a_screen, kept, what_it_is_given } from './a_screen.ts'
import { APartNotDrawn, Back, TheMark } from './parts.tsx'
import { the_app } from './the_app.ts'

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
  const opened = kept(() => props.screen)
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
  const state = screen.state.value
  const read = given.value
  const shown =
    state === undefined || read === undefined ? undefined : a_page.what_it_shows(state, read.given)
  return (
    <section aria-label={props.texts.title} data-state={shown?.shows}>
      <Back
        onBack={() => {
          screen.happens({ happens: 'she_goes_back' })
        }}
      />
      <h1>{props.texts.title}</h1>
      {shown?.shows === 'no_longer_there' && <p>{props.texts.no_longer_there}</p>}
      {shown?.shows === 'the_part' && (
        <TheMark extension={shown.extension}>
          <APartNotDrawn />
        </TheMark>
      )}
    </section>
  )
}
