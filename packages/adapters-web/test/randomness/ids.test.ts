import { describe, expect, test } from 'vitest'
import fc from 'fast-check'
import { ids_drawn_at_random, the_bytes_of_an_id } from '../../src/index.ts'
import { base64url_of, bytes_of_base64url } from '../../src/base64url/index.ts'

// The device's randomness (WEB-4): ids of 16 random bytes in base64url,
// drawn from the source the configurator gives, and the base64url the
// adapters write and read (WEB-1).

describe('ids drawn at random', () => {
  test("from the runtime's cryptography, each new, of 16 bytes in base64url", () => {
    const new_id = ids_drawn_at_random(globalThis.crypto)
    const drawn = Array.from({ length: 1000 }, () => new_id())
    expect(new Set(drawn).size).toBe(drawn.length)
    for (const id of drawn) {
      expect(id).toMatch(/^[A-Za-z0-9_-]{22}$/)
      expect(bytes_of_base64url(id)).toHaveLength(the_bytes_of_an_id)
    }
  })

  test('are the bytes the source gives, as they are', () => {
    const counting = {
      getRandomValues: (bytes: Uint8Array<ArrayBuffer>) => {
        bytes.forEach((_, index) => (bytes[index] = index))
        return bytes
      },
    }
    expect(ids_drawn_at_random(counting)()).toBe('AAECAwQFBgcICQoLDA0ODw')
  })
})

describe('base64url', () => {
  test('gives back the bytes it tells', () => {
    fc.assert(
      fc.property(fc.uint8Array({ maxLength: 300 }), (bytes) => {
        const text = base64url_of(bytes)
        expect(text).toMatch(/^[A-Za-z0-9_-]*$/)
        expect(bytes_of_base64url(text)).toEqual(bytes)
      }),
    )
  })

  test("is the RFC's, unpadded", () => {
    // RFC 4648 § 10, with § 5's alphabet and the padding left out.
    const ascii = (text: string) => new TextEncoder().encode(text)
    expect(
      ['', 'f', 'fo', 'foo', 'foob', 'fooba', 'foobar'].map((text) => base64url_of(ascii(text))),
    ).toEqual(['', 'Zg', 'Zm8', 'Zm9v', 'Zm9vYg', 'Zm9vYmE', 'Zm9vYmFy'])
    expect(base64url_of(Uint8Array.of(0xfb, 0xff))).toBe('-_8')
  })

  test('tells no bytes for a text outside its alphabet or of an impossible length', () => {
    for (const text of ['Zm9v=', 'Zm+v', 'Zm/v', 'Zm9 v', 'Z', 'Zm9vY', 'é']) {
      expect(bytes_of_base64url(text)).toBeUndefined()
    }
  })
})
