// Card (WEB-27): a part of a screen with its title, what belongs together
// (the card of a contact, its extensions, the notice of a manifest): a
// section named by its title, on a raised paper. [Q, C, 24 Nov 2026]

import type { ComponentChildren } from 'preact'

export const Card = (props: { title?: string; children: ComponentChildren }) => (
  <section class="card" aria-label={props.title}>
    {props.title !== undefined && <h2>{props.title}</h2>}
    {props.children}
  </section>
)
