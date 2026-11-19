import type * as z from 'zod'
import type { Operation } from './context.ts'

// The stable functions of the library (LIB-10, D100): values derived from
// others that never change once released, since what they derive is kept and
// compared (an identity, a fingerprint). Pure, with no `crypto` (GR-8): a
// SHA-256 written here, over the UTF-8 of a canonical text, told in base64url.
// The stability corpus (`test/library/stable.test.ts`) is re-read at every
// run; an undeclared change is a fault.

/** The UTF-8 bytes of a text, code point by code point. */
const utf8 = (text: string): readonly number[] =>
  Array.from(text).flatMap((character) => {
    const code = character.codePointAt(0) ?? 0
    return code < 0x80
      ? [code]
      : code < 0x800
        ? [0xc0 | (code >> 6), 0x80 | (code & 0x3f)]
        : code < 0x10000
          ? [0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f)]
          : [
              0xf0 | (code >> 18),
              0x80 | ((code >> 12) & 0x3f),
              0x80 | ((code >> 6) & 0x3f),
              0x80 | (code & 0x3f),
            ]
  })

/** The round constants of SHA-256 (FIPS 180-4, 4.2.2). */
const constants: readonly number[] = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]

/** The eight words of the state. */
type State = readonly [number, number, number, number, number, number, number, number]

/** The initial state of SHA-256 (FIPS 180-4, 5.3.3). */
const initial: State = [
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
]

const rotate = (word: number, by: number): number => (word >>> by) | (word << (32 - by))

/** The message bytes padded to whole blocks of 64, with their length in bits at the end. */
const padded = (bytes: readonly number[]): readonly number[] => {
  const zeros = (64 - ((bytes.length + 9) % 64)) % 64
  const bits = bytes.length * 8
  const high = Math.floor(bits / 0x100000000)
  const length = [high, bits >>> 0].flatMap((word) => [
    (word >>> 24) & 0xff,
    (word >>> 16) & 0xff,
    (word >>> 8) & 0xff,
    word & 0xff,
  ])
  return [...bytes, 0x80, ...Array.from({ length: zeros }, () => 0), ...length]
}

/** The 64 words of a block's schedule, from its 16 words. */
const schedule = (words: readonly number[]): readonly number[] =>
  Array.from({ length: 48 }, (_, index) => index + 16).reduce<readonly number[]>((w, i) => {
    const at = (j: number): number => w[j] ?? 0
    const s0 = rotate(at(i - 15), 7) ^ rotate(at(i - 15), 18) ^ (at(i - 15) >>> 3)
    const s1 = rotate(at(i - 2), 17) ^ rotate(at(i - 2), 19) ^ (at(i - 2) >>> 10)
    return [...w, (at(i - 16) + s0 + at(i - 7) + s1) >>> 0]
  }, words)

/** One round of the compression. */
const round = (state: State, constant: number, word: number): State => {
  const [a, b, c, d, e, f, g, h] = state
  const t1 =
    (h +
      (rotate(e, 6) ^ rotate(e, 11) ^ rotate(e, 25)) +
      ((e & f) ^ (~e & g)) +
      constant +
      word) >>>
    0
  const t2 = ((rotate(a, 2) ^ rotate(a, 13) ^ rotate(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0
  return [(t1 + t2) >>> 0, a, b, c, (d + t1) >>> 0, e, f, g]
}

/** The state after a block. */
const compress = (state: State, block: readonly number[]): State => {
  const words = Array.from(
    { length: 16 },
    (_, i) =>
      (((block[i * 4] ?? 0) << 24) |
        ((block[i * 4 + 1] ?? 0) << 16) |
        ((block[i * 4 + 2] ?? 0) << 8) |
        (block[i * 4 + 3] ?? 0)) >>>
      0,
  )
  const w = schedule(words)
  const [a, b, c, d, e, f, g, h] = constants.reduce<State>(
    (current, constant, i) => round(current, constant, w[i] ?? 0),
    state,
  )
  return [
    (state[0] + a) >>> 0,
    (state[1] + b) >>> 0,
    (state[2] + c) >>> 0,
    (state[3] + d) >>> 0,
    (state[4] + e) >>> 0,
    (state[5] + f) >>> 0,
    (state[6] + g) >>> 0,
    (state[7] + h) >>> 0,
  ]
}

/** The SHA-256 of some bytes (FIPS 180-4), as 32 bytes. */
export const sha256 = (bytes: readonly number[]): readonly number[] => {
  const message = padded(bytes)
  const blocks = Array.from({ length: message.length / 64 }, (_, i) =>
    message.slice(i * 64, i * 64 + 64),
  )
  return blocks
    .reduce(compress, initial)
    .flatMap((word) => [
      (word >>> 24) & 0xff,
      (word >>> 16) & 0xff,
      (word >>> 8) & 0xff,
      word & 0xff,
    ])
}

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

/** Bytes in base64url, with no padding (RFC 4648, 5). */
const base64url = (bytes: readonly number[]): string =>
  Array.from({ length: Math.ceil(bytes.length / 3) }, (_, i) => {
    const chunk = bytes.slice(i * 3, i * 3 + 3)
    const bits = ((chunk[0] ?? 0) << 16) | ((chunk[1] ?? 0) << 8) | (chunk[2] ?? 0)
    return [18, 12, 6, 0]
      .slice(0, chunk.length + 1)
      .map((shift) => alphabet.charAt((bits >> shift) & 0x3f))
      .join('')
  }).join('')

/**
 * The stable digest of a list of texts: the SHA-256 of their JSON, which
 * tells each text whole and the list with no ambiguity, in base64url (43
 * characters). The first text names what derives it, so that two stable
 * functions never meet on one value.
 */
export const digest = (texts: readonly [string, ...string[]]): string =>
  base64url(sha256(utf8(JSON.stringify(texts))))

/**
 * The identity of the instance an operation opens, derived from the
 * operation (D75.8: the domain chooses a resource's id per operation): one
 * operation records one fact (DOM-11), so it opens one instance, and a retry
 * or a redelivery, the duplicate branch, gives back the same. It serves a
 * command whose caller cannot name the instance: a reaction, whose
 * translation reads only the fact (the repair a damaged return opens), and
 * a keeper's client alike (the repair of a drill found broken on the shelf).
 * A stable function of the library, in the stability corpus (LIB-10): the
 * operation's scope and id, in the identity's format. A string format only,
 * until a case asks for another. A, 16 Nov 2026 (4)
 *
 * The digest of the scope and the id (C, 19 Nov 2026): a fixed length, and
 * the scope (the `Caller`'s id and the hat) not told to whoever reads the
 * identity.
 */
export const identity_of =
  <identity extends z.ZodType<string>>(identity: identity) =>
  (operation: Operation): z.output<identity> =>
    identity.parse(digest(['identity_of', operation.scope, operation.id]))
