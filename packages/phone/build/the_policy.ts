import type { Plugin } from 'vite'

// The app's policy (PWA-4): a `<meta>` Content-Security-Policy first in the
// page's head, written by the build (the server of development, which
// injects scripts of its own, has none). Its scripts are the app's own
// files only: the extensions it carries are integrated (EXT-13, A's
// decision of 24 Nov 2026), files of its origin on their path, so no
// script is named by its hash. [Q, C, 24 Nov 2026]

/** The app's policy: its own files, WebAssembly, the relay its only other address, no frame. */
export const the_policy_of_the_app = (relay: string): string =>
  [
    "default-src 'self'",
    // `'wasm-unsafe-eval'`: libsodium's WebAssembly compiled (SEA-9), never a script's `eval`.
    "script-src 'self' 'wasm-unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    `connect-src 'self' ${new URL(relay).origin}`,
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
  ].join('; ')

/** The policy in the page, in the build only. */
export const the_app_s_policy = (relay: string): Plugin => ({
  name: 'q-the-app-s-policy',
  apply: 'build',
  transformIndexHtml: {
    order: 'post',
    handler: () => [
      {
        tag: 'meta',
        attrs: { 'http-equiv': 'Content-Security-Policy', content: the_policy_of_the_app(relay) },
        injectTo: 'head-prepend',
      },
    ],
  },
})
