// QRs drawn and read (WEB-2; ADP-1): the drawing is `adapters-common`'s,
// shared with the relay's page (INV-7); here the texts read in the frames a
// camera gives. The QR's reading (ISO/IEC 18004) is the `qr` package's
// decoder (provisional, A to confirm); this module turns its answers into
// outcomes.

import decodeQR from 'qr/decode.js'
import type * as zz from '@q-mino/domains/library'

export {
  the_bytes_a_qr_holds,
  the_path_of,
  the_qr_of,
  the_svg_of,
  type AQr,
  type Modules,
} from '@q-mino/adapters-common'

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
