// the_extensions (UI-5): its rendering, part 22.1 (in writing).

/** The words of the screen (provisional, A to confirm). */
export interface TheExtensionsTexts {
  readonly title: string
}

export const TheExtensions = (props: { texts: TheExtensionsTexts }) => (
  <section aria-label={props.texts.title}>
    <h1>{props.texts.title}</h1>
  </section>
)
