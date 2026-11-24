// List and Row (WEB-27): things one under the other (her contacts, the
// extensions, what happened), each a row: a glyph before it, its title and
// a detail, gestures after it. A row she opens has its title a button whose
// target is the whole row; its gestures stay their own. [Q, C, 24 Nov 2026]

import type { ComponentChildren } from 'preact'
import type { AGlyph } from './glyphs.ts'
import { Icon } from './icon.tsx'

export const List = (props: { label?: string; children: ComponentChildren }) => (
  <ul class="list" aria-label={props.label}>
    {props.children}
  </ul>
)

export const Row = (props: {
  title: string
  detail?: ComponentChildren
  glyph?: AGlyph
  /** Her gesture on the row: the row opens what it is. */
  opens?: () => void
  /** The gestures after it. */
  trail?: ComponentChildren
}) => {
  const opens = props.opens
  return (
    <li class="row">
      {props.glyph !== undefined && (
        <span data-part="lead">
          <Icon glyph={props.glyph} />
        </span>
      )}
      <div data-part="main">
        {opens === undefined ? (
          <span data-part="title">{props.title}</span>
        ) : (
          <button
            type="button"
            data-part="title"
            onClick={() => {
              opens()
            }}
          >
            {props.title}
          </button>
        )}
        {/* A space between them, for what reads the row as one text; a grid draws none. */}
        {props.detail !== undefined && ' '}
        {props.detail !== undefined && <small data-part="detail">{props.detail}</small>}
      </div>
      {props.trail !== undefined && <div data-part="trail">{props.trail}</div>}
    </li>
  )
}
