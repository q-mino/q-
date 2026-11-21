// the_handshake_at_a_distance (UI-5): its rendering, part 22.1 (in writing).

/** The words of the screen (provisional, A to confirm). */
export interface TheHandshakeAtADistanceTexts {
  readonly title: string
}

export const TheHandshakeAtADistance = (props: { texts: TheHandshakeAtADistanceTexts }) => (
  <section aria-label={props.texts.title}>
    <h1>{props.texts.title}</h1>
  </section>
)
