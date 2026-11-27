// A page of an extension (UI-4, UI-5; EXT-16; story 22 of `ui`'s README):
// its name in the kernel's mark of its extension, where its part is placed
// while the place still draws it; withdrawn or deactivated meanwhile, no
// longer there. What it shows is its part on the whole screen (`APart`, K-3, WEB-23). Since the MVP's part 2 drawn with the design's
// components (WEB-29); since its part 3 the extension holds the screen, so
// its name is in the corner, as a slot's on the whole screen (WEB-30).

import type * as ui_value from '@q-mino/domains/ui/_value.ts'
import * as a_page from '@q-mino/domains/ui/a_page/_dsl.ts'
import type * as a_page_value from '@q-mino/domains/ui/a_page/_value.ts'
import { Corner, Notice, Screen } from '../design/index.ts'
import { a_screen, kept, what_it_is_given } from './a_screen.ts'
import { APart } from './a_part.tsx'
import { Back, TheMark } from './parts.tsx'
import { the_app, the_word_or_its_fault } from './the_app.ts'

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
      {shown?.shows === 'no_longer_there' && (
        <Notice kind="information">{props.texts.no_longer_there}</Notice>
      )}
      {shown?.shows === 'the_part' && (
        <>
          <Corner
            label={app.common.the_points.the_slot.who_has_the_screen}
            chain={[
              the_word_or_its_fault(app.common, app.words(shown.extension)?.name, shown.extension),
            ]}
          />
          <TheMark extension={shown.extension}>
            <APart
              extension={shown.extension}
              point={{ point: 'page', name: shown.page }}
              told={shown.told}
              where="on_the_whole_screen"
            />
          </TheMark>
        </>
      )}
    </Screen>
  )
}
