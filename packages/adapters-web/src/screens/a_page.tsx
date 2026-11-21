// a_page (UI-5): its rendering, part 22.1 (in writing).

import type * as ui_value from '@q-mino/domains/ui/_value.ts'

/** The words of the screen (provisional, A to confirm). */
export interface APageTexts {
  readonly title: string
}

export const APage = (props: {
  texts: APageTexts
  screen: Extract<ui_value.a_screen, { screen: 'a_page' }>
}) => (
  <section aria-label={props.texts.title}>
    <h1>{props.texts.title}</h1>
  </section>
)
