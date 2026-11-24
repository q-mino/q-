// The app's policy (PWA-4): a `<meta>` Content-Security-Policy first in the
// page's head, written by the build (`compose.ts`). Its scripts are the
// app's own files: the extensions it carries are integrated (EXT-13, A's
// decision of 24 Nov 2026), files of its origin on their path; the one
// script named by its hash is the import map, inline (a page's import map
// cannot be a file). [Q, C, 24 Nov 2026]

/** The app's policy: its own files and its import map, WebAssembly, the relay its only other address, no frame. */
export const the_policy_of_the_app = (relay: string, the_import_map: string): string =>
  [
    "default-src 'self'",
    // `'wasm-unsafe-eval'`: libsodium's WebAssembly compiled (SEA-9), never a script's `eval`.
    `script-src 'self' 'wasm-unsafe-eval' ${the_import_map}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    `connect-src 'self' ${new URL(relay).origin}`,
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
  ].join('; ')
