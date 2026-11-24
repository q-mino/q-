// Screen (WEB-27): the grid of a screen, its areas the strip, the head (the
// gesture back and its title), the body, and the gestures, held at the
// bottom where a thumb finds them. Its case in `data-state`, from the
// screen's ADT (WEB-18). A container: what it holds fits its width, a
// page's or a narrow slot's. [Q, C, 24 Nov 2026]

import type { ComponentChildren } from 'preact'

export const Screen = (props: {
  title: string
  /** The case of the screen, from what it shows (WEB-18); none until it is read. */
  state?: string | undefined
  /** The strip over it (`Strip`). */
  strip?: ComponentChildren
  /** The gesture back, before its title. */
  back?: ComponentChildren
  children: ComponentChildren
  /** The gestures at its bottom. */
  gestures?: ComponentChildren
}) => (
  <section class="screen" aria-label={props.title} data-state={props.state}>
    {props.strip !== undefined && <div data-part="strip">{props.strip}</div>}
    <header>
      {props.back}
      {/* Where the focus goes when the screen is opened (WEB-29), not a stop of the tab key. */}
      <h1 tabIndex={-1}>{props.title}</h1>
    </header>
    <div data-part="body">{props.children}</div>
    {props.gestures !== undefined && <footer>{props.gestures}</footer>}
  </section>
)
