// The glyphs of the interface (WEB-27): icons of Lucide (https://lucide.dev),
// copied as data from lucide-react 0.517.0, not imported (no dependency at
// run time: the MVP's plan, § 3). Each glyph is its shapes on a grid of
// 24, drawn by `Icon` with the stroke of its text. [Q, C, 24 Nov 2026]
//
// Lucide's licence (ISC), whose notice goes with every copy:
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

/** A shape of a glyph, by its SVG element and its attributes. */
export type AShape =
  | { readonly shape: 'path'; readonly d: string }
  | { readonly shape: 'circle'; readonly cx: string; readonly cy: string; readonly r: string }
  | {
      readonly shape: 'rect'
      readonly x: string
      readonly y: string
      readonly width: string
      readonly height: string
      readonly rx?: string
      readonly ry?: string
    }
  | {
      readonly shape: 'line'
      readonly x1: string
      readonly y1: string
      readonly x2: string
      readonly y2: string
    }
  | { readonly shape: 'polyline'; readonly points: string }

/** The glyphs, by Lucide's names (snake case): a glyph serves every use that looks like it. */
export const the_glyphs = {
  arrow_left: [
    { shape: 'path', d: 'm12 19-7-7 7-7' },
    { shape: 'path', d: 'M19 12H5' },
  ],
  arrow_right: [
    { shape: 'path', d: 'M5 12h14' },
    { shape: 'path', d: 'm12 5 7 7-7 7' },
  ],
  book_open: [
    { shape: 'path', d: 'M12 7v14' },
    {
      shape: 'path',
      d: 'M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z',
    },
  ],
  mail: [
    { shape: 'path', d: 'm22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7' },
    { shape: 'rect', x: '2', y: '4', width: '20', height: '16', rx: '2' },
  ],
  user: [
    { shape: 'path', d: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2' },
    { shape: 'circle', cx: '12', cy: '7', r: '4' },
  ],
  users: [
    { shape: 'path', d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' },
    { shape: 'path', d: 'M16 3.128a4 4 0 0 1 0 7.744' },
    { shape: 'path', d: 'M22 21v-2a4 4 0 0 0-3-3.87' },
    { shape: 'circle', cx: '9', cy: '7', r: '4' },
  ],
  qr_code: [
    { shape: 'rect', width: '5', height: '5', x: '3', y: '3', rx: '1' },
    { shape: 'rect', width: '5', height: '5', x: '16', y: '3', rx: '1' },
    { shape: 'rect', width: '5', height: '5', x: '3', y: '16', rx: '1' },
    { shape: 'path', d: 'M21 16h-3a2 2 0 0 0-2 2v3' },
    { shape: 'path', d: 'M21 21v.01' },
    { shape: 'path', d: 'M12 7v3a2 2 0 0 1-2 2H7' },
    { shape: 'path', d: 'M3 12h.01' },
    { shape: 'path', d: 'M12 3h.01' },
    { shape: 'path', d: 'M12 16v.01' },
    { shape: 'path', d: 'M16 12h1' },
    { shape: 'path', d: 'M21 12v.01' },
    { shape: 'path', d: 'M12 21v-1' },
  ],
  link: [
    { shape: 'path', d: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71' },
    { shape: 'path', d: 'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71' },
  ],
  scan_line: [
    { shape: 'path', d: 'M3 7V5a2 2 0 0 1 2-2h2' },
    { shape: 'path', d: 'M17 3h2a2 2 0 0 1 2 2v2' },
    { shape: 'path', d: 'M21 17v2a2 2 0 0 1-2 2h-2' },
    { shape: 'path', d: 'M7 21H5a2 2 0 0 1-2-2v-2' },
    { shape: 'path', d: 'M7 12h10' },
  ],
  puzzle: [
    {
      shape: 'path',
      d: 'M15.39 4.39a1 1 0 0 0 1.68-.474 2.5 2.5 0 1 1 3.014 3.015 1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 15.39a1 1 0 0 1-1.68-.474 2.5 2.5 0 1 0-3.014 3.015 1 1 0 0 1 .474 1.68l-1.683 1.682a2.414 2.414 0 0 1-3.414 0L8.61 19.61a1 1 0 0 0-1.68.474 2.5 2.5 0 1 1-3.014-3.015 1 1 0 0 0 .474-1.68l-1.683-1.682a2.414 2.414 0 0 1 0-3.414L4.39 8.61a1 1 0 0 1 1.68.474 2.5 2.5 0 1 0 3.014-3.015 1 1 0 0 1-.474-1.68l1.683-1.682a2.414 2.414 0 0 1 3.414 0z',
    },
  ],
  history: [
    { shape: 'path', d: 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8' },
    { shape: 'path', d: 'M3 3v5h5' },
    { shape: 'path', d: 'M12 7v5l4 2' },
  ],
  wifi_off: [
    { shape: 'path', d: 'M12 20h.01' },
    { shape: 'path', d: 'M8.5 16.429a5 5 0 0 1 7 0' },
    { shape: 'path', d: 'M5 12.859a10 10 0 0 1 5.17-2.69' },
    { shape: 'path', d: 'M19 12.859a10 10 0 0 0-2.007-1.523' },
    { shape: 'path', d: 'M2 8.82a15 15 0 0 1 4.177-2.643' },
    { shape: 'path', d: 'M22 8.82a15 15 0 0 0-11.288-3.764' },
    { shape: 'path', d: 'm2 2 20 20' },
  ],
  clock: [
    { shape: 'circle', cx: '12', cy: '12', r: '10' },
    { shape: 'polyline', points: '12 6 12 12 16 14' },
  ],
  circle_alert: [
    { shape: 'circle', cx: '12', cy: '12', r: '10' },
    { shape: 'line', x1: '12', x2: '12', y1: '8', y2: '12' },
    { shape: 'line', x1: '12', x2: '12.01', y1: '16', y2: '16' },
  ],
  info: [
    { shape: 'circle', cx: '12', cy: '12', r: '10' },
    { shape: 'path', d: 'M12 16v-4' },
    { shape: 'path', d: 'M12 8h.01' },
  ],
  eye: [
    {
      shape: 'path',
      d: 'M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0',
    },
    { shape: 'circle', cx: '12', cy: '12', r: '3' },
  ],
  trash_2: [
    { shape: 'path', d: 'M3 6h18' },
    { shape: 'path', d: 'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6' },
    { shape: 'path', d: 'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2' },
    { shape: 'line', x1: '10', x2: '10', y1: '11', y2: '17' },
    { shape: 'line', x1: '14', x2: '14', y1: '11', y2: '17' },
  ],
  check: [{ shape: 'path', d: 'M20 6 9 17l-5-5' }],
  x: [
    { shape: 'path', d: 'M18 6 6 18' },
    { shape: 'path', d: 'm6 6 12 12' },
  ],
  pencil: [
    {
      shape: 'path',
      d: 'M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z',
    },
    { shape: 'path', d: 'm15 5 4 4' },
  ],
  share_2: [
    { shape: 'circle', cx: '18', cy: '5', r: '3' },
    { shape: 'circle', cx: '6', cy: '12', r: '3' },
    { shape: 'circle', cx: '18', cy: '19', r: '3' },
    { shape: 'line', x1: '8.59', x2: '15.42', y1: '13.51', y2: '17.49' },
    { shape: 'line', x1: '15.41', x2: '8.59', y1: '6.51', y2: '10.49' },
  ],
  copy: [
    { shape: 'rect', width: '14', height: '14', x: '8', y: '8', rx: '2', ry: '2' },
    { shape: 'path', d: 'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2' },
  ],
  chevron_right: [{ shape: 'path', d: 'm9 18 6-6-6-6' }],
  maximize_2: [
    { shape: 'path', d: 'M15 3h6v6' },
    { shape: 'path', d: 'm21 3-7 7' },
    { shape: 'path', d: 'm3 21 7-7' },
    { shape: 'path', d: 'M9 21H3v-6' },
  ],
  minimize_2: [
    { shape: 'path', d: 'm14 10 7-7' },
    { shape: 'path', d: 'M20 10h-6V4' },
    { shape: 'path', d: 'm3 21 7-7' },
    { shape: 'path', d: 'M4 14h6v6' },
  ],
  ellipsis_vertical: [
    { shape: 'circle', cx: '12', cy: '12', r: '1' },
    { shape: 'circle', cx: '12', cy: '5', r: '1' },
    { shape: 'circle', cx: '12', cy: '19', r: '1' },
  ],
  refresh_cw: [
    { shape: 'path', d: 'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8' },
    { shape: 'path', d: 'M21 3v5h-5' },
    { shape: 'path', d: 'M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16' },
    { shape: 'path', d: 'M8 16H3v5' },
  ],
  plus: [
    { shape: 'path', d: 'M5 12h14' },
    { shape: 'path', d: 'M12 5v14' },
  ],
  hand_heart: [
    { shape: 'path', d: 'M11 14h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 16' },
    {
      shape: 'path',
      d: 'm7 20 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9',
    },
    { shape: 'path', d: 'm2 15 6 6' },
    {
      shape: 'path',
      d: 'M19.5 8.5c.7-.7 1.5-1.6 1.5-2.7A2.73 2.73 0 0 0 16 4a2.78 2.78 0 0 0-5 1.8c0 1.2.8 2 1.5 2.8L16 12Z',
    },
  ],
  /**
   * Cumino's own, not Lucide's: the logo, the cocker's head of the drawing
   * on the blackboard, on the same grid and stroke
   * (`phone/assets/logo.svg`, PWA-7). [Q, C, 25 Nov 2026]
   */
  cumino: [
    {
      shape: 'path',
      d: 'M7.8 9V15C7.8 18.3 6.6 20 5.1 20S2.4 18.3 2.5 15.5L3.1 9.6C3.5 5.3 7.2 2.5 12 2.5S20.5 5.3 20.9 9.6L21.5 15.5C21.6 18.3 20.4 20 18.9 20S16.2 18.3 16.2 15V9',
    },
    {
      shape: 'path',
      d: 'M9.4 13.2C8.9 15.5 9 18 9.8 19.8C10.5 21.4 13.5 21.4 14.2 19.8C15 18 15.1 15.5 14.6 13.2',
    },
    { shape: 'path', d: 'M10.4 10.6h.01' },
    { shape: 'path', d: 'M13.6 10.6h.01' },
    { shape: 'path', d: 'M11.2 16.8h1.6' },
  ],
} as const satisfies Readonly<Record<string, readonly AShape[]>>

/** A glyph's name. */
export type AGlyph = keyof typeof the_glyphs
