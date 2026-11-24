// Strip (WEB-27): the band over every screen where the phone tells what it
// knows of the network (UI-5's strip): no network, the relay that does not
// answer. Told as a status, never as an alarm: her letters wait.
// [Q, C, 24 Nov 2026]

import type { AGlyph } from './glyphs.ts'
import { Icon } from './icon.tsx'

export const Strip = (props: { glyph: AGlyph; children: string }) => (
  <p class="strip" role="status">
    <Icon glyph={props.glyph} />
    {props.children}
  </p>
)
