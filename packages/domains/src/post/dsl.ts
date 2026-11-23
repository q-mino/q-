// The post's pure functions over its values (DOM-5): the protocol's
// encodings, the identities of F7, a letter put in an envelope and opened.
// The cryptography is the safe's: the post's machine, given as a parameter
// (GR-5, GR-8, PST-3). The relay is reached through the post's mailbox port
// (GR-6, PST-10).

import { canonical_json } from '../library/index.ts'
import { value } from './_scope_dsl.ts'

type Bytes = readonly number[]

/**
 * The post's machine (GR-5, PST-3): what the safe does for the post, with a
 * face of the node's user, the one the configurator binds it to (the
 * sender's, or the one whose mailbox a letter came to). Its contents are
 * bytes in base64url, as the safe tells them. To sign and to open use the
 * face's private key: they are the safe's reads (SEA-6), answered when the
 * read is, so they give a promise (PST-10); the rest needs no secret.
 */
export interface Machine {
  /** The face's signature over a content (the safe's `a_content_signed_by_a_face`). */
  readonly sign: (content: value.some_bytes) => Promise<value.signature>
  /** A content sealed for a public key, or not: bytes that are no key one can seal for (SEA-5). */
  readonly seal_for: (
    key: value.face_key,
    content: value.some_bytes,
  ) =>
    | { readonly outcome: 'sealed'; readonly sealed_content: value.some_bytes }
    | { readonly outcome: 'not_sealed' }
  /** A sealed content opened by the face (the safe's `a_sealed_content_opened_by_a_face`). */
  readonly open: (
    sealed_content: value.some_bytes,
  ) => Promise<
    | { readonly outcome: 'opened'; readonly content: value.some_bytes }
    | { readonly outcome: 'not_opened' }
  >
  /** Whether a signature is a key's over a content (the safe's `the_signature_holds`). */
  readonly signature_holds: (
    key: value.face_key,
    content: value.some_bytes,
    signature: value.signature,
  ) => boolean
  /** BLAKE2b-256 of a content: 32 bytes. */
  readonly hash: (content: value.some_bytes) => value.identity
}

/**
 * What the relay answered a deposit, in the post's words (PST-10): it keeps
 * the envelope; it keeps one of this deposit already, an envelope sealed
 * before under the same operation (MBX-1: the relay's
 * `identity_already_used`, an envelope sealed anew for each attempt); it
 * refuses it, and why, as the relay said (MBX-1's limits); or no answer came.
 */
export type Deposited =
  | { readonly outcome: 'kept' }
  | { readonly outcome: 'kept_already' }
  | { readonly outcome: 'refused'; readonly why: string }
  | { readonly outcome: 'unreachable' }

/**
 * The post's mailbox port (GR-6, PST-10): it deposits an envelope on a
 * deposit address at its relays, under an operation of the post's
 * (`the_operation_of_a_deposit`). Over the relay's HTTP interface (step 20)
 * or the relay's oracle (`memory`): a transport, which translates the
 * relay's answer and keeps nothing. A fault of the transport (an abort)
 * throws: the executor stops its effect, unadvanced (DOM-14).
 */
export interface MailboxPort {
  readonly deposit: (deposit: {
    readonly operation: value.identity
    readonly deposit_address: value.deposit_address
    readonly relays: value.relays
    readonly envelope: value.some_bytes
  }) => Promise<Deposited>
}

// UTF-8 and base64url, with no padding (RFC 3629, RFC 4648 § 5): the domains
// have no `TextEncoder` nor `atob` (GR-8).

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

/** A text's bytes in UTF-8. */
const utf8_of = (text: string): Bytes =>
  Array.from(text).flatMap((character) => {
    const point = character.codePointAt(0) ?? 0
    if (point < 0x80) return [point]
    if (point < 0x800) return [0xc0 | (point >> 6), 0x80 | (point & 0x3f)]
    if (point < 0x10000)
      return [0xe0 | (point >> 12), 0x80 | ((point >> 6) & 0x3f), 0x80 | (point & 0x3f)]
    return [
      0xf0 | (point >> 18),
      0x80 | ((point >> 12) & 0x3f),
      0x80 | ((point >> 6) & 0x3f),
      0x80 | (point & 0x3f),
    ]
  })

/** The text of bytes in UTF-8, or nothing if they are not UTF-8 (a short or stray byte, a long form, a surrogate). */
const text_of_utf8 = (bytes: Bytes): string | undefined => {
  const points: number[] = []
  let at = 0
  while (at < bytes.length) {
    const first = bytes[at] ?? 0
    const length =
      first < 0x80 ? 1 : first >> 5 === 6 ? 2 : first >> 4 === 14 ? 3 : first >> 3 === 30 ? 4 : 0
    if (length === 0 || at + length > bytes.length) return undefined
    const rest = bytes.slice(at + 1, at + length)
    if (rest.some((byte) => byte >> 6 !== 2)) return undefined
    const lead = length === 1 ? first : first & (0xff >> (length + 1))
    const point = rest.reduce((sum, byte) => (sum << 6) | (byte & 0x3f), lead)
    const least = [0, 0, 0x80, 0x800, 0x10000][length] ?? 0
    if (point < least || point > 0x10ffff || (point >= 0xd800 && point <= 0xdfff)) return undefined
    points.push(point)
    at += length
  }
  // In pieces: an envelope's letter holds up to some 65 000 code points, too
  // many for the arguments of one call in some engines.
  return Array.from({ length: Math.ceil(points.length / 4096) }, (_, piece) =>
    String.fromCodePoint(...points.slice(piece * 4096, piece * 4096 + 4096)),
  ).join('')
}

/** Bytes told in base64url. */
const base64url_of = (bytes: Bytes): string =>
  Array.from({ length: Math.ceil(bytes.length / 3) }, (_, group) => {
    const chunk = bytes.slice(group * 3, group * 3 + 3)
    const n = ((chunk[0] ?? 0) << 16) | ((chunk[1] ?? 0) << 8) | (chunk[2] ?? 0)
    const all = [18, 12, 6, 0].map((shift) => alphabet[(n >> shift) & 63] ?? '')
    return all.slice(0, chunk.length + 1).join('')
  }).join('')

/** The bytes a base64url text tells, or nothing for a text that is no base64url. */
const bytes_of = (text: string): Bytes | undefined => {
  if (!value.some_bytes.safeParse(text).success) return undefined
  const sixes = Array.from(text, (character) => alphabet.indexOf(character))
  return Array.from({ length: Math.ceil(sixes.length / 4) }, (_, group) => {
    const chunk = sixes.slice(group * 4, group * 4 + 4)
    const n = chunk.reduce((sum, six, at) => sum | (six << (18 - 6 * at)), 0)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255].slice(0, chunk.length - 1)
  }).flat()
}

/** A JSON value told as a content: its canonical JSON (LIB-11), in UTF-8, in base64url. */
export const content_of = (json: unknown): value.some_bytes =>
  base64url_of(utf8_of(canonical_json(json)))

/** The JSON value a content tells, or nothing for bytes that are no JSON in UTF-8. */
export const json_of = (content: string): { readonly json: unknown } | undefined => {
  const bytes = bytes_of(content)
  const text = bytes === undefined ? undefined : text_of_utf8(bytes)
  if (text === undefined) return undefined
  try {
    return { json: JSON.parse(text) }
  } catch {
    return undefined
  }
}

/**
 * What a letter's face signs (PST-1): `q-letter/` then the letter's canonical
 * JSON, which holds the mailbox it is for (`to`), so that the signature
 * covers D. A ticket's secret signs `q-ticket/` then a D (BND-9): no letter's
 * signed content is one.
 */
export const the_content_a_letter_signs = (letter: value.letter): value.some_bytes =>
  base64url_of(utf8_of(`q-letter/${canonical_json(letter)}`))

/**
 * A request's identity (F7, PST-2): the hash of whose it is, the effect and
 * the entry's id, told with no ambiguity; two effects keyed by one value are
 * two requests.
 */
export const the_identity_of_a_request =
  (machine: Pick<Machine, 'hash'>) =>
  (whose: value.whose_request): value.identity =>
    machine.hash(content_of(['the_identity_of_a_request', whose]))

/**
 * A response's identity (PST-2): the hash of the request it answers, so that
 * one response, sent again, is one letter, and never meets its request's
 * identity at a relay.
 */
export const the_identity_of_the_response_to =
  (machine: Pick<Machine, 'hash'>) =>
  (request: value.identity): value.identity =>
    machine.hash(content_of(['the_identity_of_the_response_to', request]))

/**
 * The operation of a deposit at the relay (PST-10, MBX-1): the hash of what
 * is deposited, a sending of a request (its key, the identity and the
 * attempt) or a response (its identity), and the deposit address, told with
 * no ambiguity. The same deposit tried again is the same operation, whose
 * first envelope the relay keeps; two sendings are two deposits; two nodes'
 * letters of one identity, on two mailboxes, never meet.
 */
export const the_operation_of_a_deposit =
  (machine: Pick<Machine, 'hash'>) =>
  (what: string, deposit_address: value.deposit_address): value.identity =>
    machine.hash(content_of(['the_operation_of_a_deposit', what, deposit_address]))

/**
 * A letter put in an envelope for the face it goes to (PST-3): signed by the
 * machine's face, sealed for theirs; not sealed if their key takes no seal.
 */
export const a_letter_in_an_envelope =
  (machine: Pick<Machine, 'sign' | 'seal_for'>) =>
  async (letter: value.letter, their_key: value.face_key): Promise<value.sealed_letter> => {
    const signed: value.signed_letter = {
      letter: letter,
      signature: await machine.sign(the_content_a_letter_signs(letter)),
    }
    const sealing = machine.seal_for(their_key, content_of(signed))
    if (sealing.outcome === 'not_sealed') return { outcome: 'not_sealed' }
    const envelope: value.envelope = { format: 1, sealed: sealing.sealed_content }
    return { outcome: 'sealed', envelope: content_of(envelope) }
  }

/** The id of an `anonymous` letter (PER-4): the hash of its envelope, the same for the same bytes. */
export const the_id_of_an_anonymous_letter =
  (machine: Pick<Machine, 'hash'>) =>
  (envelope: value.some_bytes): value.identity =>
    machine.hash(envelope)

/**
 * An envelope that came to a mailbox, opened by the machine's face (PST-4):
 * the letter and its `Caller`, a face whose signature holds (F3), or
 * `anonymous` (PER-2, PER-4); a letter signed for another mailbox than the
 * one it came to is re-addressed, and goes no further; else why nothing came
 * out of it.
 */
export const the_letter_in_an_envelope =
  (machine: Pick<Machine, 'open' | 'signature_holds' | 'hash'>) =>
  async (came_to: value.deposit_address, envelope_text: string): Promise<value.opened_envelope> => {
    const told = json_of(envelope_text)
    const envelope = value.envelope.safeParse(told?.json)
    if (!envelope.success) return { outcome: 'not_an_envelope' }
    const opening = await machine.open(envelope.data.sealed)
    if (opening.outcome === 'not_opened') return { outcome: 'not_opened' }
    const signed = value.signed_letter.safeParse(json_of(opening.content)?.json)
    if (!signed.success) return { outcome: 'not_a_letter' }
    const letter = signed.data.letter
    const signature = signed.data.signature
    if (signature === undefined)
      return {
        outcome: 'opened',
        letter: letter,
        caller: {
          is: 'anonymous',
          id: the_id_of_an_anonymous_letter(machine)(envelope_text),
          annotation: { signature: 'none' },
        },
      }
    if (!machine.signature_holds(letter.from, the_content_a_letter_signs(letter), signature))
      return {
        outcome: 'opened',
        letter: letter,
        caller: {
          is: 'anonymous',
          id: the_id_of_an_anonymous_letter(machine)(envelope_text),
          annotation: { signature: 'does_not_hold', claimed_face: letter.from },
        },
      }
    if (letter.to !== came_to)
      return { outcome: 're_addressed', letter: letter, signed_by: letter.from }
    return { outcome: 'opened', letter: letter, caller: { is: 'a_face', key: letter.from } }
  }
