import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, relative, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import * as prettier from 'prettier'
import {
  $Delegated,
  $Earlier,
  $Node,
  $Version,
  is_a_schema,
  kind_of,
} from '@q-mino/domains/library'
import {
  doors,
  generated,
  layer_order,
  next_import,
  registries,
  scopes,
  twin,
  type AuthoredFile,
  type Export,
  type Failure,
  type FileKind,
  type Folder,
  type GeneratedFile,
  type Input,
  type NodeParts,
  type Past,
  type Tree,
  type TreeConfiguration,
  type Value,
} from '../src/index.ts'
import { read_source, runtime_imports, type Source } from './source.ts'

// The generator's shell for one tree (DOM-25): it walks the folders the map
// names, reads the authored files' sources, writes the scopes and the doors,
// then imports the authored files one by one, each once every authored file
// its imports reach is imported and its twin written, and writes its twin;
// then the scopes again, the registries and the majors (DOM-24, DOM-22), and
// deletes a generated file it no longer writes. Checking, it writes nothing
// and compares.

/** What generating a tree gave: the files written or differing, and the failures. */
export interface Outcome {
  readonly written: readonly string[]
  readonly failures: readonly Failure[]
}

interface Read {
  readonly segments: readonly string[]
  readonly stem: string
  readonly source: Source
  readonly path: string
}

const is_authored = (name: string): boolean =>
  name.endsWith('.ts') && !name.startsWith('_') && !name.endsWith('.test.ts')

/** The folders of the tree under its root (DOM-25): those the map names and every folder below, but a folder of service (`@fixtures/`). */
const walk = (root: string, segments: readonly string[]): readonly (readonly string[])[] =>
  existsSync(join(root, ...segments))
    ? [
        segments,
        ...readdirSync(join(root, ...segments), { withFileTypes: true })
          .filter((entry) => entry.isDirectory() && !entry.name.startsWith('@'))
          .map((entry) => entry.name)
          .sort()
          .flatMap((name) => walk(root, [...segments, name])),
      ]
    : []

const input_of = (value: unknown): Input => {
  if ((typeof value !== 'object' && typeof value !== 'function') || value === null) return 'none'
  if (!('input' in value)) return 'none'
  const input = value.input
  return is_a_schema(input) ? 'schema' : typeof input === 'function' ? 'function' : 'none'
}

const declares = (declared: object, part: string): boolean => {
  const value: unknown = Reflect.get(declared, part)
  return typeof value === 'object' && value !== null && Object.keys(value).length > 0
}

/** What a node's declaration adds to the types of the points below it: closes if it looks up, has a perimeter or a limit; accumulates if it binds or requires. */
const node_parts_of = (value: object): NodeParts | undefined => {
  if (!($Node in value)) return undefined
  const node: unknown = value[$Node]
  const declared: unknown =
    typeof node === 'object' && node !== null ? Reflect.get(node, 'declared') : undefined
  if (typeof declared !== 'object' || declared === null) return undefined
  return {
    closes: ['looks_up', 'is_found_only_if', 'is_refused_unless'].some((part) =>
      declares(declared, part),
    ),
    accumulates: ['binds', 'requires'].some((part) => Reflect.get(declared, part) !== undefined),
  }
}

/** The major a version declares (`version('2.0.0')`: 2). */
const major_of = (value: object): number | undefined => {
  if (!($Version in value)) return undefined
  const version: unknown = value[$Version]
  const major = typeof version === 'string' ? Number(version.split('.')[0]) : Number.NaN
  return Number.isInteger(major) ? major : undefined
}

const past_of = (value: object): Past =>
  $Delegated in value
    ? { is: 'delegated', next_input: input_of(value[$Delegated]) }
    : $Earlier in value
      ? { is: 'earlier' }
      : { is: 'current' }

/** What the runtime says of an export (DOM-25): the mark its builder left, a value, or anything else. */
const value_of = (value: unknown): Value => {
  const built = kind_of(value)
  if (
    built !== undefined &&
    (typeof value === 'object' || typeof value === 'function') &&
    value !== null
  ) {
    const node = node_parts_of(value)
    const major = major_of(value)
    return {
      is: 'component',
      built,
      input: input_of(value),
      past: past_of(value),
      ...(node === undefined ? {} : { node }),
      ...(major === undefined ? {} : { major }),
    }
  }
  return is_a_schema(value) ? { is: 'value' } : { is: 'other' }
}

/** The kind of a file that imports no scope, from what it exports: its components', a value, or `dsl`. */
const kind_from = (exports: readonly Export[]): FileKind => {
  const values = exports.map((exported) => exported.value)
  const component = values.find((value) => value?.is === 'component')
  if (component?.is === 'component' && component.built.kind !== 'condition') {
    return component.built.kind
  }
  return values.some((value) => value?.is === 'value') ? 'value' : 'dsl'
}

const import_exports = async (path: string, source: Source): Promise<readonly Export[]> => {
  const module: unknown = await import(pathToFileURL(path).href)
  return source.exports.map((exported) => ({
    ...exported,
    value: value_of(
      typeof module === 'object' && module !== null
        ? Reflect.get(module, exported.name)
        : undefined,
    ),
  }))
}

/** Generate a tree: write its scopes and twins, or check them (`check`). */
export const generate = async (
  repository: string,
  configuration: TreeConfiguration,
  check: boolean,
): Promise<Outcome> => {
  const root = resolve(repository, configuration.root)
  const shown = (path: string): string => relative(repository, join(root, path))
  const folders = Object.keys(configuration.sight).flatMap((top) => walk(root, [top]))
  const reads: readonly Read[] = folders.flatMap((segments) =>
    readdirSync(join(root, ...segments))
      .filter(is_authored)
      .sort()
      .map((name) => {
        const path = join(root, ...segments, name)
        return {
          segments,
          stem: name.slice(0, -3),
          source: read_source(path, readFileSync(path, 'utf8')),
          path,
        }
      }),
  )

  // A file that imports no scope reaches nothing of the tree: imported first, its kind from what it exports.
  const exports = new Map<string, readonly Export[]>()
  for (const read of reads.filter((one) => one.source.scope === undefined)) {
    exports.set(read.path, await import_exports(read.path, read.source))
  }
  const kinds = new Map(
    reads.map((read) => [read.path, read.source.scope ?? kind_from(exports.get(read.path) ?? [])]),
  )
  const tree = (): Tree => ({
    sight: configuration.sight,
    library: configuration.library,
    folders: [...new Set(reads.map((read) => read.segments.join('/')))].map((folder): Folder => ({
      segments: folder.split('/'),
      files: reads
        .filter((read) => read.segments.join('/') === folder)
        .map((read): AuthoredFile => ({
          stem: read.stem,
          kind: kinds.get(read.path) ?? 'dsl',
          exports: exports.get(read.path) ?? read.source.exports,
        })),
    })),
  })

  const planned = new Map<string, string>()
  const written = new Set<string>()
  const failures: Failure[] = []
  // A file as the generator writes it; `early`, a scope written before the imports, whose types the nodes' parts may still change: written only if missing or if what it imports at runtime differs, never compared.
  const put = async (file: GeneratedFile, early = false): Promise<void> => {
    const path = join(root, file.path)
    const options = (await prettier.resolveConfig(path)) ?? {}
    const text = await prettier.format(file.text, { ...options, filepath: path })
    planned.set(path, text)
    const on_disk = existsSync(path) ? readFileSync(path, 'utf8') : undefined
    if (on_disk === text) return
    if (early) {
      const stale =
        on_disk === undefined ||
        runtime_imports(path, on_disk).join() !== runtime_imports(path, text).join()
      if (!check && stale) writeFileSync(path, text)
      return
    }
    written.add(shown(file.path))
    if (check) {
      failures.push({
        path: shown(file.path),
        line: 1,
        rule: 'DOM-24',
        sentence: `${on_disk === undefined ? 'is missing' : 'is not what the generator writes'}: run pnpm generate`,
      })
    } else {
      writeFileSync(path, text)
    }
  }

  for (const file of scopes(tree()).files) await put(file, true)
  // The doors need no runtime: written before any file whose scope imports one is imported.
  const written_doors = doors(tree())
  failures.push(...written_doors.failures)
  for (const file of written_doors.files) await put(file)

  // The runtime imports of a module of the tree: the planned text, else the file on disk, else, for a twin not yet written, its authored file.
  const authored = new Set(reads.map((read) => read.path))
  const imports = (path: string): readonly string[] | undefined => {
    const text = planned.get(path) ?? (existsSync(path) ? readFileSync(path, 'utf8') : undefined)
    if (text === undefined) {
      const twin_of = join(dirname(path), basename(path).slice(1))
      return basename(path).startsWith('_') && authored.has(twin_of) ? [twin_of] : undefined
    }
    return runtime_imports(path, text)
      .map((specifier) => resolve(dirname(path), specifier))
      .filter(
        (target) =>
          target.startsWith(root) && (authored.has(target) || basename(target).startsWith('_')),
      )
  }

  // The twin of an imported file, written before any file that reaches it is imported.
  const put_twin = async (read: Read): Promise<void> => {
    const whole = tree()
    const folder = whole.folders.find((one) => one.segments.join('/') === read.segments.join('/'))
    const file = folder?.files.find((one) => one.stem === read.stem)
    if (folder !== undefined && file !== undefined) await put(twin(whole, folder, file))
  }
  for (const read of reads.filter((one) => one.source.scope === undefined)) await put_twin(read)

  const rank = (read: Read): number => layer_order.indexOf(kinds.get(read.path) ?? 'dsl')
  const pending = reads
    .filter((read) => read.source.scope !== undefined)
    .sort((a, b) => rank(a) - rank(b) || a.path.localeCompare(b.path))
    .map((read) => read.path)
  const by_path = new Map(reads.map((read) => [read.path, read]))
  for (;;) {
    const next = next_import(pending, authored, imports)
    if (next.is === 'done') break
    if (next.is === 'blocked') {
      failures.push({
        path: shown(relative(root, next.path)),
        line: 1,
        rule: 'DOM-25',
        sentence: `cannot be imported: it reaches ${shown(relative(root, next.by))}, which ${authored.has(next.by) ? 'reaches it back' : 'is missing'}`,
      })
      break
    }
    const read = by_path.get(next.path)
    if (read === undefined) break
    exports.set(read.path, await import_exports(read.path, read.source))
    await put_twin(read)
    pending.splice(pending.indexOf(next.path), 1)
  }

  // The scopes again, with what the nodes declare: the type arguments of the points.
  const final_scopes = scopes(tree())
  failures.push(...final_scopes.failures)
  for (const file of final_scopes.files) await put(file)
  for (const file of registries(tree())) await put(file)

  // A generated file the generator no longer writes (a folder deleted, a kind gone): named, or deleted.
  for (const segments of folders) {
    for (const name of readdirSync(join(root, ...segments)).sort()) {
      const path = join(root, ...segments, name)
      if (!name.startsWith('_') || !name.endsWith('.ts') || planned.has(path)) continue
      if (readFileSync(path, 'utf8').split('\n')[0] !== generated) continue
      written.add(shown(relative(root, path)))
      if (check) {
        failures.push({
          path: shown(relative(root, path)),
          line: 1,
          rule: 'DOM-24',
          sentence: 'is no longer written by the generator: run pnpm generate',
        })
      } else {
        rmSync(path)
      }
    }
  }
  return { written: [...written], failures }
}
