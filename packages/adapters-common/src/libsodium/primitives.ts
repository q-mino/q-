// The primitives port of `seals` (GR-5, SEA-5) over libsodium (step 18,
// SEA-9): each call one of libsodium's ready constructions, translated
// (ADP-1). The same wasm in the browser and in Node (§ 6).

import sodium from 'libsodium-wrappers-sumo'
import type { Opening, Primitives, Sealing } from '@q-mino/domains/seals/safe/_dsl.ts'

/**
 * The port, once libsodium is ready. A private key is the seed of its Ed25519
 * key pair (`crypto_sign_seed_keypair`); X25519 is the form libsodium
 * converts it to, and its public key, for the sealed box. Where libsodium
 * refuses what the port is given (its -1, which the wrappers throw), the port
 * answers as its contract says: a signature does not hold, nothing is sealed,
 * nothing is opened.
 */
const over_libsodium: Primitives = {
  hmac_sha512: (key, data) => {
    // The multi-part form: the one-shot `crypto_auth_hmacsha512` takes only a
    // 32-byte key, SLIP-0010's master is under the 12 bytes of "ed25519 seed".
    const state = sodium.crypto_auth_hmacsha512_init(key)
    sodium.crypto_auth_hmacsha512_update(state, data)
    return sodium.crypto_auth_hmacsha512_final(state)
  },
  public_key_of: (private_key) => sodium.crypto_sign_seed_keypair(private_key).publicKey,
  sign: (private_key, content) =>
    sodium.crypto_sign_detached(content, sodium.crypto_sign_seed_keypair(private_key).privateKey),
  signature_holds: (public_key, content, signature) =>
    public_key.length === sodium.crypto_sign_PUBLICKEYBYTES &&
    signature.length === sodium.crypto_sign_BYTES &&
    sodium.crypto_sign_verify_detached(signature, content, public_key),
  seal_for: (public_key, content): Sealing => {
    try {
      return {
        outcome: 'sealed',
        sealed_content: sodium.crypto_box_seal(
          content,
          sodium.crypto_sign_ed25519_pk_to_curve25519(public_key),
        ),
      }
    } catch {
      // Not 32 bytes, not a point of Ed25519's group, or one of small order.
      return { outcome: 'not_sealed' }
    }
  },
  open: (private_key, sealed_content): Opening => {
    const pair = sodium.crypto_sign_seed_keypair(private_key)
    const public_key = sodium.crypto_sign_ed25519_pk_to_curve25519(pair.publicKey)
    const secret_key = sodium.crypto_sign_ed25519_sk_to_curve25519(pair.privateKey)
    try {
      return {
        outcome: 'opened',
        content: sodium.crypto_box_seal_open(sealed_content, public_key, secret_key),
      }
    } catch {
      // Too short, broken, or sealed for another key.
      return { outcome: 'not_opened' }
    }
  },
  blake2b_256: (data) => sodium.crypto_generichash(32, data, null),
  random_bytes: (length) => sodium.randombytes_buf(length),
}

/** The primitives port of `seals` over libsodium, once its wasm is loaded. */
export const libsodium_primitives = async (): Promise<Primitives> => {
  await sodium.ready
  return over_libsodium
}
