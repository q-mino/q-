import fc from 'fast-check'
import type { their_ticket } from '@q-mino/domains/bonds/address_book/_value.ts'
import { base64url_of } from '../src/base64url/index.ts'
import type { AFrame, Modules } from '../src/index.ts'

// Tickets as the domain gives them, and frames as a camera gives them, for
// the tests of the link, the QR and the camera (WEB-1, WEB-2).

/** The phone's page, served by a trusted repository (its address is the configuration's). */
export const the_page = 'https://cumino.example/'

const bytes = (length: number) => fc.uint8Array({ minLength: length, maxLength: length })

/** Any ticket the domain would show: a key, a name, a mailbox on one relay, a secret. */
export const a_ticket: fc.Arbitrary<their_ticket> = fc.record({
  key: bytes(32).map(base64url_of),
  introduced_as: fc.oneof(
    fc.constantFrom('Luca', 'Zoë', 'Anna Maria', '🐕 Cumino', 'Ἀλέξανδρος'),
    fc.string({ unit: 'grapheme', minLength: 1, maxLength: 20 }),
  ),
  mailbox: fc.record({
    deposit_address: bytes(32).map(base64url_of),
    relays: fc
      .constantFrom('https://relay.cumino.example', 'https://q.example.org:8443/relay/')
      .map((relay) => [relay]),
  }),
  secret: bytes(64).map(base64url_of),
})

/** Luca's ticket, as the safe and the address book would show it. */
export const lucas_ticket: their_ticket = {
  key: base64url_of(Uint8Array.from({ length: 32 }, (_, index) => index)),
  introduced_as: 'Luca',
  mailbox: {
    deposit_address: base64url_of(Uint8Array.from({ length: 32 }, (_, index) => 255 - index)),
    relays: ['https://relay.cumino.example'],
  },
  secret: base64url_of(Uint8Array.from({ length: 64 }, (_, index) => index * 3)),
}

/** A grey frame of a size, opaque. */
const a_grey_of = (width: number, height: number): Uint8ClampedArray =>
  Uint8ClampedArray.from({ length: width * height * 4 }, (_, index) =>
    index % 4 === 3 ? 255 : 160,
  )

/**
 * A camera's frame of a QR: its modules, so many pixels each, at a place of
 * a frame of a size, on a grey background (a table, a sleeve).
 */
export const a_frame_of = (
  modules: Modules,
  at: {
    readonly pixels: number
    readonly left: number
    readonly top: number
    readonly width: number
    readonly height: number
  },
): AFrame => {
  const data = a_grey_of(at.width, at.height)
  for (let y = 0; y < at.height; y++) {
    for (let x = 0; x < at.width; x++) {
      const row = Math.floor((y - at.top) / at.pixels)
      const column = Math.floor((x - at.left) / at.pixels)
      const module = y < at.top || x < at.left ? undefined : modules[row]?.[column]
      if (module === undefined) continue
      const shade = module ? 20 : 235
      data.set([shade, shade, shade, 255], (y * at.width + x) * 4)
    }
  }
  return { width: at.width, height: at.height, data }
}

/** A frame of nothing, as a camera pointed at a wall. */
export const a_blank_frame: AFrame = {
  width: 320,
  height: 240,
  data: a_grey_of(320, 240),
}
