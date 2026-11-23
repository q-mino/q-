import { createHash } from 'node:crypto'
import { the_script_inline } from '@q-mino/adapters-web'
import { build, type Plugin } from 'vite'

// The phone's build of the extensions it carries (EXT-9, EXT-13; step 25,
// PWA-3, PWA-4): each extension's realm, its entry in `src/realms/`, bundled
// into one script (an IIFE, its configurator, its library and what they
// import), which the app gives a hidden frame as its inline script; and the
// app's policy (`<meta>` Content-Security-Policy), whose `script-src` names
// each realm's script by its hash, since a frame's document (`srcdoc`)
// inherits the policy of the app's page (measured, WEB-23).

/** An extension the phone carries, its realm's entry (`src/realms/<name>.ts`). */
export interface ARealmToBundle {
  readonly name: string
  readonly entry: string
}

const the_module = 'virtual:q-realms'
const resolved = `\0${the_module}`

/** A script's hash as a policy names it (CSP3 `hash-source`), of the text as the frame holds it inline. */
export const the_hash_of = (script: string): string =>
  `'sha256-${createHash('sha256').update(the_script_inline(script), 'utf8').digest('base64')}'`

/** One realm bundled into one script, by Vite with no configuration of the app's. */
const bundled = async (entry: string): Promise<string> => {
  const built = await build({
    configFile: false,
    logLevel: 'warn',
    publicDir: false,
    build: {
      write: false,
      minify: true,
      lib: { entry, formats: ['iife'], name: 'the_realm', fileName: () => 'realm.js' },
    },
  })
  for (const each of Array.isArray(built) ? built : [built]) {
    if (!('output' in each)) continue
    for (const chunk of each.output) if (chunk.type === 'chunk' && chunk.isEntry) return chunk.code
  }
  throw new Error(`the realm ${entry} gave no script`)
}

/** The app's policy (PWA-4): its own files, the realms' scripts by hash, the relay its only other address, no frame's navigation. */
export const the_policy_of_the_app = (the_scripts: readonly string[], relay: string): string =>
  [
    "default-src 'self'",
    // `'wasm-unsafe-eval'`: libsodium's WebAssembly compiled (SEA-9), never a script's `eval`.
    ["script-src 'self' 'wasm-unsafe-eval'", ...the_scripts.map(the_hash_of)].join(' '),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    `connect-src 'self' ${new URL(relay).origin}`,
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
  ].join('; ')

/**
 * The plugins: `virtual:q-realms` (its realms' scripts by name, in dev as in
 * the build), and the policy in the page, in the build only (the server of
 * development injects scripts of its own).
 */
export const the_realms = (realms: readonly ARealmToBundle[], relay: string): Plugin[] => {
  let scripts: Promise<Readonly<Record<string, string>>> | undefined = undefined
  const the_scripts = (): Promise<Readonly<Record<string, string>>> => {
    scripts ??= Promise.all(
      realms.map(async (realm) => [realm.name, await bundled(realm.entry)] as const),
    ).then((all) => Object.fromEntries(all))
    return scripts
  }
  return [
    {
      name: 'q-realms',
      resolveId: (id) => (id === the_module ? resolved : undefined),
      load: async (id) =>
        id === resolved
          ? `export const realms = ${JSON.stringify(await the_scripts())}`
          : undefined,
    },
    {
      name: 'q-the-app-s-policy',
      apply: 'build',
      transformIndexHtml: {
        order: 'post',
        handler: async () => [
          {
            tag: 'meta',
            attrs: {
              'http-equiv': 'Content-Security-Policy',
              content: the_policy_of_the_app(Object.values(await the_scripts()), relay),
            },
            injectTo: 'head-prepend',
          },
        ],
      },
    },
  ]
}
