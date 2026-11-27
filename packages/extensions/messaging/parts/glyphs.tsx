// The chat's few glyphs (part M5), drawn by the part itself (GR-10: no kit
// of the kernel's UI pieces): beside a stage's words, never in their place
// (MSG-13), hidden from a screen reader. Shapes of Lucide
// (https://lucide.dev), as the kernel's glyphs are (`adapters-web`'s
// `design/glyphs.ts`), copied as data, with its licence's notice:
//
// ISC License
//
// Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as
// part of Feather (MIT). All other copyright (c) for Lucide are held by
// Lucide Contributors 2022.
//
// Permission to use, copy, modify, and/or distribute this software for any
// purpose with or without fee is hereby granted, provided that the above
// copyright notice and this permission notice appear in all copies.
//
// THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
// WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
// ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
// WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
// ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
// OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

import type { a_stage } from './what_it_reads.ts'

/** The glyphs of the chat, each its paths on a grid of 24. */
const the_glyphs = {
  send: [
    'M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z',
    'm21.854 2.147-10.94 10.939',
  ],
  clock: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M12 6v6l4 2'],
  check_check: ['M18 6 7 17l-5-5', 'm22 10-7.5 7.5L13 16'],
  circle_alert: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M12 8v4', 'M12 16h.01'],
  circle_minus: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M8 12h8'],
  rotate: ['M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8', 'M3 3v5h5'],
} as const

export type a_glyph = keyof typeof the_glyphs

/** A glyph, in the colour of its text, hidden from a screen reader. */
export const Glyph = (props: { glyph: a_glyph }) => (
  <svg
    data-part="glyph"
    data-glyph={props.glyph}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    {the_glyphs[props.glyph].map((d) => (
      <path key={d} d={d} />
    ))}
  </svg>
)

/** The glyph beside a stage's words: a clock on its way, a double check delivered, an alert else. */
export const the_glyph_of = (stage: a_stage): a_glyph => {
  switch (stage.stage) {
    case 'on_its_way':
      return 'clock'
    case 'delivered':
      return 'check_check'
    case 'no_receipt':
    case 'could_not_be_delivered':
    case 'held':
      return 'circle_alert'
    // Her own gesture, not a fault (part M7): called off while it waited, or its letter put aside.
    case 'called_off':
    case 'put_aside':
      return 'circle_minus'
  }
}
