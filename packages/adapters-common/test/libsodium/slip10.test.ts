import { createHmac, createPrivateKey, createPublicKey } from 'node:crypto'
import { describe, expect, test } from 'vitest'
import fc from 'fast-check'
import * as dsl from '@q-mino/domains/seals/safe/_dsl.ts'
import { libsodium_primitives } from '../../src/index.ts'

// SLIP-0010 over libsodium (SEA-2, SEA-9): the face at index i of a seed,
// `dsl.the_face_at` over libsodium's adapter, is SLIP-0010's hardened child
// `m/i'` over Ed25519. The vectors are the specification's, "Test vector 1
// for ed25519" and "Test vector 2 for ed25519" of
// https://github.com/satoshilabs/slips/blob/master/slip-0010.md, read on
// 20 Nov 2026; their public keys are written with a leading 0x00, which q-'s
// public keys, Ed25519's 32 bytes, have not. The scheme `slip10-flat` takes
// one level, so the derivation is proved at `m` (the master, the port's
// HMAC) and at `m/0H` (the face at index 0); every row's public key is
// libsodium's of its private key. q-'s seeds are 32 bytes; the vectors' 16
// and 64: the derivation does not read the seed's length.

const primitives = await libsodium_primitives()

const bytes = (hex: string): Uint8Array => Uint8Array.from(Buffer.from(hex, 'hex'))
const told = (hex: string): string => dsl.base64url_of(bytes(hex))

/** A row of a vector, as the specification writes it. */
interface Row {
  readonly chain: string
  readonly chain_code: string
  readonly private_key: string
  readonly public_key: string
}

interface Vector {
  readonly name: string
  readonly seed: string
  readonly rows: readonly [Row, Row, ...Row[]]
}

const vectors: readonly Vector[] = [
  {
    name: 'Test vector 1 for ed25519',
    seed: '000102030405060708090a0b0c0d0e0f',
    rows: [
      {
        chain: 'm',
        chain_code: '90046a93de5380a72b5e45010748567d5ea02bbf6522f979e05c0d8d8ca9fffb',
        private_key: '2b4be7f19ee27bbf30c667b642d5f4aa69fd169872f8fc3059c08ebae2eb19e7',
        public_key: '00a4b2856bfec510abab89753fac1ac0e1112364e7d250545963f135f2a33188ed',
      },
      {
        chain: 'm/0H',
        chain_code: '8b59aa11380b624e81507a27fedda59fea6d0b779a778918a2fd3590e16e9c69',
        private_key: '68e0fe46dfb67e368c75379acec591dad19df3cde26e63b93a8e704f1dade7a3',
        public_key: '008c8a13df77a28f3445213a0f432fde644acaa215fc72dcdf300d5efaa85d350c',
      },
      {
        chain: 'm/0H/1H',
        chain_code: 'a320425f77d1b5c2505a6b1b27382b37368ee640e3557c315416801243552f14',
        private_key: 'b1d0bad404bf35da785a64ca1ac54b2617211d2777696fbffaf208f746ae84f2',
        public_key: '001932a5270f335bed617d5b935c80aedb1a35bd9fc1e31acafd5372c30f5c1187',
      },
      {
        chain: 'm/0H/1H/2H',
        chain_code: '2e69929e00b5ab250f49c3fb1c12f252de4fed2c1db88387094a0f8c4c9ccd6c',
        private_key: '92a5b23c0b8a99e37d07df3fb9966917f5d06e02ddbd909c7e184371463e9fc9',
        public_key: '00ae98736566d30ed0e9d2f4486a64bc95740d89c7db33f52121f8ea8f76ff0fc1',
      },
      {
        chain: 'm/0H/1H/2H/2H',
        chain_code: '8f6d87f93d750e0efccda017d662a1b31a266e4a6f5993b15f5c1f07f74dd5cc',
        private_key: '30d1dc7e5fc04c31219ab25a27ae00b50f6fd66622f6e9c913253d6511d1e662',
        public_key: '008abae2d66361c879b900d204ad2cc4984fa2aa344dd7ddc46007329ac76c429c',
      },
      {
        chain: 'm/0H/1H/2H/2H/1000000000H',
        chain_code: '68789923a0cac2cd5a29172a475fe9e0fb14cd6adb5ad98a3fa70333e7afa230',
        private_key: '8f94d394a8e8fd6b1bc2f3f49f5c47e385281d5c17e65324b0f62483e37e8793',
        public_key: '003c24da049451555d51a7014a37337aa4e12d41e485abccfa46b47dfb2af54b7a',
      },
    ],
  },
  {
    name: 'Test vector 2 for ed25519',
    seed: 'fffcf9f6f3f0edeae7e4e1dedbd8d5d2cfccc9c6c3c0bdbab7b4b1aeaba8a5a29f9c999693908d8a8784817e7b7875726f6c696663605d5a5754514e4b484542',
    rows: [
      {
        chain: 'm',
        chain_code: 'ef70a74db9c3a5af931b5fe73ed8e1a53464133654fd55e7a66f8570b8e33c3b',
        private_key: '171cb88b1b3c1db25add599712e36245d75bc65a1a5c9e18d76f9f2b1eab4012',
        public_key: '008fe9693f8fa62a4305a140b9764c5ee01e455963744fe18204b4fb948249308a',
      },
      {
        chain: 'm/0H',
        chain_code: '0b78a3226f915c082bf118f83618a618ab6dec793752624cbeb622acb562862d',
        private_key: '1559eb2bbec5790b0c65d8693e4d0875b1747f4970ae8b650486ed7470845635',
        public_key: '0086fab68dcb57aa196c77c5f264f215a112c22a912c10d123b0d03c3c28ef1037',
      },
      {
        chain: 'm/0H/2147483647H',
        chain_code: '138f0b2551bcafeca6ff2aa88ba8ed0ed8de070841f0c4ef0165df8181eaad7f',
        private_key: 'ea4f5bfe8694d8bb74b7b59404632fd5968b774ed545e810de9c32a4fb4192f4',
        public_key: '005ba3b9ac6e90e83effcd25ac4e58a1365a9e35a3d3ae5eb07b9e4d90bcf7506d',
      },
      {
        chain: 'm/0H/2147483647H/1H',
        chain_code: '73bd9fff1cfbde33a1b846c27085f711c0fe2d66fd32e139d3ebc28e5a4a6b90',
        private_key: '3757c7577170179c7868353ada796c839135b3d30554bbb74a4b1e4a5a58505c',
        public_key: '002e66aa57069c86cc18249aecf5cb5a9cebbfd6fadeab056254763874a9352b45',
      },
      {
        chain: 'm/0H/2147483647H/1H/2147483646H',
        chain_code: '0902fe8a29f9140480a00ef244bd183e8a13288e4412d8389d140aac1794825a',
        private_key: '5837736c89570de861ebc173b1086da4f505d4adb387c6a1b1342d5e4ac9ec72',
        public_key: '00e33c0f7d81d843c572275f287498e8d408654fdf0d1e065b84e2e6f157aab09b',
      },
      {
        chain: 'm/0H/2147483647H/1H/2147483646H/2H',
        chain_code: '5d70af781f3a37b829f0d060924d5e960bdc02e85423494afc0b1a41bbe196d4',
        private_key: '551d333177df541ad876a60ea71f00447931c0a9da16f227c11ea080d7391b8d',
        public_key: '0047150c75db263559a70d5778bf36abbab30fb061ad69f69ece61a72b0cfa4fc0',
      },
    ],
  },
]

/** The bytes of "ed25519 seed", the key of SLIP-0010's master. */
const the_curve_s_seed_key = Uint8Array.from(Buffer.from('ed25519 seed', 'ascii'))

/** A public key as the specification writes it, its leading 0x00 dropped: Ed25519's 32 bytes. */
const ed25519_s = (public_key: string): string => {
  expect(public_key.slice(0, 2)).toBe('00')
  return public_key.slice(2)
}

describe('SLIP-0010 over libsodium', () => {
  for (const vector of vectors) {
    const [master, first_child] = vector.rows

    test(`${vector.name}: the master is the HMAC of the seed under "ed25519 seed"`, () => {
      expect(primitives.hmac_sha512(the_curve_s_seed_key, bytes(vector.seed))).toEqual(
        bytes(master.private_key + master.chain_code),
      )
    })

    test(`${vector.name}: the face at index 0 is ${first_child.chain}`, () => {
      expect(first_child.chain).toBe('m/0H')
      expect(dsl.the_face_at(primitives)(told(vector.seed), 0)).toEqual({
        private_key: told(first_child.private_key),
        chain_code: told(first_child.chain_code),
        public_key: told(ed25519_s(first_child.public_key)),
      })
    })

    test(`${vector.name}: each row's public key is Ed25519's of its private key`, () => {
      for (const row of vector.rows)
        expect(primitives.public_key_of(bytes(row.private_key))).toEqual(
          bytes(ed25519_s(row.public_key)),
        )
    })
  }
})

// Beyond the vectors' index 0: the face at any index of any 32-byte seed is
// the one an independent implementation derives, Node's HMAC-SHA512 and
// Ed25519 (OpenSSL's), by SLIP-0010's steps.

/** The DER prefix of an Ed25519 private key in PKCS #8 (RFC 8410), before its 32 bytes. */
const pkcs8_ed25519_prefix = Buffer.from('302e020100300506032b657004220420', 'hex')

const node_s_public_key_of = (private_key: Uint8Array): Uint8Array =>
  Uint8Array.from(
    createPublicKey(
      createPrivateKey({
        key: Buffer.concat([pkcs8_ed25519_prefix, private_key]),
        format: 'der',
        type: 'pkcs8',
      }),
    )
      .export({ format: 'der', type: 'spki' })
      .subarray(-32),
  )

const node_s_hmac = (key: Uint8Array, data: Uint8Array): Uint8Array =>
  Uint8Array.from(createHmac('sha512', key).update(data).digest())

const node_s_face_at = (seed: Uint8Array, index: number) => {
  const master = node_s_hmac(the_curve_s_seed_key, seed)
  const ser32 = Buffer.alloc(4)
  ser32.writeUInt32BE(2 ** 31 + index)
  const child = node_s_hmac(
    master.subarray(32),
    Uint8Array.from([0, ...master.subarray(0, 32), ...ser32]),
  )
  return {
    private_key: dsl.base64url_of(child.subarray(0, 32)),
    chain_code: dsl.base64url_of(child.subarray(32)),
    public_key: dsl.base64url_of(node_s_public_key_of(child.subarray(0, 32))),
  }
}

test('the face at any index is the one Node derives', () => {
  fc.assert(
    fc.property(
      fc.uint8Array({ minLength: 32, maxLength: 32 }),
      fc.integer({ min: 0, max: 2 ** 31 - 1 }),
      (seed, index) => {
        expect(dsl.the_face_at(primitives)(dsl.base64url_of(seed), index)).toEqual(
          node_s_face_at(seed, index),
        )
      },
    ),
  )
})
