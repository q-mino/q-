// The primitives ports of the safe's stories (README of `seals`, § Stories to
// prove; SEA-5): a fake, whose answers are a rule the stories know, and two
// wrappers over any port, so that the same stories run on the fake and,
// from step 18, on libsodium's adapter (TST-1): one that records the calls
// and what they gave, one that draws the world's random bytes from a list a
// story gives, so that a story knows the seed and the R it will meet.

import type { Bytes, Opening, Primitives, Sealing } from '@q-mino/domains/seals/safe/_dsl.ts'

/** The bytes of a text, one per character: the fake's labels are ASCII. */
const ascii = (text: string): readonly number[] =>
  Array.from({ length: text.length }, (_, at) => text.charCodeAt(at) & 255)

/**
 * A digest of the fake (not a cryptographic one): `length` bytes, a function
 * of its label and of its parts, each part with its length so that two splits
 * of the same bytes differ. FNV-1a over the input, then a stream from its state.
 */
const digest =
  (label: string, ...parts: readonly Bytes[]) =>
  (length: number): Bytes => {
    const input = [
      ...ascii(label),
      ...parts.flatMap((part) => [part.length & 255, (part.length >>> 8) & 255, ...part]),
    ]
    const seeded = input.reduce((state, byte) => Math.imul(state ^ byte, 16_777_619), 2_166_136_261)
    return Uint8Array.from(
      Array.from({ length }, (_, at) => at).reduce<{ state: number; bytes: number[] }>(
        ({ state, bytes }, at) => {
          const next = Math.imul(state ^ (at + 1), 16_777_619) ^ (state >>> 15)
          return { state: next, bytes: [...bytes, (next >>> 8) & 255] }
        },
        { state: seeded, bytes: [] },
      ).bytes,
    )
  }

/** Whether two byte strings are the same. */
export const same_bytes = (a: Bytes, b: Bytes): boolean =>
  a.length === b.length && a.every((byte, at) => byte === b[at])

/** The length of the fake's tag over a sealed content. */
const the_tag_length = 16

/**
 * The bytes the fake seals nothing for, as libsodium (part 18): what is not
 * 32 bytes, and 32 zero bytes, a point of small order of Ed25519's group.
 */
export const no_public_key = (bytes: Bytes): boolean =>
  bytes.length !== 32 || bytes.every((byte) => byte === 0)

/**
 * The fake primitives port (TST-3): HMAC-SHA512 a digest of its key and its
 * data, 64 bytes; a public key a digest of its private key; a signature a
 * digest of the public key and the content, so that it holds by the public
 * key alone; a sealed box that names its public key, then the content, then a
 * tag over both, which opens only with the private key of that public key and
 * only whole, and none for what is no public key (`no_public_key`); BLAKE2b a
 * digest of its data. Its random bytes are none: a
 * story draws them from a list (`drawn_from`).
 */
export const fake_primitives: Primitives = {
  hmac_sha512: (key, data) => digest('hmac-sha512', key, data)(64),
  public_key_of: (private_key) => digest('public-key', private_key)(32),
  sign: (private_key, content) =>
    digest('signature', fake_primitives.public_key_of(private_key), content)(64),
  signature_holds: (public_key, content, signature) =>
    same_bytes(digest('signature', public_key, content)(64), signature),
  seal_for: (public_key, content): Sealing =>
    no_public_key(public_key)
      ? { outcome: 'not_sealed' }
      : {
          outcome: 'sealed',
          sealed_content: Uint8Array.from([
            ...public_key,
            ...content,
            ...digest('sealed', public_key, content)(the_tag_length),
          ]),
        },
  open: (private_key, sealed_content): Opening => {
    const public_key = fake_primitives.public_key_of(private_key)
    const named = sealed_content.slice(0, 32)
    const content = sealed_content.slice(32, sealed_content.length - the_tag_length)
    const tag = sealed_content.slice(sealed_content.length - the_tag_length)
    return sealed_content.length >= 32 + the_tag_length &&
      same_bytes(named, public_key) &&
      same_bytes(tag, digest('sealed', public_key, content)(the_tag_length))
      ? { outcome: 'opened', content }
      : { outcome: 'not_opened' }
  },
  blake2b_256: (data) => digest('blake2b-256', data)(32),
  random_bytes: () => {
    throw new Error('the fake port draws nothing: a story gives its random bytes (drawn_from)')
  },
}

/** A call to the port, as the recorder keeps it: its name, its arguments, what it gave. */
export interface Call {
  readonly name: keyof Primitives
  readonly arguments: readonly unknown[]
  readonly gave: unknown
}

/** A port that records every call to another, in order. */
export const recording = (
  primitives: Primitives,
): { readonly primitives: Primitives; readonly calls: () => readonly Call[] } => {
  const calls: Call[] = []
  const kept =
    <args extends readonly unknown[], gave>(name: keyof Primitives, call: (...a: args) => gave) =>
    (...a: args): gave => {
      const gave = call(...a)
      calls.push({ name, arguments: a, gave })
      return gave
    }
  return {
    primitives: {
      hmac_sha512: kept('hmac_sha512', primitives.hmac_sha512),
      public_key_of: kept('public_key_of', primitives.public_key_of),
      sign: kept('sign', primitives.sign),
      signature_holds: kept('signature_holds', primitives.signature_holds),
      seal_for: kept('seal_for', primitives.seal_for),
      open: kept('open', primitives.open),
      blake2b_256: kept('blake2b_256', primitives.blake2b_256),
      random_bytes: kept('random_bytes', primitives.random_bytes),
    },
    calls: () => [...calls],
  }
}

/**
 * A port whose random bytes are the world's as a story sets them (TST-3):
 * each draw the next of the list, of the length asked; a draw past the list,
 * or of another length, is a fault of the story, which throws.
 */
export const drawn_from = (
  primitives: Primitives,
): {
  readonly primitives: Primitives
  readonly will_draw: (...bytes: readonly Bytes[]) => void
} => {
  const queue: Bytes[] = []
  return {
    primitives: {
      ...primitives,
      random_bytes: (length) => {
        const next = queue.shift()
        if (next?.length !== length)
          throw new Error(`the story gives no draw of ${String(length)} bytes`)
        return next
      },
    },
    will_draw: (...bytes) => {
      queue.push(...bytes)
    },
  }
}

/** Bytes a story names: so many, each the same value. */
export const bytes_all = (value: number, length = 32): Bytes =>
  Uint8Array.from({ length }, () => value)
