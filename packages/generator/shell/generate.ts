import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, relative, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import * as prettier from 'prettier'
import {
  $Delegated,
  $Earlier,
  $Node,
  $UseCase,
  $Version,
  is_a_schema,
  json_schema_of,
  kind_of,
  type Built,
  type Json,
} from '@q-mino/domains/library'
import {
  checks,
  compared,
  doors,
  is_a_major_registry,
  generated,
  layer_order,
  next_import,
  registries,
  scopes,
  snapshots,
  twin,
  type AuthoredFile,
  type Export,
  type Failure,
  type FileKind,
  type Folder,
  type GeneratedFile,
  type Held,
  type Identity,
  type Input,
  type MajorRegistry,
  type NodeParts,
  type Past,
  type Shapes,
  type Tree,
  type TreeConfiguration,
  type Value,
} from '../src/index.ts'
import { read_source, runtime_imports, type Source } from './source.ts'

// The generator's shell for one tree (DOM-25): it walks the folders the map
// names, reads the authored files' sources, writes the scopes and the doors,
// then imports the authored files one by one, each once every authored file
// its imports reach is imported and its twin written, and writes its twin;
// then the scopes again, the registries, the majors and the registries by
// major as JSON Schema (DOM-24, DOM-22, TST-7), and deletes a generated file
// it no longer writes; then the checks of the core (DOM-25), with what the
// runtime says of the components, and, for a tree compared with main, the
// comparison of its registries by major with main's (DOM-24, PER-17).
// Checking, it writes nothing and compares. A file the configuration holds is
// neither written nor compared.

/** What generating a tree gave: the files written or differing, the files held as written, and the failures. */
export interface Outcome {
  readonly written: readonly string[]
  readonly held: readonly string[]
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

const is_an_object = (value: unknown): value is object =>
  (typeof value === 'object' || typeof value === 'function') && value !== null

/** The input a component declares inline: a schema, or a function of the context that gives one. */
const inline_input = (value: unknown): object | undefined => {
  if (!is_an_object(value) || !('input' in value)) return undefined
  const input: unknown = value.input
  return is_a_schema(input) || typeof input === 'function' ? input : undefined
}

const input_of = (value: unknown): Input => {
  const input = inline_input(value)
  return input === undefined ? 'none' : is_a_schema(input) ? 'schema' : 'function'
}

/** The parts of an object: its own enumerable properties and its symbols, zod's structure among them. */
const parts_of = (value: object): readonly unknown[] =>
  [...Object.keys(value), ...Object.getOwnPropertySymbols(value)].map((key): unknown =>
    Reflect.get(value, key),
  )

/**
 * The components a component's parts reach, not through another component
 * (DOM-25), with their marks. A condition composed with AND, OR, NOT is no
 * stop: a tree of its operands, named by the keys of its parts or by its
 * export, whose leaves have paths (LIB-7), so the walk goes through it.
 */
const held_by = (
  component: object,
): readonly { readonly held: object; readonly built: Built }[] => {
  const seen = new Set<object>([component])
  const found: { readonly held: object; readonly built: Built }[] = []
  const pending: unknown[] = [...parts_of(component)]
  while (pending.length > 0) {
    const value = pending.pop()
    if (!is_an_object(value) || seen.has(value)) continue
    seen.add(value)
    const built = kind_of(value)
    if (built === undefined || built.kind === 'condition') pending.push(...parts_of(value))
    else found.push({ held: value, built })
  }
  return found
}

/** The objects of a run, numbered: the same object, the same number (DOM-24). */
const numbering = (): ((value: object) => Identity) => {
  const numbers = new Map<object, Identity>()
  return (value) => {
    const known = numbers.get(value)
    if (known !== undefined) return known
    numbers.set(value, numbers.size)
    return numbers.size - 1
  }
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

/** The version a version component declares (`version('2.0.0')`). */
const version_of = (value: object): string | undefined => {
  if (!($Version in value)) return undefined
  const version: unknown = value[$Version]
  return typeof version === 'string' ? version : undefined
}

/** The major a version declares (`version('2.0.0')`: 2). */
const major_of = (value: object): number | undefined => {
  const major = Number(version_of(value)?.split('.')[0])
  return Number.isInteger(major) ? major : undefined
}

/**
 * A context no input may read while it is built: an input declared as a
 * function of the context reads it in its refinements, when it parses
 * (DOM-21), so its shape is built without one; one that reads it at once
 * has a shape the export cannot tell.
 */
const unread_context: object = new Proxy(
  {},
  {
    get: (): never => {
      throw new Error('an input read the context while it was built')
    },
  },
)

/** The shape of an input declared as a function of the context: the schema it builds, or a mark. */
const shape_of_a_function = (input: object): Json => {
  try {
    const built: unknown =
      typeof input === 'function' ? Reflect.apply(input, undefined, [unread_context]) : undefined
    return is_a_schema(built)
      ? json_schema_of(built)
      : { 'x-unrepresentable': 'function of the context' }
  } catch {
    return { 'x-unrepresentable': 'function of the context' }
  }
}

/** The schemas of a record of them (`events`), by name. */
const schemas_in = (record: unknown): readonly (readonly [string, Json])[] =>
  is_an_object(record)
    ? Object.entries(record).flatMap(([name, schema]: [string, unknown]) =>
        is_a_schema(schema) ? [[name, json_schema_of(schema)] as const] : [],
      )
    : []

/**
 * The shapes of a component as JSON Schema, by part (TST-7): a schema's
 * own, its input, a leaf's events, entry and stream's events; a component of
 * a past major delegated to the next major's has the next one's.
 */
const shapes_of = (value: object): Shapes => {
  if ($Delegated in value) {
    const next: unknown = value[$Delegated]
    return is_an_object(next) ? shapes_of(next) : {}
  }
  const input = inline_input(value)
  const use_case: unknown = $UseCase in value ? value[$UseCase] : undefined
  const declared: unknown = is_an_object(use_case) ? Reflect.get(use_case, 'declared') : undefined
  const stream: unknown = is_an_object(declared) ? Reflect.get(declared, 'stream') : undefined
  const entry: unknown = is_an_object(use_case) ? Reflect.get(use_case, 'entry') : undefined
  return Object.fromEntries([
    ...(is_a_schema(value) ? [['schema', json_schema_of(value)] as const] : []),
    ...(input === undefined
      ? []
      : [
          [
            'input',
            is_a_schema(input) ? json_schema_of(input) : shape_of_a_function(input),
          ] as const,
        ]),
    ...schemas_in(is_an_object(use_case) ? Reflect.get(use_case, 'events') : undefined).map(
      ([name, schema]) => [`event/${name}`, schema] as const,
    ),
    ...(is_a_schema(entry) ? [['entry', json_schema_of(entry)] as const] : []),
    ...schemas_in(is_an_object(stream) ? Reflect.get(stream, 'events') : undefined).map(
      ([name, schema]) => [`stream/${name}`, schema] as const,
    ),
  ])
}

const past_of = (value: object): Past =>
  $Delegated in value
    ? { is: 'delegated', next_input: input_of(value[$Delegated]) }
    : $Earlier in value
      ? { is: 'earlier' }
      : { is: 'current' }

/** What the runtime says of an export (DOM-25): the mark its builder left, a value, or anything else; each object by its number. */
const value_of = (value: unknown, number: (value: object) => Identity): Value => {
  const built = kind_of(value)
  if (built !== undefined && is_an_object(value)) {
    const node = node_parts_of(value)
    const major = major_of(value)
    const version = version_of(value)
    const input = inline_input(value)
    return {
      is: 'component',
      built,
      input: input_of(value),
      past: past_of(value),
      ...(node === undefined ? {} : { node }),
      ...(major === undefined ? {} : { major }),
      ...(version === undefined ? {} : { version }),
      shapes: shapes_of(value),
      identity: number(value),
      ...(input === undefined ? {} : { input_identity: number(input) }),
      holds: held_by(value).map((one): Held => ({ identity: number(one.held), built: one.built })),
    }
  }
  return is_a_schema(value)
    ? { is: 'value', identity: number(value), shape: json_schema_of(value) }
    : { is: 'other' }
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

const import_exports = async (
  path: string,
  source: Source,
  number: (value: object) => Identity,
): Promise<readonly Export[]> => {
  const module: unknown = await import(pathToFileURL(path).href)
  return source.exports.map((exported) => ({
    ...exported,
    value: value_of(
      typeof module === 'object' && module !== null
        ? Reflect.get(module, exported.name)
        : undefined,
      number,
    ),
  }))
}

/** The registries by major a release left, or why they cannot be read. */
export type Released =
  | { readonly is: 'read'; readonly registries: readonly MajorRegistry[] }
  | { readonly is: 'unread'; readonly why: string }

const git = (repository: string, args: readonly string[]): string =>
  execFileSync('git', ['-C', repository, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  })

/**
 * The registries by major `main` holds under a tree's root (its
 * `_registry.json`, DOM-24): from `origin/main`, else `main`. In CI the
 * checkout must fetch it.
 */
export const from_main = (repository: string, root: string): Released => {
  const ref = ['origin/main', 'main'].find((one) => {
    try {
      git(repository, ['rev-parse', '--verify', '--quiet', `${one}^{commit}`])
      return true
    } catch {
      return false
    }
  })
  if (ref === undefined) return { is: 'unread', why: 'git knows no main nor origin/main' }
  const paths = git(repository, ['ls-tree', '-r', '--name-only', ref, '--', root])
    .split('\n')
    .filter((path) => path.endsWith('/_registry.json'))
  const registries: MajorRegistry[] = []
  for (const path of paths) {
    const read: unknown = JSON.parse(git(repository, ['show', `${ref}:${path}`]))
    if (!is_a_major_registry(read)) return { is: 'unread', why: `${ref}:${path} is no registry` }
    registries.push(read)
  }
  return { is: 'read', registries }
}

/** Generate a tree: write its scopes and twins, or check them (`check`); a tree compared with main is compared with what `released` gives. */
export const generate = async (
  repository: string,
  configuration: TreeConfiguration,
  check: boolean,
  released: (repository: string, root: string) => Released = from_main,
): Promise<Outcome> => {
  const root = resolve(repository, configuration.root)
  const shown = (path: string): string => relative(repository, join(root, path))
  const from_the_repository = (failure: Failure): Failure => ({
    ...failure,
    path: shown(failure.path),
  })
  const number = numbering()
  const held = new Set((configuration.held ?? []).map((path) => join(root, path)))
  const kept = new Set<string>()
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
    exports.set(read.path, await import_exports(read.path, read.source, number))
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
    const on_disk = existsSync(path) ? readFileSync(path, 'utf8') : undefined
    if (held.has(path)) {
      // Held as written: what the runtime imports is the file on disk; told once, from the last writing.
      planned.set(path, on_disk ?? text)
      if (early) return
      kept.add(path)
      if (on_disk === undefined || on_disk === text) {
        failures.push({
          path: shown(file.path),
          line: 1,
          rule: 'DOM-25',
          sentence: `is held as written by generator.config.ts, and ${on_disk === undefined ? 'is missing' : 'is what the generator writes'}: remove it from held`,
        })
      }
      return
    }
    planned.set(path, text)
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
  failures.push(...written_doors.failures.map(from_the_repository))
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
    exports.set(read.path, await import_exports(read.path, read.source, number))
    await put_twin(read)
    pending.splice(pending.indexOf(next.path), 1)
  }

  // The scopes again, with what the nodes declare: the type arguments of the points.
  const final_scopes = scopes(tree())
  failures.push(...final_scopes.failures.map(from_the_repository))
  for (const file of final_scopes.files) await put(file)
  const written_registries = registries(tree())
  failures.push(...written_registries.failures.map(from_the_repository))
  for (const file of written_registries.files) await put(file)
  for (const file of snapshots(tree())) await put(file)

  // A generated file the generator no longer writes (a folder deleted, a kind gone): named, or deleted.
  for (const segments of folders) {
    for (const name of readdirSync(join(root, ...segments)).sort()) {
      const path = join(root, ...segments, name)
      if (!name.startsWith('_') || planned.has(path)) continue
      const snapshot = name === '_registry.json'
      if (!snapshot && !name.endsWith('.ts')) continue
      if (!snapshot && readFileSync(path, 'utf8').split('\n')[0] !== generated) continue
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
  for (const path of held) {
    if (!kept.has(path)) {
      failures.push({
        path: shown(relative(root, path)),
        line: 1,
        rule: 'DOM-25',
        sentence:
          'is held as written by generator.config.ts, and the generator writes no such file: remove it from held',
      })
    }
  }
  failures.push(...checks(tree()).map(from_the_repository))
  if (configuration.compared_with_main) {
    const before = released(repository, configuration.root)
    if (before.is === 'read') {
      failures.push(...compared(tree(), before.registries).map(from_the_repository))
    } else {
      failures.push({
        path: 'generator.config.ts',
        line: 1,
        rule: 'DOM-24',
        sentence: `${configuration.root} is compared with main, and its registries cannot be read: ${before.why}`,
      })
    }
  }
  return {
    written: [...written],
    held: [...kept].map((path) => shown(relative(root, path))),
    failures,
  }
}
