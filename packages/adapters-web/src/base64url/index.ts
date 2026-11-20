// Bytes in base64url, unpadded (RFC 4648 § 5): the alphabet of q-'s keys,
// addresses and secrets (SEA-4, BND-9), and of what the adapters carry in a
// link or an id (WEB-1, WEB-4).

/** Bytes told in base64url, unpadded. */
export const base64url_of = (bytes: Uint8Array): string =>
  btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '')

/** The bytes a text in base64url, unpadded, tells; none for a text outside its alphabet or of an impossible length. */
export const bytes_of_base64url = (text: string): Uint8Array<ArrayBuffer> | undefined => {
  if (!/^[A-Za-z0-9_-]*$/.test(text) || text.length % 4 === 1) return undefined
  const binary = atob(text.replaceAll('-', '+').replaceAll('_', '/'))
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}
