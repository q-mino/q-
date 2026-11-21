// what_happened (UI-5): its rendering, part 22.1 (in writing).

/** The words of the screen (provisional, A to confirm). */
export interface WhatHappenedTexts {
  readonly title: string
}

export const WhatHappened = (props: { texts: WhatHappenedTexts }) => (
  <section aria-label={props.texts.title}>
    <h1>{props.texts.title}</h1>
  </section>
)
