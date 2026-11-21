// an_extension (UI-5): its rendering, part 22.1 (in writing).

import type * as ui_value from '@q-mino/domains/ui/_value.ts'

/** The words of the screen (provisional, A to confirm). */
export interface AnExtensionTexts {
  readonly title: string
}

export const AnExtension = (props: {
  texts: AnExtensionTexts
  screen: Extract<ui_value.a_screen, { screen: 'an_extension' }>
}) => (
  <section aria-label={props.texts.title}>
    <h1>{props.texts.title}</h1>
  </section>
)
