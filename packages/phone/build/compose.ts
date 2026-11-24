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
// not a bundle: every file is the one `tsc` or its package wrote.
// [Q, C, 24 Nov 2026]
//
// Until the screens are Preact's (step S3 of the plan), Solid's JSX is
// compiled file by file after `tsc`, by Solid's Babel preset, the one of
// its Vite plugin: `tsc` keeps the JSX (`.jsx`), the preset writes `.js`.
// S3 deletes that step, `tsc` compiling Preact's JSX.
//
// Usage: node build/compose.ts [--out <dir>]

import { transformAsync } from '@babel/core'
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
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join, relative, sep } from 'node:path'
import ts from 'typescript'
import type { TheBuild } from '../src/build_info.ts'
import { the_policy_of_the_app } from './the_policy.ts'

const the_phone = join(import.meta.dirname, '..')
const the_packages = join(the_phone, '..')
const the_repository = join(the_packages, '..')
const posix = (path: string): string => path.split(sep).join('/')

/** The app's manifest (PWA-1), its addresses under the base. */
const the_manifest = (base: string) => ({
  name: 'q-',
  short_name: 'q-',
  description: 'Cumino',
  lang: 'it',
  start_url: base,
  scope: base,
  display: 'standalone',
  background_color: '#fdf6ec',
  theme_color: '#8a5a2b',
  icons: [
    { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
})

// --- tsc and Solid's JSX -----------------------------------------------------

const files_under = (dir: string): string[] =>
  readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .map((each) => join(dir, each))
    .filter((each) => statSync(each).isFile())

/** The relative specifiers of a module ending in `.jsx`, the ones `tsc` rewrote from `.tsx`. */
const a_jsx_specifier = /(["'])(\.{1,2}\/[^"'\n]*)\.jsx\1/g

/** The browser's modules emitted by `tsc` into `emitted`, Solid's JSX compiled. */
const emits = async (emitted: string): Promise<void> => {
  execFileSync(
    join(the_repository, 'node_modules', '.bin', 'tsc'),
    // The types are the check's (`tsc -b`); this emits only. With the check,
    // the bare `.ts` specifiers would be reported as not rewritten (TS2877):
    // the import map resolves them.
    ['-p', join(the_phone, 'build', 'tsconfig.emit.json'), '--noCheck', '--outDir', emitted],
    { stdio: 'inherit' },
  )
  const solid = createRequire(import.meta.url).resolve('babel-preset-solid')
  for (const file of files_under(emitted)) {
    if (file.endsWith('.jsx')) {
      const compiled = await transformAsync(readFileSync(file, 'utf8'), {
        filename: file,
        babelrc: false,
        configFile: false,
        presets: [[solid, { generate: 'dom' }]],
      })
      if (compiled?.code == null) throw new Error(`Solid's preset wrote nothing for ${file}`)
      writeFileSync(file.replace(/\.jsx$/, '.js'), compiled.code)
      rmSync(file)
    }
  }
  for (const file of files_under(emitted)) {
    if (file.endsWith('.js')) {
      const text = readFileSync(file, 'utf8')
      const rewritten = text.replace(a_jsx_specifier, '$1$2.js$1')
      if (rewritten !== text) writeFileSync(file, rewritten)
    }
  }
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

/** The name of the package a file of `node_modules` is in: the nearest package.json with a name. */
const the_vendored_name = (file: string): { readonly name: string; readonly folder: string } => {
  for (let dir = dirname(file); dirname(dir) !== dir; dir = dirname(dir)) {
    const manifest = join(dir, 'package.json')
    if (existsSync(manifest)) {
      const parsed: unknown = JSON.parse(readFileSync(manifest, 'utf8'))
      if (a_record(parsed) && typeof parsed['name'] === 'string')
        return { name: parsed['name'], folder: dir }
    }
  }
  throw new Error(`no package for ${file}`)
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

/** The modules of the page from its main, the import map that finds the bare ones, those of the start. */
interface TheGraph {
  readonly modules: ReadonlyMap<string, AModule>
  readonly imports: ReadonlyMap<string, string>
  readonly at_the_start: readonly string[]
}

const walks = (emitted: string, main: string): TheGraph => {
  const modules = new Map<string, AModule>()
  const imports = new Map<string, string>()
  const statics = new Map<string, string[]>()
  const pending = [main]
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
  const at_the_start = new Set<string>()
  const from_main = [main]
  for (let file = from_main.pop(); file !== undefined; file = from_main.pop()) {
    if (at_the_start.has(file)) continue
    at_the_start.add(file)
    from_main.push(...(statics.get(file) ?? []))
  }
  const paths = new Set([...modules.values()].map((each) => each.path))
  if (paths.size !== modules.size)
    throw new Error('two files at one path: two versions of a dependency')
  return {
    modules,
    imports,
    at_the_start: [...at_the_start].flatMap((file) => {
      const module = modules.get(file)
      return module === undefined || file.endsWith('.json') ? [] : [module.path]
    }),
  }
}

// --- the page and the worker ---------------------------------------------------

/** The hash of a file, base64 for the policy, hex for the precache. */
const sha256 = (text: string | Buffer) => createHash('sha256').update(text)

/** The marker of the page's template where the build puts the policy, the import map and the preloads. */
const the_marker = '<!-- composed by build/compose.ts -->'

const the_page = (build: TheBuild, graph: TheGraph): string => {
  const template = readFileSync(join(the_phone, 'index.html'), 'utf8')
  if (!template.includes(the_marker)) throw new Error(`index.html has no ${the_marker}`)
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
      ...[...graph.at_the_start]
        .sort()
        .map((path) => `<link rel="modulepreload" href="./${path}" />`),
    ].join('\n    '),
  )
}

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

/** What a composition wrote: the module count, and how many of them the start preloads. */
export interface AComposition {
  readonly modules: number
  readonly at_the_start: number
}

/** `dist/` composed, into `out`, for a release. */
export const compose = async (out: string, build: TheBuild): Promise<AComposition> => {
  const emitted = mkdtempSync(join(tmpdir(), 'q-emit-'))
  try {
    await emits(emitted)
    const graph = walks(emitted, join(emitted, 'phone', 'src', 'main.js'))
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
    writeFileSync(
      join(out, 'manifest.webmanifest'),
      JSON.stringify(the_manifest(build.base), null, 2),
    )
    writeFileSync(join(out, 'index.html'), the_page(build, graph))
    writeFileSync(join(out, 'sw.js'), the_worker(the_precache_of(out)))
    const modules = [...graph.modules.keys()].filter((file) => !file.endsWith('.json')).length
    return { modules, at_the_start: graph.at_the_start.length }
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
  const composed = await compose(out, the_release())
  const seconds = ((performance.now() - started) / 1000).toFixed(1)
  console.log(
    `dist/ composed in ${seconds} s: ${String(composed.modules)} modules, ${String(composed.at_the_start)} preloaded at the start`,
  )
}
