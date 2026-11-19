import type * as z from 'zod'
import { fingerprint, operation_id, type Operation } from './context.ts'
import { cursor } from './format.ts'

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

/** Whether a value is an object JSON writes as one: a plain object, no class's instance. */
const is_a_plain_object = (value: object): value is Readonly<Record<string, unknown>> => {
  const prototype: unknown = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

/** Names in the order of their UTF-16 code units (RFC 8785, 3.2.3). */
const by_code_units = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0)

/**
 * The canonical text of a value as a message carries it, JSON (RFC 8785,
 * the JSON Canonicalization Scheme): an object's members in the order of
 * their names' UTF-16 code units, a field whose value is `undefined` absent,
 * as JSON leaves it, a number as ECMAScript writes it (one text per value:
 * `1.0` and `1` are one number, `-0` is `0`), a text as `JSON.stringify`
 * escapes it. So two values equal as structures have one text, whatever the
 * order of their fields or the form of their numbers (D100). A value JSON
 * cannot write as it is (a number not finite, a bigint, a function, a
 * symbol, `undefined` in a list, an object of a class: a date, a map) stops
 * it: two different values would meet on one text.
 */
export const canonical_json = (value: unknown): string => {
  switch (typeof value) {
    case 'string':
    case 'boolean':
      return JSON.stringify(value)
    case 'number':
      if (!Number.isFinite(value)) throw new Error(`${String(value)} is no JSON number`)
      return JSON.stringify(value)
    case 'object': {
      if (value === null) return 'null'
      if (Array.isArray(value)) {
        const elements: readonly unknown[] = value
        return `[${elements
          .map((element) => {
            if (element === undefined) throw new Error('a list holds undefined, which JSON has not')
            return canonical_json(element)
          })
          .join(',')}]`
      }
      if (!is_a_plain_object(value)) {
        throw new Error('an object of a class is no JSON value: send its JSON form')
      }
      return `{${Object.keys(value)
        .toSorted(by_code_units)
        .flatMap((name) =>
          value[name] === undefined
            ? []
            : [`${JSON.stringify(name)}:${canonical_json(value[name])}`],
        )
        .join(',')}}`
    }
    case 'undefined':
    case 'bigint':
    case 'function':
    case 'symbol':
      throw new Error(`a ${typeof value} is no JSON value`)
  }
}

/**
 * A request as the retrier keeps and sends it again (D100, LIB-11): the path
 * it invokes, the node of the paper (a leaf's, or a use case's when no tree
 * is above it), and its input as sent, which the schema accepted: strict
 * (DOM-21), so holding only the fields it declares, and before its defaults.
 */
export interface Retried {
  readonly path: string
  readonly input: unknown
}

/**
 * The fingerprint of an operation (DOM-11, D100, LIB-11): computed by the
 * library where the request enters, over what the retrier keeps and sends
 * again, its path and its input as sent; compared by the command port with
 * the fingerprint of the fact the operation recorded. Two requests equal as
 * structures have one fingerprint (the canonical JSON of the input); a
 * retry is the same request, so a duplicate, whatever the release of the
 * node in between (no default, no contract version, no clock, no value the
 * node adds). Not the operation: its identity and scope are the key the
 * fingerprint is compared under (D79.4), so the fingerprint tells two
 * requests under one operation apart, and nothing more. A stable function,
 * in the stability corpus (LIB-10): a change is a migration of every fact
 * kept within a retry's window. C, 19 Nov 2026
 */
export const fingerprint_of = (request: Retried): fingerprint =>
  fingerprint.parse(digest(['fingerprint_of', request.path, canonical_json(request.input)]))

/**
 * Whether a value is one JSON writes as it is (`canonical_json`), so one a
 * fingerprint is computed over (LIB-11): an input sent as a date, a map or a
 * function is not, and no request so sent was ever recorded (PER-5).
 */
export const is_a_json_value = (value: unknown): boolean => {
  try {
    canonical_json(value)
    return true
  } catch {
    return false
  }
}

/**
 * A reaction's operation (DOM-16, D91.3, LIB-10): its scope the reaction's
 * path ("system · reaction R"), its id the digest of that path, the
 * operation that recorded the fact (DOM-10: its scope and id, the fact's
 * identity) and the part the reaction reacts to, by its position in the
 * fact (D113.3), so that a fact delivered again is the duplicate branch
 * (DOM-11): Luca retires the ladder, the consumer falls before saving its
 * position, the fact comes again, one work sheet (TST-4). The operation's
 * scope enters the digest with its id, so that two facts of two scopes
 * with one id meet on no operation. A stable function, in the stability
 * corpus: an operation derived before a change would no longer meet its
 * fact (the stay Marta's damaged return opened, `identity_of`, would be
 * another). C, 19 Nov 2026
 */
export const reaction_operation =
  (reaction: string) =>
  (delivered: { readonly operation: Operation; readonly part: number }): Operation => ({
    scope: reaction,
    id: operation_id.parse(
      digest([
        'reaction_operation',
        reaction,
        delivered.operation.scope,
        delivered.operation.id,
        String(delivered.part),
      ]),
    ),
  })

/**
 * An order key (LIB-9, D109): each field of a query's order, closed by its
 * identity, by its name, with its value as the adapter gave it, an absent
 * one with none (`[name]`).
 */
export type OrderKey = readonly (
  readonly [name: string] | readonly [name: string, value: unknown]
)[]

/** Bytes from base64url with no padding (RFC 4648, 5); none for a character not of its alphabet. */
const from_base64url = (text: string): readonly number[] | undefined => {
  const sextets = Array.from(text, (character) => alphabet.indexOf(character))
  if (sextets.some((sextet) => sextet === -1)) return undefined
  return Array.from({ length: Math.ceil(sextets.length / 4) }, (_, i) => {
    const chunk = sextets.slice(i * 4, i * 4 + 4)
    const bits =
      ((chunk[0] ?? 0) << 18) | ((chunk[1] ?? 0) << 12) | ((chunk[2] ?? 0) << 6) | (chunk[3] ?? 0)
    return [16, 8, 0].slice(0, chunk.length - 1).map((shift) => (bits >> shift) & 0xff)
  }).flat()
}

/** A text from its UTF-8 bytes; none when they are not UTF-8 (`decodeURIComponent`, ECMAScript's). */
const from_utf8 = (bytes: readonly number[]): string | undefined => {
  try {
    return decodeURIComponent(
      bytes.map((byte) => `%${byte.toString(16).padStart(2, '0')}`).join(''),
    )
  } catch {
    return undefined
  }
}

/** A JSON value from its text; none when the text is not JSON. */
const from_json = (text: string): unknown => {
  try {
    const value: unknown = JSON.parse(text)
    return value
  } catch {
    return undefined
  }
}

/** The text of an order key: the base64url of the UTF-8 of its canonical JSON. */
const text_of = (key: OrderKey): string => base64url(utf8(canonical_json(key)))

/**
 * The cursor of an order key (DOM-20, SC-22, D109): the key's fields and
 * values, in the order's order, in their canonical JSON (a list of pairs,
 * so that the order of the fields stays), in base64url, a text a client
 * carries in a message or an address. Opaque to the business, the persona
 * and the client (D57), not secret: whoever decodes it reads the values of
 * the order key. A value JSON cannot write stops it, a fault of the query's
 * order. A stable function (LIB-10): a client carries a page's cursor across
 * a release, and a process with a cursor keeps its own in its state (part
 * 7.4); its corpus, through the read port, in `test/library/read_port.test.ts`.
 * C, 19 Nov 2026
 */
export const cursor_of = (key: OrderKey): cursor => cursor.parse(text_of(key))

/**
 * The order key a cursor encodes; none for a text that is not one, as the
 * library writes it: not base64url, not UTF-8, not JSON, not a list of
 * pairs of a name and a value, or not in its one form (`cursor_of` of the
 * key gives back another text), so that one key has one cursor. Whether the
 * key is a query's order key is its reader's to check (SC-22).
 */
export const key_of = (text: string): OrderKey | undefined => {
  const bytes = from_base64url(text)
  const json = bytes === undefined ? undefined : from_utf8(bytes)
  const value = json === undefined ? undefined : from_json(json)
  if (!Array.isArray(value)) return undefined
  const pairs: readonly unknown[] = value
  const key = pairs.flatMap((pair): OrderKey => {
    if (!Array.isArray(pair)) return []
    const parts: readonly unknown[] = pair
    const [name, ...rest] = parts
    if (typeof name !== 'string' || rest.length > 1) return []
    return rest.length === 0 ? [[name]] : [[name, rest[0]]]
  })
  return key.length === pairs.length && text_of(key) === text ? key : undefined
}
