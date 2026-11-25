// The app's build with no bundler (PWA-4, A's decision of 23 Nov 2026): `tsc`
// emits one ES module per source, and this composes `dist/` from what it
// emitted. It walks the modules from the app's main, the ones a dynamic
// import reaches too (the extensions, EXT-9: on their path `ext/<name>/`),
// and writes: each module where the page finds it (as under `packages/`,
// `ext/<extension>/`, `vendor/<dependency>/`, copied from `node_modules`,
// never from a CDN); the import map, one entry per bare specifier the
// modules import (the workspace's `.ts` ones too, which `tsc` does not
// rewrite); the `modulepreload` of the modules of the start; the policy,
// the import map's hash its only one; `build_info.js`, the release's values;
// the manifest, the icons, and the service worker with the precache, every
// file but its own and its version, the hash of the files. A composition,
// not a bundle: every file is the one `tsc` or its package wrote, Preact's
// JSX too (`jsx: react-jsx`). [Q, C, 24 Nov 2026]
// The pages (WEB-26, WEB-28): the app's, `index.html`, and, on every channel
// but the release, the gallery's, `galleria.html`, from its own main; one
// import map for both (one walk from the two mains), each page preloading
// its own start; the stylesheets a page links copied from their source
// under `packages/`, at the same path, as the modules are. [Q, C, 24 Nov 2026]
//
// Usage: node build/compose.ts [--out <dir>]

import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, sep } from 'node:path'
import ts from 'typescript'
import type { TheBuild } from '../src/build_info.ts'
import { the_policy_of_the_app } from './the_policy.ts'

const the_phone = join(import.meta.dirname, '..')
const the_packages = join(the_phone, '..')
const the_repository = join(the_packages, '..')
const posix = (path: string): string => path.split(sep).join('/')

/**
 * The name under the installed icon, by channel (PWA-7): the release's
 * «Cumino»; the test site's and a local build's told apart, so that an
 * installed test app is never taken for the release.
 */
const the_name_on = (channel: TheBuild['channel']): string =>
  channel === 'release' ? 'Cumino' : channel === 'test' ? 'Cumino prova' : 'Cumino dev'

/**
 * The app's manifest (PWA-1, PWA-7), its addresses under the base: the
 * splash's ground Roano's paper (the light theme's: a manifest has one), the
 * icons the logo's on Lavagna's slate (`scripts/icons.mjs`), a maskable one
 * of its own, the logo inside its safe circle.
 */
const the_manifest = (build: TheBuild) => ({
  name: the_name_on(build.channel),
  short_name: the_name_on(build.channel),
  description: 'Cumino: lettere fra persone vere, senza un centro.',
  lang: 'it',
  start_url: build.base,
  scope: build.base,
  display: 'standalone',
  background_color: '#fbf8f3',
  theme_color: '#fbf8f3',
  icons: [
    { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
  ],
})

// --- tsc ----------------------------------------------------------------------

const files_under = (dir: string): string[] =>
  readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .map((each) => join(dir, each))
    .filter((each) => statSync(each).isFile())

/** The browser's modules emitted by `tsc` into `emitted`, the JSX compiled. */
const emits = (emitted: string): void => {
  execFileSync(
    join(the_repository, 'node_modules', '.bin', 'tsc'),
    // The types are the check's (`tsc -b`); this emits only. With the check,
    // the bare `.ts` specifiers would be reported as not rewritten (TS2877):
    // the import map resolves them.
    ['-p', join(the_phone, 'build', 'tsconfig.emit.json'), '--noCheck', '--outDir', emitted],
    { stdio: 'inherit' },
  )
}

// --- the modules' graph -------------------------------------------------------

/** What a module imports: by an import or export declaration, or by a dynamic `import()`. */
interface AnImport {
  readonly specifier: string
  readonly how: 'static' | 'dynamic'
}

const the_imports_of = (file: string, text: string): AnImport[] => {
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, false, ts.ScriptKind.JS)
  const found: AnImport[] = []
  const visits = (node: ts.Node): void => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier !== undefined &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      found.push({ specifier: node.moduleSpecifier.text, how: 'static' })
    } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const [first] = node.arguments
      if (first === undefined || !ts.isStringLiteral(first)) {
        throw new Error(`${file}: a dynamic import whose specifier is not a string`)
      }
      found.push({ specifier: first.text, how: 'dynamic' })
    }
    ts.forEachChild(node, visits)
  }
  visits(source)
  return found
}

/** The conditions of the browser's build of a dependency (no `node`, no `development`). */
const the_conditions = new Set(['browser', 'import', 'module', 'default'])

const a_record = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** The target of an export's value under the browser's conditions, in the order its keys are written. */
const the_target = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    for (const each of value) {
      const target = the_target(each)
      if (target !== undefined) return target
    }
    return undefined
  }
  if (a_record(value)) {
    for (const [condition, each] of Object.entries(value)) {
      if (the_conditions.has(condition)) {
        const target = the_target(each)
        if (target !== undefined) return target
      }
    }
  }
  return undefined
}

/** The file of a package's subpath (`.`, `./ui/_value.ts`), by its `exports`, or by its fields without. */
const the_file_of = (folder: string, subpath: string): string => {
  const manifest: unknown = JSON.parse(readFileSync(join(folder, 'package.json'), 'utf8'))
  if (!a_record(manifest)) throw new Error(`${folder}: a package.json that is not an object`)
  const exports = manifest['exports']
  const entries: Readonly<Record<string, unknown>> | undefined =
    exports === undefined
      ? undefined
      : a_record(exports) && Object.keys(exports).every((key) => key.startsWith('.'))
        ? exports
        : { '.': exports }
  if (entries === undefined) {
    const main = subpath === '.' ? (manifest['module'] ?? manifest['main']) : subpath
    if (typeof main !== 'string') throw new Error(`${folder}: no entry for ${subpath}`)
    return join(folder, main)
  }
  const exact = the_target(entries[subpath])
  if (exact !== undefined) return join(folder, exact)
  for (const [key, value] of Object.entries(entries)) {
    const star = key.indexOf('*')
    if (
      star >= 0 &&
      subpath.startsWith(key.slice(0, star)) &&
      subpath.endsWith(key.slice(star + 1))
    ) {
      const matched = subpath.slice(star, subpath.length - (key.length - star - 1))
      const target = the_target(value)
      if (target !== undefined) return join(folder, target.replace('*', matched))
    }
  }
  throw new Error(`${folder}: ${subpath} is not exported`)
}

/** A bare specifier's package and subpath: `@q-mino/domains/ui/_value.ts` is `@q-mino/domains`, `./ui/_value.ts`. */
const the_parts_of = (specifier: string): { readonly name: string; readonly subpath: string } => {
  const parts = specifier.split('/')
  const length = specifier.startsWith('@') ? 2 : 1
  const rest = parts.slice(length).join('/')
  return { name: parts.slice(0, length).join('/'), subpath: rest === '' ? '.' : `./${rest}` }
}

/** The folder of a package as Node finds it from a folder: `node_modules/<name>`, going up. */
const the_package = (from: string, name: string): string => {
  for (let dir = from; ; dir = dirname(dir)) {
    const candidate = join(dir, 'node_modules', name)
    if (existsSync(join(candidate, 'package.json'))) return realpathSync(candidate)
    if (dirname(dir) === dir) throw new Error(`${name} not found from ${from}`)
  }
}

/**
 * The package a file of `node_modules` is in: the folder right under the
 * last `node_modules` of its path (`@scope/name` or `name`), so that a
 * subpath with a package.json of its own (`preact/hooks`) stays under its
 * package's name.
 */
const the_vendored_name = (file: string): { readonly name: string; readonly folder: string } => {
  const parts = file.split(sep)
  const at = parts.lastIndexOf('node_modules')
  const first = parts[at + 1]
  if (at < 0 || first === undefined) throw new Error(`no package for ${file}`)
  const length = first.startsWith('@') ? 2 : 1
  return {
    name: parts.slice(at + 1, at + 1 + length).join('/'),
    folder: parts.slice(0, at + 1 + length).join(sep),
  }
}

/** A module of the page: the file it is read from, the path it is served at. */
interface AModule {
  readonly file: string
  readonly path: string
}

/**
 * Where the page finds a file: what `tsc` emitted at the path of its source
 * under `packages/` (`domains/src/…`), an extension's under `ext/<name>/`,
 * at the same depth as `extensions/<name>/`, so that a relative import
 * between packages (the generated files' import of the library) finds the
 * same file; a dependency's file under `vendor/<name>/`.
 */
const the_path_of = (emitted: string, file: string): string => {
  // A file of the workspace not emitted is one of its JSON, served as it is.
  const of_the_workspace = [relative(emitted, file), relative(the_packages, file)]
    .map(posix)
    .find((path) => !path.startsWith('..') && !path.includes('node_modules/'))
  if (of_the_workspace !== undefined) {
    return of_the_workspace.startsWith('extensions/')
      ? `ext/${of_the_workspace.slice('extensions/'.length)}`
      : of_the_workspace
  }
  const { name, folder } = the_vendored_name(file)
  return `vendor/${name}/${posix(relative(folder, file))}`
}

/** The emitted file of a source of the workspace (`packages/<…>.ts(x)` → `<emitted>/<…>.js`). */
const the_emitted_of = (emitted: string, source: string): string => {
  const path = join(emitted, relative(the_packages, source))
  if (source.endsWith('.json')) return existsSync(path) ? path : source
  return path.replace(/\.tsx?$/, '.js')
}

/** The source a file emitted by `tsc` comes from, for its `node_modules`: its package's folder. */
const the_folder_of_the_source = (emitted: string, file: string): string =>
  dirname(join(the_packages, relative(emitted, file)))

/** The modules of the pages from their mains, the import map that finds the bare ones, what each module imports statically. */
interface TheGraph {
  readonly modules: ReadonlyMap<string, AModule>
  readonly imports: ReadonlyMap<string, string>
  readonly statics: ReadonlyMap<string, readonly string[]>
}

const walks = (emitted: string, mains: readonly string[]): TheGraph => {
  const modules = new Map<string, AModule>()
  const imports = new Map<string, string>()
  const statics = new Map<string, string[]>()
  const pending = [...mains]
  for (let file = pending.pop(); file !== undefined; file = pending.pop()) {
    if (modules.has(file)) continue
    const path = the_path_of(emitted, file)
    modules.set(file, { file, path })
    statics.set(file, [])
    if (file.endsWith('.json')) continue
    const in_emitted = !relative(emitted, file).startsWith('..')
    for (const { specifier, how } of the_imports_of(file, readFileSync(file, 'utf8'))) {
      const target = specifier.startsWith('.')
        ? join(dirname(file), specifier)
        : (() => {
            const { name, subpath } = the_parts_of(specifier)
            const folder = the_package(
              in_emitted ? the_folder_of_the_source(emitted, file) : dirname(file),
              name,
            )
            const resolved = the_file_of(folder, subpath)
            const it = relative(the_packages, resolved).startsWith('..')
              ? resolved
              : the_emitted_of(emitted, resolved)
            const served = `./${the_path_of(emitted, it)}`
            const known = imports.get(specifier)
            if (known !== undefined && known !== served) {
              throw new Error(
                `${specifier} is two files, ${known} and ${served}: the map needs scopes`,
              )
            }
            imports.set(specifier, served)
            return it
          })()
      if (!existsSync(target))
        throw new Error(`${file} imports ${specifier}: ${target} does not exist`)
      // A relative import is found by the page only if the two files keep their places.
      if (
        specifier.startsWith('.') &&
        posix(join(dirname(path), specifier)) !== the_path_of(emitted, target)
      ) {
        throw new Error(`${path} imports ${specifier}, served at ${the_path_of(emitted, target)}`)
      }
      if (how === 'static') statics.get(file)?.push(target)
      pending.push(target)
    }
  }
  const paths = new Set([...modules.values()].map((each) => each.path))
  if (paths.size !== modules.size)
    throw new Error('two files at one path: two versions of a dependency')
  return { modules, imports, statics }
}

/** The paths of the modules a page's main reaches statically: its start, which it preloads. */
const the_start_of = (graph: TheGraph, main: string): readonly string[] => {
  const at_the_start = new Set<string>()
  const from_main = [main]
  for (let file = from_main.pop(); file !== undefined; file = from_main.pop()) {
    if (at_the_start.has(file)) continue
    at_the_start.add(file)
    from_main.push(...(graph.statics.get(file) ?? []))
  }
  return [...at_the_start].flatMap((file) => {
    const module = graph.modules.get(file)
    return module === undefined || file.endsWith('.json') ? [] : [module.path]
  })
}

/** A page of `dist/`: its template in the phone's folder, its main as `tsc` emits it. */
interface APage {
  readonly template: string
  readonly main: string
}

/** The app's page, and, but on the release's channel, the gallery's (WEB-28). */
const the_pages_of = (build: TheBuild): readonly APage[] => [
  { template: 'index.html', main: 'phone/src/main.js' },
  ...(build.channel === 'release'
    ? []
    : [{ template: 'galleria.html', main: 'phone/src/gallery/main.js' }]),
]

// --- the page and the worker ---------------------------------------------------

/** The hash of a file, base64 for the policy, hex for the precache. */
const sha256 = (text: string | Buffer) => createHash('sha256').update(text)

/** The marker of the page's template where the build puts the policy, the import map and the preloads. */
const the_marker = '<!-- composed by build/compose.ts -->'

const the_page = (
  name: string,
  build: TheBuild,
  graph: TheGraph,
  at_the_start: readonly string[],
): string => {
  const template = readFileSync(join(the_phone, name), 'utf8')
  if (!template.includes(the_marker)) throw new Error(`${name} has no ${the_marker}`)
  const map = JSON.stringify(
    { imports: Object.fromEntries([...graph.imports].sort(([a], [b]) => a.localeCompare(b))) },
    null,
    2,
  )
  const hash = `'sha256-${sha256(map).digest('base64')}'`
  const policy = the_policy_of_the_app(build.relay, hash)
  return template.replace(
    the_marker,
    [
      `<meta http-equiv="Content-Security-Policy" content="${policy}" />`,
      `<script type="importmap">${map}</script>`,
      ...[...at_the_start].sort().map((path) => `<link rel="modulepreload" href="./${path}" />`),
    ].join('\n    '),
  )
}

/**
 * The stylesheets a page links (`<link rel="stylesheet" href="./…">`), by
 * their path in `dist/`, which is their source's under `packages/` (WEB-26).
 */
const the_stylesheets_of = (page: string): readonly string[] =>
  [...page.matchAll(/<link rel="stylesheet" href="\.\/([^"]+)"/g)].map(([, path]) => {
    if (path === undefined || path.split('/').includes('..')) {
      throw new Error(`a stylesheet out of packages/: ${String(path)}`)
    }
    return path
  })

/** The service worker, a classic script: the precache, then `src/sw/sw.ts` compiled, with no import or export. */
const the_worker = (precache: { readonly version: string; readonly files: readonly string[] }) => {
  const source = readFileSync(join(the_phone, 'src', 'sw', 'sw.ts'), 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2024, module: ts.ModuleKind.ESNext },
  }).outputText
  const script = compiled.replace(/^export \{\};\n?$/m, '')
  if (/^\s*(import|export)\b/m.test(script))
    throw new Error('the service worker imports or exports')
  return `const the_precache = ${JSON.stringify(precache)};\n${script}`
}

/** The precache of a `dist/`: every file but the worker's, its version the hash of all of them. */
export const the_precache_of = (out: string) => {
  const files = files_under(out)
    .map((file) => posix(relative(out, file)))
    .filter((path) => path !== 'sw.js')
    .sort()
  const all = sha256('')
  for (const path of files)
    all.update(`${path}\0${sha256(readFileSync(join(out, path))).digest('hex')}\n`)
  return { version: all.digest('hex').slice(0, 16), files }
}

/** What a composition wrote: the module count, how many of them the app's start preloads, its pages. */
export interface AComposition {
  readonly modules: number
  readonly at_the_start: number
  readonly pages: readonly string[]
}

/** `dist/` composed, into `out`, for a release. */
export const compose = (out: string, build: TheBuild): AComposition => {
  const emitted = mkdtempSync(join(tmpdir(), 'q-emit-'))
  try {
    emits(emitted)
    const pages = the_pages_of(build).map((page) => ({ ...page, main: join(emitted, page.main) }))
    const graph = walks(
      emitted,
      pages.map((page) => page.main),
    )
    rmSync(out, { recursive: true, force: true })
    for (const { file, path } of graph.modules.values()) {
      mkdirSync(dirname(join(out, path)), { recursive: true })
      copyFileSync(file, join(out, path))
    }
    const info = join(out, 'phone', 'src', 'build_info.js')
    if (!existsSync(info)) throw new Error('the app does not import build_info.ts')
    writeFileSync(info, `export const the_build = ${JSON.stringify(build, null, 2)};\n`)
    for (const icon of readdirSync(join(the_phone, 'public'))) {
      copyFileSync(join(the_phone, 'public', icon), join(out, icon))
    }
    writeFileSync(join(out, 'manifest.webmanifest'), JSON.stringify(the_manifest(build), null, 2))
    const starts = pages.map((page) => the_start_of(graph, page.main))
    pages.forEach((page, at) => {
      const written = the_page(page.template, build, graph, starts[at] ?? [])
      for (const path of the_stylesheets_of(written)) {
        const source = join(the_packages, path)
        if (!existsSync(source)) throw new Error(`${page.template} links ${path}: not in packages/`)
        mkdirSync(dirname(join(out, path)), { recursive: true })
        copyFileSync(source, join(out, path))
      }
      writeFileSync(join(out, page.template), written)
    })
    writeFileSync(join(out, 'sw.js'), the_worker(the_precache_of(out)))
    const modules = [...graph.modules.keys()].filter((file) => !file.endsWith('.json')).length
    return {
      modules,
      at_the_start: starts[0]?.length ?? 0,
      pages: pages.map((page) => page.template),
    }
  } finally {
    rmSync(emitted, { recursive: true, force: true })
  }
}

// --- the release ----------------------------------------------------------------

const git = (...command: string[]): string => {
  try {
    return execFileSync('git', command, { encoding: 'utf8', cwd: the_phone }).trim()
  } catch {
    return 'unknown'
  }
}

/** The release of this checkout: from the CI's variables, or from git. */
export const the_release = (): TheBuild => {
  const committed = git('show', '-s', '--format=%cI', 'HEAD')
  const channel = process.env['Q_CHANNEL'] ?? 'dev'
  if (channel !== 'release' && channel !== 'test' && channel !== 'dev') {
    throw new Error(`Q_CHANNEL is ${channel}`)
  }
  return {
    version: process.env['Q_VERSION'] ?? git('describe', '--tags', '--always', '--dirty'),
    commit: process.env['GITHUB_SHA'] ?? git('rev-parse', 'HEAD'),
    // An absolute instant (Z), shown in the device's zone (A, 23 Nov 2026).
    committed_at: Number.isNaN(Date.parse(committed))
      ? 'unknown'
      : new Date(committed).toISOString(),
    channel,
    // The relay the node's tickets declare (PWA-2): the release's; locally, an
    // address of no relay (`.test`, RFC 2606), since no public relay runs
    // before step 24 (A's): the node starts and collects nothing.
    relay: process.env['Q_RELAY'] ?? 'https://relay.cumino.test',
    base: '/q-/',
  }
}

if (import.meta.main) {
  const at = process.argv.indexOf('--out')
  const out = at >= 0 ? (process.argv[at + 1] ?? 'dist') : join(the_phone, 'dist')
  const started = performance.now()
  const composed = compose(out, the_release())
  const seconds = ((performance.now() - started) / 1000).toFixed(1)
  console.log(
    `dist/ composed in ${seconds} s: ${String(composed.modules)} modules, ${String(composed.at_the_start)} preloaded at the start`,
  )
}
