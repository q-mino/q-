import { z } from 'zod'
import { date_time, is_a_json_value } from '../library/index.ts'

// The values of the post (PST-1, PST-2): the protocol between two nodes,
// above its business, `requests`. Bytes are told in base64url with no
// padding, as the safe tells them (SEA-1), so that a letter, a fact and a
// relay carry them as JSON.

/** Bytes in base64url: a length of 1 mod 4 tells no bytes. */
const bytes = () => z.string().regex(/^(?:[A-Za-z0-9_-]{4})*(?:[A-Za-z0-9_-]{2,3})?$/)

/** 32 bytes in base64url: 43 characters, the last of the 16 whose two low bits are zero. */
const thirty_two_bytes = () => z.string().regex(/^[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$/)

/** 64 bytes in base64url: 86 characters, the last of the 4 whose four low bits are zero. */
const sixty_four_bytes = () => z.string().regex(/^[A-Za-z0-9_-]{85}[AQgw]$/)

/**
 * A letter's identity (F7, DOM-11): the BLAKE2b-256 of what names it, 32
 * bytes. A request's, from whose effect it is and the entry's id; a
 * response's, from the request it answers (PST-2).
 */
export const identity = thirty_two_bytes()

/** A face's Ed25519 public key, as the safe gives it: the key that signs its letters and that letters for it are sealed for. */
export const face_key = thirty_two_bytes()

/** An Ed25519 signature over a signed content. */
export const signature = sixty_four_bytes()

/** A deposit address D, in the relay's form (MBX-1): base64url, at most 128 characters. */
export const deposit_address = z
  .string()
  .regex(/^[A-Za-z0-9_-]+$/)
  .max(128)

/** A relay's address: https, as a bond keeps it (BND-4). */
export const relay_address = z.url({ protocol: /^https$/ }).max(2048)

/** The relays of a mailbox: one in stage 1, as a bond keeps them (BND-4). */
export const relays = z.array(relay_address).min(1).max(1)

/** A mailbox to deposit on: its D and its relays. */
export const mailbox = z.strictObject({
  deposit_address: deposit_address,
  relays: relays,
})

/**
 * What a letter carries for the use case it invokes, or the event a response
 * carries: a JSON value, a claim (F2), which the leaf's schema or the
 * asker's delivery parses. Unknown to the post's types: a recursive JSON type
 * goes too deep for the library's (TS2589).
 */
export const content = z.unknown().refine(is_a_json_value, 'a JSON value')

/** The bytes of something the post gives the machine: a signed content, a sealed letter, an envelope. */
export const some_bytes = bytes().max(87_382)

/** A persona a request names, a claim the kernel's node verifies (EXT-5, PER-7). */
export const persona = z.enum(['self', 'known', 'unknown', 'anonymous'])

/** What a request invokes (EXT-5): the kernel's use case, or an extension's leaf, by its path from the persona and the version of the surface the asker speaks. */
export const invocation = z.discriminatedUnion('of', [
  z.strictObject({
    of: z.literal('the_kernel'),
    persona: persona,
    use_case: z.string().min(1).max(512),
    version: z.string().regex(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/),
  }),
  z.strictObject({
    of: z.literal('an_extension'),
    extension: z
      .string()
      .regex(/^[a-z][a-z0-9_]*$/)
      .max(64),
    persona: persona,
    use_case: z.string().min(1).max(512),
    version: z.string().regex(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/),
  }),
])

/**
 * Whose a request is (F7): the kernel composes it from the effect that asks
 * and the entry's id, the extension's name added by the kernel (EXT-12), and
 * hashes it into the request's identity.
 */
export const whose_request = z.discriminatedUnion('of', [
  z.strictObject({
    of: z.literal('an_extension'),
    extension: z.string().min(1),
    effect: z.string().min(1),
    id: z.string().min(1),
  }),
  z.strictObject({
    of: z.literal('the_kernel'),
    effect: z.string().min(1),
    id: z.string().min(1),
  }),
])

/** The schema of a letter: the one written since stage 1. */
export const letter_schema = z.literal(1)

/**
 * A request (F7, PST-1): its identity, the face that sends it, the mailbox
 * it is for (D, under the signature), its declared time (a claim, PER-13),
 * what it invokes and its input.
 */
export const request = z.strictObject({
  is: z.literal('a_request'),
  schema: letter_schema,
  identity: identity,
  from: face_key,
  to: deposit_address,
  declared_at: date_time,
  invokes: invocation,
  input: content,
})

/**
 * A response (F7, PST-1): its identity, the face that answers, the mailbox
 * it is for, its declared time, the request it answers, and the event of the
 * leaf that served it. It asks for no response.
 */
export const response = z.strictObject({
  is: z.literal('a_response'),
  schema: letter_schema,
  identity: identity,
  from: face_key,
  to: deposit_address,
  declared_at: date_time,
  answers: identity,
  event: content,
})

/** A letter: a request or a response. */
export const letter = z.discriminatedUnion('is', [request, response])

/**
 * A letter with its face's signature over its signed content (PST-1): what
 * is sealed. The signature may be missing: removing it is always possible
 * (PER-2), and the letter is then `anonymous`.
 */
export const signed_letter = z.strictObject({
  letter: letter,
  signature: signature.optional(),
})

/** The format of an envelope: the one written since stage 1. */
export const envelope_format = z.literal(1)

/** An envelope (PST-1): its format and the signed letter sealed for the face it goes to. What a relay keeps, opaque. */
export const envelope = z.strictObject({
  format: envelope_format,
  sealed: some_bytes,
})

/**
 * Why a letter is `anonymous` (PER-2): it has no signature, or one that does
 * not hold for the face it claims.
 */
export const annotation_of_an_anonymous_letter = z.discriminatedUnion('signature', [
  z.strictObject({ signature: z.literal('none') }),
  z.strictObject({ signature: z.literal('does_not_hold'), claimed_face: face_key }),
])

/**
 * Who sent a letter, as the post verified it (F3, PER-4): a face, by the key
 * whose signature holds; or `anonymous`, its id the hash of its envelope, so
 * that every envelope is an operation of its own, with why.
 */
export const caller = z.discriminatedUnion('is', [
  z.strictObject({ is: z.literal('a_face'), key: face_key }),
  z.strictObject({
    is: z.literal('anonymous'),
    id: identity,
    annotation: annotation_of_an_anonymous_letter,
  }),
])

/**
 * An envelope opened by a face of the node's user (PST-4): the letter and
 * its `Caller`; or why no letter came out of it, for the kernel's trace (F6).
 */
export const opened_envelope = z.discriminatedUnion('outcome', [
  z.strictObject({ outcome: z.literal('opened'), letter: letter, caller: caller }),
  z.strictObject({ outcome: z.literal('not_an_envelope') }),
  z.strictObject({ outcome: z.literal('not_opened') }),
  z.strictObject({ outcome: z.literal('not_a_letter') }),
  z.strictObject({ outcome: z.literal('re_addressed'), letter: letter, signed_by: face_key }),
])

/** A letter in an envelope for a face (PST-3), or not: the face's key takes no seal (a claim, F2). */
export const sealed_letter = z.discriminatedUnion('outcome', [
  z.strictObject({ outcome: z.literal('sealed'), envelope: some_bytes }),
  z.strictObject({ outcome: z.literal('not_sealed') }),
])
