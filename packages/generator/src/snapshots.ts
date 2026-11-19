import type { Json } from '@q-mino/domains/library'
import { forgotten } from './checks.ts'
import { as_schema, same, within, type Schema } from './inclusion.ts'
import type { Export, Failure, Folder, GeneratedFile, Shapes, Tree } from './model.ts'
import { below, current_major, registry_entries, type Located } from './registries.ts'
import { files_of, major_of } from './tree.ts'

// The registries by major as JSON Schema (DOM-24, PER-17, TST-7): beside a
// domain's version, `_registry.json`, every path of its current major with
// its kind and its shapes, each with the direction it is read in; in each
// past major's folder, that major's. Committed, the snapshot CI diffs, and
// what a release leaves for the next to compare with: CI reads `main`'s and
// compares by direction. What the tree reads (an input, a fact, an effect)
// may only widen at a minor, every shape it left still parsing; what its
// clients read (a leaf's events and entries) may only narrow, every shape it
// now gives parsing with the old schema; a shape carried by others (an
// identity, a value, a predicate) is judged where they carry it, and changes
// at a minor. Any other change is a major, with its folder (DOM-22).

/**
 * How a shape is read (DOM-24, PER-17): by the tree (`read`: an input, a
 * fact, an effect, which may only widen), by its clients (`given`: a leaf's
 * events and entry, which may only narrow), or inside the shapes that carry
 * it (`carried`: an identity, a value, a predicate, a selection, a
 * calculation).
 */
export type Direction = 'read' | 'given' | 'carried'

/** A shape of a path: its JSON Schema and the direction it is read in. */
export interface Shape {
  readonly direction: Direction
  readonly schema: Json
}

/** A path of a registry by major: its kind and its shapes, by part. */
export interface Path {
  readonly kind: string
  readonly shapes?: Readonly<Record<string, Shape>>
}

/** A domain's registry for one major (`_registry.json`): the version, for the current major; its paths. */
export interface MajorRegistry {
  readonly domain: string
  readonly major: number
  readonly version?: string
  readonly paths: Readonly<Record<string, Path>>
}

const directions: readonly string[] = ['read', 'given', 'carried']

const is_a_record = (value: unknown): value is object =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const is_json = (value: unknown): value is Json =>
  value === null ||
  typeof value === 'boolean' ||
  typeof value === 'string' ||
  (typeof value === 'number' && Number.isFinite(value)) ||
  (Array.isArray(value) && value.every((item: unknown) => is_json(item))) ||
  (is_a_record(value) && Object.values(value).every((item: unknown) => is_json(item)))

const is_a_shape = (value: unknown): value is Shape =>
  is_a_record(value) &&
  'direction' in value &&
  typeof value.direction === 'string' &&
  directions.includes(value.direction) &&
  'schema' in value &&
  is_json(value.schema)

const is_a_path = (value: unknown): value is Path =>
  is_a_record(value) &&
  'kind' in value &&
  typeof value.kind === 'string' &&
  (!('shapes' in value) ||
    (is_a_record(value.shapes) &&
      Object.values(value.shapes).every((shape: unknown) => is_a_shape(shape))))

/** Whether a value read from a `_registry.json` is a major's registry. */
export const is_a_major_registry = (value: unknown): value is MajorRegistry =>
  is_a_record(value) &&
  'domain' in value &&
  typeof value.domain === 'string' &&
  'major' in value &&
  typeof value.major === 'number' &&
  Number.isInteger(value.major) &&
  (!('version' in value) || typeof value.version === 'string') &&
  'paths' in value &&
  is_a_record(value.paths) &&
  Object.values(value.paths).every((path: unknown) => is_a_path(path))

/** The direction of a shape, by the kind of its component, its part, and whether the path is an input. */
const direction_of = (kind: string, part: string, input: boolean): Direction =>
  part !== 'schema' ? 'given' : input || kind === 'fact' || kind === 'effect' ? 'read' : 'carried'

/** The shapes of an export, as its registry's path says them: an input's is its component's input; the component's, the rest. */
const shapes_at = (located: Located): Readonly<Record<string, Shape>> => {
  const value = located.exported.value
  const shapes: Shapes =
    value?.is === 'component' ? value.shapes : value?.is === 'value' ? { schema: value.shape } : {}
  const input = located.entry.input
  const parts: readonly (readonly [string, Json])[] = input
    ? shapes['input'] === undefined
      ? []
      : [['schema', shapes['input']]]
    : Object.entries(shapes).filter(([part]) => part !== 'input')
  const kind = located_kind(located)
  return Object.fromEntries(
    parts.map(([part, schema]) => [part, { direction: direction_of(kind, part, input), schema }]),
  )
}

/** The kind of a located path: its builder's, a condition its file's, a value `value`. */
const located_kind = (located: Located): string => {
  const value = located.exported.value
  if (value?.is !== 'component') return 'value'
  return value.built.kind === 'condition' ? located.authored.kind : value.built.kind
}

/** A registry's paths, each with its kind and shapes. */
const paths_of = (located: readonly Located[]): Readonly<Record<string, Path>> =>
  Object.fromEntries(
    located.map((one) => {
      const shapes = shapes_at(one)
      const kind = located_kind(one)
      return [
        one.entry.path,
        Object.keys(shapes).length === 0 ? { kind } : { kind, shapes },
      ] satisfies readonly [string, Path]
    }),
  )

/** The version a domain's folder declares, if it declares one. */
const version_of = (folder: Folder): string | undefined =>
  files_of(folder, 'version')
    .flatMap((authored) => authored.exports)
    .flatMap((exported) =>
      exported.value?.is === 'component' && exported.value.version !== undefined
        ? [exported.value.version]
        : [],
    )[0]

/** A registry by major of the tree, with the folder it is written in and where each path is declared. */
interface Written {
  readonly folder: Folder
  readonly registry: MajorRegistry
  readonly located: readonly Located[]
}

/** The registries by major of a tree: beside each version, the current major's; in each past major's folder, its own. */
const by_major = (tree: Tree): readonly Written[] =>
  tree.folders.flatMap((folder) => {
    const major = current_major(folder)
    const version = version_of(folder)
    if (major === undefined || version === undefined) return []
    const domain = folder.segments.join('/')
    const current = registry_entries(tree, folder)
    const past = below(tree, folder, true).map((child) => ({
      folder: child,
      major: major_of(child) ?? 0,
      located: registry_entries(tree, child),
    }))
    return [
      { folder, registry: { domain, major, version, paths: paths_of(current) }, located: current },
      ...past
        .filter((one) => one.located.length > 0)
        .map((one) => ({
          folder: one.folder,
          registry: { domain, major: one.major, paths: paths_of(one.located) },
          located: one.located,
        })),
    ]
  })

/** The registries by major of a tree as `_registry.json`, the snapshot of TST-7. */
export const snapshots = (tree: Tree): readonly GeneratedFile[] =>
  by_major(tree).map((written) => ({
    path: [...written.folder.segments, '_registry.json'].join('/'),
    text: `${JSON.stringify(written.registry)}\n`,
  }))

/** The registries by major of a tree, as `_registry.json` holds them. */
export const major_registries = (tree: Tree): readonly MajorRegistry[] =>
  by_major(tree).map((written) => written.registry)

interface Semver {
  readonly major: number
  readonly minor: number
  readonly patch: number
}

const semver = (version: string): Semver | undefined => {
  const found = /^(\d+)\.(\d+)\.(\d+)/.exec(version)
  return found === null
    ? undefined
    : { major: Number(found[1]), minor: Number(found[2]), patch: Number(found[3]) }
}

/** How a major moved from the one released to the tree's: the same version, a patch, a minor, back, or a past major's folder. */
type Step = 'same' | 'patch' | 'minor' | 'back' | 'past'

const step_of = (released: MajorRegistry, now: MajorRegistry): Step => {
  if (now.version === undefined) return 'past'
  const before = released.version === undefined ? undefined : semver(released.version)
  const after = semver(now.version)
  if (before === undefined || after === undefined) return 'back'
  if (after.minor !== before.minor) return after.minor > before.minor ? 'minor' : 'back'
  if (after.patch !== before.patch) return after.patch > before.patch ? 'patch' : 'back'
  return 'same'
}

/** A part as the sentences name it. */
const part_shown = (part: string): string =>
  part === 'schema'
    ? 'its shape'
    : part === 'entry'
      ? 'its entry'
      : part.startsWith('event/')
        ? `its event ${part.slice('event/'.length)}`
        : part.startsWith('stream/')
          ? `the event ${part.slice('stream/'.length)} of its stream`
          : part

/** Whether a change of a shape keeps its direction: the old within the new where the tree reads, the new within the old where its clients read. */
const in_direction = (direction: Direction, before: Schema, after: Schema): boolean =>
  direction === 'read'
    ? within(before, after)
    : direction === 'given'
      ? within(after, before)
      : true

const where_declared = (located: Located | undefined, written: Written): Failure['path'] =>
  located === undefined
    ? [...written.folder.segments, '_registry.json'].join('/')
    : [...located.folder.segments, `${located.authored.stem}.ts`].join('/')

const line_of = (exported: Export | undefined): number => exported?.line ?? 1

/**
 * The paths a major keeps once past (DOM-22, DOM-24): every component of it
 * that is stored (a fact, an effect) or published (a leaf, whose events or
 * entry its clients read), and the input of each leaf; the rest of its map
 * (identities, values, commands, the business's use cases) changes with the
 * current major alone.
 */
export const kept_by_a_past_major = (registry: MajorRegistry): readonly string[] => {
  const kept = (path: string): boolean => {
    const one = registry.paths[path]
    return (
      one !== undefined &&
      (one.kind === 'fact' ||
        one.kind === 'effect' ||
        Object.values(one.shapes ?? {}).some((shape) => shape.direction === 'given'))
    )
  }
  return Object.keys(registry.paths).filter(
    (path) => kept(path) || (path.endsWith('_input') && kept(path.slice(0, -'_input'.length))),
  )
}

/** A major gone back: the version the tree declares is below the one released. */
const back = (written: Written, before: MajorRegistry): Failure => {
  const version = written.located.find((one) => one.entry.path.split('/').at(-2) === 'version')
  const name = before.domain.split('/').at(-1) ?? ''
  return {
    path: where_declared(version, written),
    line: line_of(version?.exported),
    rule: 'DOM-22',
    sentence: `${name} is at ${written.registry.version ?? '?'}, and was released at ${before.version ?? `${String(before.major)}.x`}: a version only grows`,
  }
}

/**
 * The tree's registries by major compared with those a release left (`main`'s
 * `_registry.json`, DOM-24, PER-17): a path gone is forgotten (`forgotten`);
 * a version only grows; at the same version or a patch no path is added and
 * no shape changes; at a minor a shape changes only in its direction, the
 * tree's reads widening, its clients' narrowing; a past major's folder keeps
 * its shapes in their direction, delegated to the next major's, and gains no
 * path. A change a minor cannot carry is a major. A major the tree no longer
 * has has left the window (D101), and one it has but the release had not is
 * new: neither is compared.
 */
export const compared = (tree: Tree, released: readonly MajorRegistry[]): readonly Failure[] => {
  const now = by_major(tree)
  const lost = forgotten(
    tree,
    released.map((one) => {
      const current = now.find(
        (written) =>
          written.registry.domain === one.domain && written.registry.version !== undefined,
      )
      const past = current !== undefined && current.registry.major !== one.major
      return {
        domain: one.domain,
        major: one.major,
        paths: past ? kept_by_a_past_major(one) : Object.keys(one.paths),
      }
    }),
  )
  const changed = released.flatMap((before): readonly Failure[] => {
    const written = now.find(
      (one) => one.registry.domain === before.domain && one.registry.major === before.major,
    )
    if (written === undefined) {
      const current = now.find(
        (one) => one.registry.domain === before.domain && one.registry.version !== undefined,
      )
      if (before.version === undefined || current === undefined) return []
      if (current.registry.major >= before.major) return []
      return [back(current, before)]
    }
    const after = written.registry
    const name = before.domain.split('/').at(-1) ?? ''
    const released_as = before.version ?? `${String(before.major)}.x`
    const step = step_of(before, after)
    // A major released as past and current in the tree: gone back, told by the major released as current.
    if (before.version === undefined && after.version !== undefined) return []
    if (step === 'back') return [back(written, before)]
    const at = (path: string): Located | undefined =>
      written.located.find((one) => one.entry.path === path)
    const added = Object.keys(after.paths)
      .filter((path) => before.paths[path] === undefined)
      .flatMap((path): readonly Failure[] => {
        if (step === 'minor') return []
        const located = at(path)
        return [
          {
            path: where_declared(located, written),
            line: line_of(located?.exported),
            rule: step === 'past' ? 'DOM-22' : 'DOM-24',
            sentence:
              step === 'past'
                ? `${path} is in ${written.folder.segments.join('/')}, and ${name} ${released_as} was not released with it: a past major keeps what it was released with, nothing more`
                : `${path} is new, and ${name} stays at ${after.version ?? '?'}: a path is added at a minor`,
          },
        ]
      })
    const shapes = Object.entries(before.paths).flatMap(([path, then]): readonly Failure[] => {
      const later = after.paths[path]
      if (later === undefined) return []
      const parts = [
        ...new Set([...Object.keys(then.shapes ?? {}), ...Object.keys(later.shapes ?? {})]),
      ]
      return parts.flatMap((part): readonly Failure[] => {
        const old = then.shapes?.[part]
        const fresh = later.shapes?.[part]
        const old_schema: Schema = as_schema(old?.schema) ?? false
        const new_schema: Schema = as_schema(fresh?.schema) ?? false
        if (same(old_schema, new_schema)) return []
        const direction = fresh?.direction ?? old?.direction ?? 'carried'
        const kept = in_direction(direction, old_schema, new_schema)
        if ((step === 'minor' || step === 'past') && kept) return []
        const located = at(path)
        const why =
          direction === 'read'
            ? 'what the tree reads only widens, every shape it left still parsing'
            : 'what its clients read only narrows, every shape it gives parsing with the old schema'
        return [
          {
            path: where_declared(located, written),
            line: line_of(located?.exported),
            rule: step === 'past' ? 'DOM-22' : 'DOM-24',
            sentence: kept
              ? `${path} changes ${part_shown(part)}, and ${name} stays at ${after.version ?? '?'}: a shape changes at a minor`
              : `${path} changes ${part_shown(part)} against the direction it is read in, since ${name} ${released_as}: ${why}; ${step === 'past' ? "a past major's folder keeps it" : 'this is a major'}`,
          },
        ]
      })
    })
    return [...added, ...shapes]
  })
  return [...lost, ...changed]
}
