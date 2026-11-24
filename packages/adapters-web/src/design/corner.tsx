// Corner (EXT-16, WEB-30): who has the screen, in a corner of it, while an
// extension holds it (a slot on the whole screen, a page): the puzzle glyph
// and the extension's name, or, for an extension inside another, the chain
// of their names, the outermost first («Messaggi › Dadi»); and, if any, the
// gesture that gives the screen back. The kernel's, in the layer `frame`.
// [Q, C, 24 Nov 2026]

import type { ComponentChildren } from 'preact'
import { Icon } from './icon.tsx'

export const Corner = (props: {
  /** What the corner is, to a screen reader («Chi ha lo schermo»). */
  label: string
  /** The names of the extensions that hold the screen, the outermost first. */
  chain: readonly string[]
  /** The gesture that gives the screen back. */
  children?: ComponentChildren
}) => (
  <aside class="corner" aria-label={props.label}>
    <Icon glyph="puzzle" />
    <ol data-part="chain">
      {props.chain.map((name, at) => (
        <li key={at}>{name}</li>
      ))}
    </ol>
    {props.children}
  </aside>
)
