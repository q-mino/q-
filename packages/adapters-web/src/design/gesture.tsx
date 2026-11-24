// Gesture (WEB-27): what she taps, a button with its label and, if any, its
// glyph. Its kind says how much it weighs: `primary`, the one a screen
// leads to (one per screen); `secondary`, another she may do; `quiet`, one
// that steps aside (back, a detail); `dangerous`, one that deletes or
// cannot be undone; `extension`, an action of an extension's, its label
// and what it does the extension's (EXT-16), drawn in the extension's hue
// with its puzzle glyph, so that it never reads as a gesture of the kernel
// («Ping» beside «Rinomina»; WEB-30). It taps, or submits the form it is
// in. [Q, C, 24 Nov 2026]

import type { AGlyph } from './glyphs.ts'
import { Icon } from './icon.tsx'

/** How much a gesture weighs. */
export type AGestureKind = 'primary' | 'secondary' | 'quiet' | 'dangerous' | 'extension'

/** What a gesture does: a tap handled here, or the submission of its form. */
export type WhatAGestureDoes =
  { readonly does: 'taps'; readonly taps: () => void } | { readonly does: 'submits' }

export const Gesture = (props: {
  kind: AGestureKind
  label: string
  does: WhatAGestureDoes
  glyph?: AGlyph
  /** Off: it is drawn, and does nothing (what it asked is in progress, what it needs is missing). */
  off?: boolean
}) => {
  const does = props.does
  return (
    <button
      class="gesture"
      data-kind={props.kind}
      type={does.does === 'submits' ? 'submit' : 'button'}
      disabled={props.off === true}
      onClick={
        does.does === 'taps'
          ? () => {
              does.taps()
            }
          : undefined
      }
    >
      {props.kind === 'extension' ? (
        <Icon glyph="puzzle" />
      ) : (
        props.glyph !== undefined && <Icon glyph={props.glyph} />
      )}
      {props.label}
    </button>
  )
}
