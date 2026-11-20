// The device's randomness (WEB-4; GR-8, DOM-12, D62): the ids a node names
// before the first attempt (an operation, a bond, a face), drawn from the
// runtime's cryptographic source, which the configurator gives
// (`globalThis.crypto`). The secrets are the safe's, drawn by libsodium
// (SEA-5, SEA-9), never here.

import { base64url_of } from '../base64url/index.ts'

/** The part of the runtime's cryptography an id is drawn from (Web Crypto). */
export interface CryptographicRandomness {
  readonly getRandomValues: (bytes: Uint8Array<ArrayBuffer>) => Uint8Array<ArrayBuffer>
}

/** How many random bytes an id is: 128 bits, so that two ids drawn never meet. */
export const the_bytes_of_an_id = 16

/**
 * Ids drawn at random from the device's randomness: each call a new one, 16
 * bytes in base64url (22 characters).
 */
export const ids_drawn_at_random = (randomness: CryptographicRandomness) => (): string =>
  base64url_of(randomness.getRandomValues(new Uint8Array(the_bytes_of_an_id)))
