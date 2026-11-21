// the_handshake_in_person (UI-5): its rendering, part 22.1 (in writing).

/** The words of the screen (provisional, A to confirm). */
export interface TheHandshakeInPersonTexts {
  readonly title: string
}

export const TheHandshakeInPerson = (props: { texts: TheHandshakeInPersonTexts }) => (
  <section aria-label={props.texts.title}>
    <h1>{props.texts.title}</h1>
  </section>
)
