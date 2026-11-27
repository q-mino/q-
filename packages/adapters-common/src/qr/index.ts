// QRs drawn (WEB-2, INV-7; ADP-1): a text drawn as a QR's modules and in
// SVG, the same in the browser and on the relay's page. The QR's
// construction (ISO/IEC 18004) is the `qr` package's encoder (provisional, A
// to confirm); this module fixes its form and turns its answers into
// outcomes. Moved here from `adapters-web/src/qr/` in part B4 of the
// assistant (INV-7), where the reading stays: the camera is the browser's.

import encodeQR, { type QrOpts } from 'qr'

/** A QR's modules, row by row from the top, each `true` where it is dark; its quiet zone included. */
export type Modules = readonly (readonly boolean[])[]

/** The form of every QR q- draws: level M, 15% of the symbol restored; a quiet zone of four modules, ISO/IEC 18004's. */
const the_form_of_a_qr: QrOpts = { ecc: 'medium', encoding: 'byte', border: 4 }

/** The bytes the largest QR of level M holds in byte mode (version 40, ISO/IEC 18004 Table 7). */
export const the_bytes_a_qr_holds = 2331

/**
 * How many bytes a text takes in UTF-8, as the encoder writes it in byte
 * mode: by its code points, a lone surrogate as U+FFFD's three. Counted
 * here, with no `TextEncoder`: this package has neither the DOM's nor
 * Node's globals.
 */
const the_utf8_length_of = (text: string): number =>
  [...text].reduce((bytes, character) => {
    const point = character.codePointAt(0) ?? 0
    return bytes + (point < 0x80 ? 1 : point < 0x800 ? 2 : point < 0x10000 ? 3 : 4)
  }, 0)

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
  if (the_utf8_length_of(text) > the_bytes_a_qr_holds) {
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

/** The dark runs of a QR's rows as an SVG path's data, a module a unit: one rectangle a run. */
export const the_path_of = (modules: Modules): string =>
  modules
    .flatMap((row, line) =>
      runs_of(row).map((run) => {
        const [from, length] = [String(run.from), String(run.length)]
        return `M${from} ${String(line)}h${length}v1h-${length}z`
      }),
    )
    .join('')

/** Modules in SVG, a module a unit: a light square, and the dark runs of the rows in one path. */
export const the_svg_of = (modules: Modules): string => {
  const size = String(modules.length)
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">` +
    `<rect width="${size}" height="${size}" fill="#fff"/><path fill="#000" d="${the_path_of(modules)}"/></svg>`
  )
}
