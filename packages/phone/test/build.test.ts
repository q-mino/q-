import { createHash } from 'node:crypto'
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative, sep } from 'node:path'
import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from 'vitest'
import type { TheBuild } from '../src/build_info.ts'
import {
  compose,
  the_precache_of,
  the_relay_of,
  the_release,
  type AComposition,
} from '../build/compose.ts'
import { the_policy_of_the_app } from '../build/the_policy.ts'

// The app's build with no bundler (PWA-4, PWA-5): `dist/` composed into a
// folder of the test from what `tsc` emits, then read as the browser and the
// service worker read it. The policy measured in a browser at step 25 and
// again on 24 Nov 2026 (libsodium's WebAssembly compiles; no violation).

const a_release: TheBuild = {
  version: 'v0.0.0-test',
  commit: '1111111111111111111111111111111111111111',
  committed_at: '2026-11-24T00:00:00.000Z',
  channel: 'test',
  relay: 'https://relay.cumino.test/some/path',
  base: '/q-/',
}

let out = ''
let composed: AComposition = { modules: 0, at_the_start: 0, pages: [] }
beforeAll(() => {
  out = mkdtempSync(join(tmpdir(), 'q-dist-'))
  composed = compose(out, a_release)
}, 120_000)
afterAll(() => {
  rmSync(out, { recursive: true, force: true })
})

const the_files = (): string[] =>
  readdirSync(out, { recursive: true, encoding: 'utf8' })
    .filter((each) => statSync(join(out, each)).isFile())
    .map((each) => relative(out, join(out, each)).split(sep).join('/'))
const the_page = (): string => readFileSync(join(out, 'index.html'), 'utf8')
const the_paths_precached = (): string[] => the_precache_of(out).files.map((file) => file.path)
const the_import_map = (): { readonly text: string; readonly imports: Record<string, string> } => {
  const text = /<script type="importmap">([\s\S]*?)<\/script>/.exec(the_page())?.[1] ?? ''
  const parsed: unknown = JSON.parse(text)
  const imports =
    typeof parsed === 'object' && parsed !== null && 'imports' in parsed ? parsed.imports : {}
  // cast: the build writes it, `{ imports: Record<string, string> }`, checked below by its targets.
  return { text, imports: imports as Record<string, string> }
}

describe('the app’s policy', () => {
  test('its own files and its import map, WebAssembly, the relay’s origin, no frame', () => {
    const policy = the_policy_of_the_app(a_release.relay, "'sha256-x'").split('; ')
    expect(policy).toContain("script-src 'self' 'wasm-unsafe-eval' 'sha256-x'")
    expect(policy).toContain("connect-src 'self' https://relay.cumino.test")
    expect(policy).toContain("frame-src 'none'")
    expect(policy).toContain("default-src 'self'")
    expect(policy.some((each) => each.includes("'unsafe-eval'"))).toBe(false)
  })

  test('in the page, first, with the import map’s hash its only one', () => {
    const page = the_page()
    const hash = createHash('sha256').update(the_import_map().text).digest('base64')
    const policy = /<meta http-equiv="Content-Security-Policy" content="([^"]*)"/.exec(page)?.[1]
    expect(policy).toBe(the_policy_of_the_app(a_release.relay, `'sha256-${hash}'`))
    expect(page.indexOf('Content-Security-Policy')).toBeLessThan(page.indexOf('importmap'))
    expect(policy?.match(/'sha256-/g)).toHaveLength(1)
  })
})

describe('the relay a channel declares (REL-8)', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  test('the project’s on the test and the release channels, an address of no relay locally', () => {
    expect(the_relay_of('test')).toBe('https://relay.cumino.aleclofabbro.it')
    expect(the_relay_of('release')).toBe('https://relay.cumino.aleclofabbro.it')
    expect(the_relay_of('dev')).toBe('https://relay.cumino.test')
    expect(the_policy_of_the_app(the_relay_of('test'), "'sha256-x'").split('; ')).toContain(
      "connect-src 'self' https://relay.cumino.aleclofabbro.it",
    )
  })

  test('the release reads its channel’s, or the one `Q_RELAY` names', () => {
    vi.stubEnv('Q_CHANNEL', 'test')
    vi.stubEnv('Q_RELAY', undefined)
    expect(the_release().relay).toBe('https://relay.cumino.aleclofabbro.it')
    vi.stubEnv('Q_CHANNEL', 'dev')
    expect(the_release().relay).toBe('https://relay.cumino.test')
    vi.stubEnv('Q_RELAY', 'https://another.relay.example')
    expect(the_release().relay).toBe('https://another.relay.example')
  })
})

describe('the build', () => {
  test('one module per source, a bare specifier found by the import map, ping pong and messaging on their paths', () => {
    const { imports } = the_import_map()
    for (const target of Object.values(imports)) expect(existsSync(join(out, target))).toBe(true)
    expect(imports['@q-mino/domains/ui/_value.ts']).toBe('./domains/src/ui/_value.js')
    expect(imports['@q-mino/ping_pong']).toBe('./ext/ping_pong/configurator.js')
    expect(imports['@q-mino/ping_pong/manifest.json']).toBe('./ext/ping_pong/manifest.json')
    expect(imports['@q-mino/messaging']).toBe('./ext/messaging/configurator.js')
    expect(imports['@q-mino/messaging/manifest.json']).toBe('./ext/messaging/manifest.json')
    expect(imports['libsodium-wrappers-sumo']).toMatch(
      /^\.\/vendor\/libsodium-wrappers-sumo\/.*\.mjs$/,
    )
    expect(the_files().filter((each) => /\.(m?js)$/.test(each)).length).toBeGreaterThanOrEqual(
      composed.modules,
    )
  })

  test('the start preloads its modules, not those of an extension off', () => {
    const preloaded = [...the_page().matchAll(/<link rel="modulepreload" href="\.\/([^"]+)"/g)].map(
      ([, path]) => path ?? '',
    )
    expect(preloaded).toHaveLength(composed.at_the_start)
    expect(preloaded).toContain('phone/src/main.js')
    for (const path of preloaded) expect(existsSync(join(out, path))).toBe(true)
    expect(preloaded.some((path) => path.startsWith('ext/'))).toBe(false)
  })

  test('the release’s values in build_info.js', () => {
    const info = readFileSync(join(out, 'phone', 'src', 'build_info.js'), 'utf8')
    expect(info).toContain(JSON.stringify(a_release, null, 2))
  })

  test('the service worker: a classic script, its precache every file of dist/ but its own', () => {
    const worker = readFileSync(join(out, 'sw.js'), 'utf8')
    expect(worker).not.toMatch(/^\s*(import|export)\b/m)
    const precache: unknown = JSON.parse(/^const the_precache = (.*);$/m.exec(worker)?.[1] ?? '')
    expect(precache).toEqual(the_precache_of(out))
    expect(the_paths_precached()).toEqual(
      the_files()
        .filter((each) => each !== 'sw.js')
        .sort(),
    )
    expect(the_paths_precached()).toContain('ext/ping_pong/configurator.js')
    expect(the_paths_precached()).toContain('ext/messaging/configurator.js')
  })

  test('each file precached with its hash, as a fetch’s integrity (PWA-8)', () => {
    for (const { path, integrity } of the_precache_of(out).files) {
      const hash = createHash('sha256')
        .update(readFileSync(join(out, path)))
        .digest('base64')
      expect(integrity).toBe(`sha256-${hash}`)
    }
  })
})

describe('the pages and their look (WEB-26, WEB-28)', () => {
  const the_stylesheets = (page: string): string[] =>
    [...page.matchAll(/<link rel="stylesheet" href="\.\/([^"]+)"/g)].map(([, path]) => path ?? '')

  test('the app’s page links the stylesheets, copied at their source’s path, and declares both schemes', () => {
    const page = the_page()
    const linked = the_stylesheets(page)
    expect(linked).toEqual([
      'adapters-web/src/design/styles/reset.css',
      'adapters-web/src/design/styles/tokens.css',
      'adapters-web/src/design/styles/layout.css',
      'adapters-web/src/design/styles/components.css',
      'adapters-web/src/screens/screens.css',
      'phone/src/app.css',
    ])
    for (const path of linked) expect(existsSync(join(out, path))).toBe(true)
    expect(page).toContain('<meta name="color-scheme" content="light dark" />')
    expect(page).not.toContain('<style>')
    expect(readFileSync(join(out, linked[0] ?? ''), 'utf8')).toContain(
      '@layer reset, tokens, layout, components, screens, extensions, frame;',
    )
  })

  test('off the release, the gallery: its own start, the same import map, precached', () => {
    expect(composed.pages).toEqual(['index.html', 'galleria.html'])
    const gallery = readFileSync(join(out, 'galleria.html'), 'utf8')
    const preloaded = [...gallery.matchAll(/<link rel="modulepreload" href="\.\/([^"]+)"/g)].map(
      ([, path]) => path ?? '',
    )
    expect(preloaded).toContain('phone/src/gallery/main.js')
    expect(preloaded).not.toContain('phone/src/main.js')
    expect(gallery).toContain(`<script type="importmap">${the_import_map().text}</script>`)
    for (const path of the_stylesheets(gallery)) expect(existsSync(join(out, path))).toBe(true)
    expect(the_paths_precached()).toContain('galleria.html')
  })

  test('on the release, no gallery, and the name under the icon «Cumino»', () => {
    const release = mkdtempSync(join(tmpdir(), 'q-release-'))
    try {
      const composition = compose(release, { ...a_release, channel: 'release' })
      expect(composition.pages).toEqual(['index.html'])
      const manifest: unknown = JSON.parse(
        readFileSync(join(release, 'manifest.webmanifest'), 'utf8'),
      )
      expect(manifest).toMatchObject({ name: 'Cumino', short_name: 'Cumino' })
      expect(existsSync(join(release, 'galleria.html'))).toBe(false)
      expect(existsSync(join(release, 'phone', 'src', 'gallery'))).toBe(false)
    } finally {
      rmSync(release, { recursive: true, force: true })
    }
  }, 120_000)
})

describe('the installed app (PWA-7)', () => {
  test('the manifest: the test channel’s name, the icons, a maskable one of its own, all in dist/ and precached', () => {
    const manifest: unknown = JSON.parse(readFileSync(join(out, 'manifest.webmanifest'), 'utf8'))
    expect(manifest).toMatchObject({
      name: 'Cumino prova',
      short_name: 'Cumino prova',
      background_color: '#fbf8f3',
      theme_color: '#fbf8f3',
      display: 'standalone',
      icons: [
        { src: 'icon-192.png', sizes: '192x192', purpose: 'any' },
        { src: 'icon-512.png', sizes: '512x512', purpose: 'any' },
        { src: 'icon-maskable-512.png', sizes: '512x512', purpose: 'maskable' },
        { src: 'favicon.svg', sizes: 'any', purpose: 'any' },
      ],
    })
    for (const icon of ['icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'favicon.svg']) {
      expect(the_files()).toContain(icon)
      expect(the_paths_precached()).toContain(icon)
    }
  })

  test('the page: the bar’s colour by theme, the logo as its icon', () => {
    const page = the_page()
    expect(page).toContain(
      '<meta name="theme-color" media="(prefers-color-scheme: light)" content="#fbf8f3" />',
    )
    expect(page).toContain(
      '<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#1b2023" />',
    )
    expect(page).toContain('<link rel="icon" href="./favicon.svg" type="image/svg+xml" />')
    expect(page).toContain('<title>Cumino</title>')
  })
})
