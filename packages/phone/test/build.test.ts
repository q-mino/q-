import { createHash } from 'node:crypto'
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative, sep } from 'node:path'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import type { TheBuild } from '../src/build_info.ts'
import { compose, the_precache_of, type AComposition } from '../build/compose.ts'
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
let composed: AComposition = { modules: 0, at_the_start: 0 }
beforeAll(async () => {
  out = mkdtempSync(join(tmpdir(), 'q-dist-'))
  composed = await compose(out, a_release)
}, 120_000)
afterAll(() => {
  rmSync(out, { recursive: true, force: true })
})

const the_files = (): string[] =>
  readdirSync(out, { recursive: true, encoding: 'utf8' })
    .filter((each) => statSync(join(out, each)).isFile())
    .map((each) => relative(out, join(out, each)).split(sep).join('/'))
const the_page = (): string => readFileSync(join(out, 'index.html'), 'utf8')
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

describe('the build', () => {
  test('one module per source, a bare specifier found by the import map, ping pong on its path', () => {
    const { imports } = the_import_map()
    for (const target of Object.values(imports)) expect(existsSync(join(out, target))).toBe(true)
    expect(imports['@q-mino/domains/ui/_value.ts']).toBe('./domains/src/ui/_value.js')
    expect(imports['@q-mino/ping_pong']).toBe('./ext/ping_pong/configurator.js')
    expect(imports['@q-mino/ping_pong/manifest.json']).toBe('./ext/ping_pong/manifest.json')
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
    expect(the_precache_of(out).files).toEqual(
      the_files()
        .filter((each) => each !== 'sw.js')
        .sort(),
    )
    expect(the_precache_of(out).files).toContain('ext/ping_pong/configurator.js')
  })
})
