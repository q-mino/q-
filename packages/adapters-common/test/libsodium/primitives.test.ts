import { createHmac, createPrivateKey, sign as node_s_sign } from 'node:crypto'
import { describe, expect, test } from 'vitest'
import fc from 'fast-check'
import { libsodium_primitives } from '../../src/index.ts'

// libsodium's adapter on each call of the primitives port (SEA-5, SEA-9,
// TST-6): known answers from the specifications, cited each by its source,
// and the same answers as an independent implementation (Node's, OpenSSL)
// where Node has the construction. The port's other answers, where libsodium
// refuses what it is given, as the port's contract says. The safe's and the
// address book's stories run over this adapter too
// (`packages/memory/test/seals/safe.test.ts`, `bonds/address_book.test.ts`).

const primitives = await libsodium_primitives()

const bytes = (hex: string): Uint8Array => Uint8Array.from(Buffer.from(hex, 'hex'))
const ascii = (text: string): Uint8Array => Uint8Array.from(Buffer.from(text, 'ascii'))
const all = (value: number, length = 32): Uint8Array => Uint8Array.from({ length }, () => value)

/** The DER prefix of an Ed25519 private key in PKCS #8 (RFC 8410), before its 32 bytes. */
const pkcs8_ed25519_prefix = Buffer.from('302e020100300506032b657004220420', 'hex')

const node_s_ed25519_signature = (private_key: Uint8Array, content: Uint8Array): Uint8Array =>
  Uint8Array.from(
    node_s_sign(
      null,
      content,
      createPrivateKey({
        key: Buffer.concat([pkcs8_ed25519_prefix, private_key]),
        format: 'der',
        type: 'pkcs8',
      }),
    ),
  )

describe('HMAC-SHA512 over libsodium', () => {
  // RFC 4231, § 4.2 (test case 1), § 4.3 (test case 2), § 4.7 (test case 6:
  // a key longer than the block, hashed first).
  test('RFC 4231, test cases 1, 2 and 6', () => {
    expect(primitives.hmac_sha512(all(0x0b, 20), ascii('Hi There'))).toEqual(
      bytes(
        '87aa7cdea5ef619d4ff0b4241a1d6cb02379f4e2ce4ec2787ad0b30545e17cde' +
          'daa833b7d6b8a702038b274eaea3f4e4be9d914eeb61f1702e696c203a126854',
      ),
    )
    expect(primitives.hmac_sha512(ascii('Jefe'), ascii('what do ya want for nothing?'))).toEqual(
      bytes(
        '164b7a7bfcf819e2e395fbe73b56e0a387bd64222e831fd610270cd7ea250554' +
          '9758bf75c05a994a6d034f65f8f0e6fdcaeab1a34d4a6b4b636e070a38bce737',
      ),
    )
    expect(
      primitives.hmac_sha512(
        all(0xaa, 131),
        ascii('Test Using Larger Than Block-Size Key - Hash Key First'),
      ),
    ).toEqual(
      bytes(
        '80b24263c7c1a3ebb71493c1dd7be8b49b46d1f41b4aeec1121b013783f8f352' +
          '6b56d037e05f2598bd0fd2215d6a1e5295e64f73f63f0aec8b915a985d786598',
      ),
    )
  })

  test('the same as Node, for keys and data of any length', () => {
    fc.assert(
      fc.property(
        fc.uint8Array({ maxLength: 200 }),
        fc.uint8Array({ maxLength: 300 }),
        (key, data) => {
          expect(primitives.hmac_sha512(key, data)).toEqual(
            Uint8Array.from(createHmac('sha512', key).update(data).digest()),
          )
        },
      ),
    )
  })
})

describe('Ed25519 over libsodium', () => {
  // RFC 8032, § 7.1, TEST 1 (an empty message) and TEST 2 (one byte).
  const tests = [
    {
      name: 'TEST 1',
      private_key: '9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60',
      public_key: 'd75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a',
      message: '',
      signature:
        'e5564300c360ac729086e2cc806e828a84877f1eb8e5d974d873e06522490155' +
        '5fb8821590a33bacc61e39701cf9b46bd25bf5f0595bbe24655141438e7a100b',
    },
    {
      name: 'TEST 2',
      private_key: '4ccd089b28ff96da9db6c346ec114e0f5b8a319f35aba624da8cf6ed4fb8a6fb',
      public_key: '3d4017c3e843895a92b70aa74d1b7ebc9c982ccf2ec4968cc0cd55f12af4660c',
      message: '72',
      signature:
        '92a009a9f0d4cab8720e820b5f642540a2b27b5416503f8fb3762223ebdb69da' +
        '085ac1e43e15996e458f3613d0f11d8c387b2eaeb4302aeeb00d291612bb0c00',
    },
  ]

  for (const vector of tests)
    test(`RFC 8032, ${vector.name}`, () => {
      const private_key = bytes(vector.private_key)
      const public_key = bytes(vector.public_key)
      const message = bytes(vector.message)
      const signature = bytes(vector.signature)
      expect(primitives.public_key_of(private_key)).toEqual(public_key)
      expect(primitives.sign(private_key, message)).toEqual(signature)
      expect(primitives.signature_holds(public_key, message, signature)).toBe(true)
    })

  test('the same signatures as Node, which hold, and for nothing else', () => {
    fc.assert(
      fc.property(
        fc.uint8Array({ minLength: 32, maxLength: 32 }),
        fc.uint8Array({ maxLength: 300 }),
        fc.uint8Array({ minLength: 1, maxLength: 300 }),
        (private_key, content, other) => {
          const public_key = primitives.public_key_of(private_key)
          const signature = primitives.sign(private_key, content)
          expect(signature).toEqual(node_s_ed25519_signature(private_key, content))
          expect(primitives.signature_holds(public_key, content, signature)).toBe(true)
          expect(
            primitives.signature_holds(
              public_key,
              Uint8Array.from([...content, ...other]),
              signature,
            ),
          ).toBe(false)
          const broken = signature.map((byte, at) => (at === 0 ? byte ^ 1 : byte))
          expect(primitives.signature_holds(public_key, content, broken)).toBe(false)
        },
      ),
    )
  })

  test('a signature does not hold for a key or a length that is not one', () => {
    const private_key = all(1)
    const content = ascii('Anna to Bruno')
    const public_key = primitives.public_key_of(private_key)
    const signature = primitives.sign(private_key, content)
    const another = primitives.public_key_of(all(2))
    expect(primitives.signature_holds(another, content, signature)).toBe(false)
    expect(primitives.signature_holds(all(0), content, signature)).toBe(false)
    expect(primitives.signature_holds(public_key.slice(0, 31), content, signature)).toBe(false)
    expect(primitives.signature_holds(public_key, content, signature.slice(0, 63))).toBe(false)
    expect(
      primitives.signature_holds(public_key, content, Uint8Array.from([...signature, 0])),
    ).toBe(false)
  })
})

describe('the sealed box over libsodium', () => {
  test('a content sealed for a public key is opened by its private key alone, and whole', () => {
    fc.assert(
      fc.property(fc.uint8Array({ maxLength: 300 }), (content) => {
        const public_key = primitives.public_key_of(all(1))
        const sealing = primitives.seal_for(public_key, content)
        if (sealing.outcome !== 'sealed') throw new Error('a public key sealed nothing')
        // The sealed box (libsodium's crypto_box_seal): an ephemeral X25519
        // public key, then the content under a 16-byte tag.
        expect(sealing.sealed_content).toHaveLength(content.length + 48)
        expect(primitives.open(all(1), sealing.sealed_content)).toEqual({
          outcome: 'opened',
          content,
        })
        expect(primitives.open(all(2), sealing.sealed_content)).toEqual({ outcome: 'not_opened' })
        const broken = sealing.sealed_content.map((byte, at) => (at === 40 ? byte ^ 1 : byte))
        expect(primitives.open(all(1), broken)).toEqual({ outcome: 'not_opened' })
        expect(primitives.open(all(1), sealing.sealed_content.slice(0, 47))).toEqual({
          outcome: 'not_opened',
        })
      }),
      { numRuns: 30 },
    )
  })

  test('the same content sealed twice is two sealed contents', () => {
    const public_key = primitives.public_key_of(all(1))
    const content = ascii('Anna to Bruno')
    expect(primitives.seal_for(public_key, content)).not.toEqual(
      primitives.seal_for(public_key, content),
    )
  })

  test('nothing is sealed for bytes that are no public key', () => {
    const content = ascii('Anna to Bruno')
    const no_keys = [
      all(0), // a point of small order (order 4)
      Uint8Array.from([1, ...all(0, 31)]), // the neutral element
      Uint8Array.from([2, ...all(0, 31)]), // y = 2: no point has it
      all(0xff), // y not below 2^255 - 19
      all(1, 31),
      all(1, 33),
      new Uint8Array(0),
    ]
    for (const no_key of no_keys)
      expect(primitives.seal_for(no_key, content)).toEqual({ outcome: 'not_sealed' })
  })
})

describe('BLAKE2b-256 over libsodium', () => {
  // BLAKE2b (RFC 7693) with a 32-byte digest, unkeyed: the values of the
  // reference implementation as Python's hashlib gives them
  // (`hashlib.blake2b(data, digest_size=32)`).
  test('the digests of "" and "abc"', () => {
    expect(primitives.blake2b_256(new Uint8Array(0))).toEqual(
      bytes('0e5751c026e543b2e8ab2eb06099daa1d1e5df47778f7787faab45cdf12fe3a8'),
    )
    expect(primitives.blake2b_256(ascii('abc'))).toEqual(
      bytes('bddd813c634239723171ef3fee98579b94964e3bb1cb3e427262c8c068d52319'),
    )
  })
})

describe('random bytes over libsodium', () => {
  test('as many as asked, another draw other bytes', () => {
    expect(primitives.random_bytes(0)).toHaveLength(0)
    const first = primitives.random_bytes(32)
    expect(first).toHaveLength(32)
    expect(primitives.random_bytes(32)).not.toEqual(first)
  })
})
