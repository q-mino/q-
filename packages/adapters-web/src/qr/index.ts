// QRs drawn and read (WEB-2; ADP-1): a text drawn as a QR's modules and in
// SVG, and the texts read in the frames a camera gives. The QR's
// construction (ISO/IEC 18004) is the `qr` package's, encoder and decoder
// both (provisional, A to confirm); this module fixes its form and turns its
// answers into outcomes.

import encodeQR, { type QrOpts } from 'qr'
import decodeQR from 'qr/decode.js'
import type * as zz from '@q-mino/domains/library'

/** A QR's modules, row by row from the top, each `true` where it is dark; its quiet zone included. */
export type Modules = readonly (readonly boolean[])[]

/** The form of every QR q- draws: level M, 15% of the symbol restored; a quiet zone of four modules, ISO/IEC 18004's. */
const the_form_of_a_qr: QrOpts = { ecc: 'medium', encoding: 'byte', border: 4 }

/** The bytes the largest QR of level M holds in byte mode (version 40, ISO/IEC 18004 Table 7). */
export const the_bytes_a_qr_holds = 2331

/** A text drawn as a QR, or none when it is longer than a QR holds. */
export type AQr =
  | { readonly drawn: 'a_qr'; readonly modules: Modules; readonly svg: string }
  | { readonly drawn: 'nothing'; readonly because: 'the_text_is_too_long' }

/**
 * The QR of a text, its modules and the same in SVG: dark on light whatever
 * the page's colours, one path of the dark runs of each row, no scaling of
 * its own (the page sizes it).
 */
export const the_qr_of = (text: string): AQr => {
  if (new TextEncoder().encode(text).length > the_bytes_a_qr_holds) {
    return { drawn: 'nothing', because: 'the_text_is_too_long' }
  }
  const modules = encodeQR(text, 'raw', the_form_of_a_qr)
  return { drawn: 'a_qr', modules, svg: the_svg_of(modules) }
}

/** The dark runs of a row, each by its first module and its length. */
const runs_of = (
  row: readonly boolean[],
): readonly { readonly from: number; readonly length: number }[] =>
  row.reduce<{ readonly from: number; readonly length: number }[]>((runs, dark, column) => {
    if (!dark) return runs
    const last = runs.at(-1)
    return last !== undefined && last.from + last.length === column
      ? [...runs.slice(0, -1), { from: last.from, length: last.length + 1 }]
      : [...runs, { from: column, length: 1 }]
  }, [])

/** Modules in SVG, a module a unit: a light square, and the dark runs of the rows in one path. */
export const the_svg_of = (modules: Modules): string => {
  const size = String(modules.length)
  const path = modules
    .flatMap((row, line) =>
      runs_of(row).map((run) => {
        const [from, length] = [String(run.from), String(run.length)]
        return `M${from} ${String(line)}h${length}v1h-${length}z`
      }),
    )
    .join('')
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">` +
    `<rect width="${size}" height="${size}" fill="#fff"/><path fill="#000" d="${path}"/></svg>`
  )
}

/** A frame a camera gives, its pixels in RGBA, row by row (as `ImageData`). */
export interface AFrame {
  readonly width: number
  readonly height: number
  readonly data: Uint8ClampedArray
}

/** What a look through the camera sees: a frame, nothing yet (the video is not playing), or nothing more (it is off). */
export type ALook =
  | { readonly sees: 'a_frame'; readonly frame: AFrame }
  | { readonly sees: 'nothing_yet' }
  | { readonly sees: 'nothing_more' }

/** The text of the QR a frame shows, or none. */
export const the_text_in = (frame: AFrame): string | undefined => {
  try {
    return decodeQR(frame)
  } catch {
    // The decoder throws when it finds no QR in the frame, or one it cannot read.
    return undefined
  }
}

/** How often the camera is looked through: five times a second, a decode's time on a phone and some. */
export const a_look_every = 200

/**
 * The texts of the QRs seen through a camera, a look every so often by the
 * time that passes, each when it differs from the last one given: a QR held
 * in front of the camera is given once. It ends when the camera sees nothing
 * more, or when its consumer stops.
 */
export async function* the_texts_seen(
  look: () => ALook,
  elapsed: zz.Elapsed,
): AsyncGenerator<string, void, undefined> {
  let last: string | undefined
  for (let seen = look(); seen.sees !== 'nothing_more'; seen = look()) {
    const text = seen.sees === 'a_frame' ? the_text_in(seen.frame) : undefined
    if (text !== undefined && text !== last) {
      last = text
      yield text
    }
    await elapsed(a_look_every)
  }
}
