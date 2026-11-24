// Flaw (WEB-27): a flaw declared, what Cumino tells and does not guarantee
// (the project's principle: every flaw is a feature, told), always with the
// same sign, the roan's speckle and an eye, so that she knows it at a
// glance wherever it is. [Q, C, 24 Nov 2026]

import type { ComponentChildren } from 'preact'
import { Icon } from './icon.tsx'

export const Flaw = (props: { title: string; children: ComponentChildren }) => (
  <aside class="flaw" aria-label={props.title}>
    <Icon glyph="eye" />
    <div data-part="text">
      <strong>{props.title}</strong>
      <div>{props.children}</div>
    </div>
  </aside>
)
