// Notice (WEB-27): what a screen tells her, by its kind, each with its
// glyph: `information`; `waiting`, a wait that is a case of the data (an
// activity in progress, a letter held: no generic loader, the MVP's plan
// § 3); `done`; `fault`, which a screen reader says at once.
// [Q, C, 24 Nov 2026]

import type { ComponentChildren } from 'preact'
import type { AGlyph } from './glyphs.ts'
import { Icon } from './icon.tsx'

/** What a notice tells. */
export type ANoticeKind = 'information' | 'waiting' | 'done' | 'fault'

const the_glyph_of: Readonly<Record<ANoticeKind, AGlyph>> = {
  information: 'info',
  waiting: 'clock',
  done: 'check',
  fault: 'circle_alert',
}

export const Notice = (props: { kind: ANoticeKind; children: ComponentChildren }) => (
  <p class="notice" data-kind={props.kind} role={props.kind === 'fault' ? 'alert' : 'status'}>
    <Icon glyph={the_glyph_of[props.kind]} />
    <span>{props.children}</span>
  </p>
)
