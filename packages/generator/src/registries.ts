import { layer_order } from './kinds.ts'
import type { AuthoredFile, Export, Failure, Folder, GeneratedFile, Tree } from './model.ts'
import { given_twice, type Named } from './names.ts'
import { file, wrap } from './text.ts'
import { files_of, library_from, major_of, path_segments } from './tree.ts'

// The registries of a tree (DOM-24): `_registry.ts`, every path of a folder
// with its component, the map the library reads at runtime, by object
// identity; a domain's carries the folders below it, its subtree (D105). A
// past major's is its whole map: every path of the major, written whole or
// delegated, and the input of every leaf, its own or delegated to the next
// major's, as its twins export them. `_majors.ts`, beside a domain's
// version: the current's registry and each past major's, by number, from the
// folders (DOM-22, PER-17). Both need the runtime: the shell writes them once
// every authored file is imported.

/** A path of the registry, the member of a twin it names, and whether it is a component's input. */
export interface Entry {
  readonly path: string
  readonly member: string
  readonly input: boolean
}

/**
 * The paths of an export of an authored file, as its twin exports it: the
 * component under its path (its folders, the past majors left out, its kind,
 * its subject, its name: the version travels apart, DOM-22), and its input,
 * declared inline or delegated, under the same kind (`<name>_input`). A
 * condition takes its file's kind; a value is `value`; a function of `dsl` or
 * a helper has no path.
 */
export const entries_of = (
  folder: Folder,
  authored: AuthoredFile,
  exported: Export,
): readonly Entry[] => {
  const value = exported.value
  const name = exported.name
  const member = (of: string): string => `${authored.stem}.${of}`
  const path = (kind: string, subject: readonly string[], of: string): string =>
    [...path_segments(folder.segments), kind, ...subject, of].join('/')
  if (value === undefined || value.is === 'other') return []
  if (value.is === 'value') {
    return [{ path: path('value', [], name), member: member(name), input: false }]
  }
  const built = value.built
  const kind = built.kind === 'condition' ? authored.kind : built.kind
  const subject = 'subject' in built ? [built.subject] : []
  const input =
    value.past.is === 'delegated'
      ? kind === 'usecase' && value.past.next_input !== 'none'
      : (kind === 'command' || kind === 'query' || kind === 'usecase') && value.input !== 'none'
  return [
    { path: path(kind, subject, name), member: member(name), input: false },
    ...(input
      ? [
          {
            path: path(kind, subject, `${name}_input`),
            member: member(`${name}_input`),
            input: true,
          },
        ]
      : []),
  ]
}

/** The files of a folder whose twins the registry reads: every kind but `dsl`, in the order of the layers, then by name. */
const registered = (folder: Folder): readonly AuthoredFile[] =>
  layer_order
    .filter((kind) => kind !== 'dsl')
    .flatMap((kind) => [...files_of(folder, kind)].sort((a, b) => a.stem.localeCompare(b.stem)))

const below = (tree: Tree, folder: Folder, past: boolean): readonly Folder[] =>
  tree.folders
    .filter(
      (other) =>
        other.segments.length === folder.segments.length + 1 &&
        folder.segments.every((segment, index) => segment === other.segments[index]) &&
        (major_of(other) !== undefined) === past,
    )
    .sort((a, b) => (a.segments.at(-1) ?? '').localeCompare(b.segments.at(-1) ?? ''))

/** Whether a folder has a registry: a path of its own, or, for a domain or a folder below one, a folder below it with a registry. */
const has_a_registry = (tree: Tree, folder: Folder): boolean =>
  registered(folder).some((authored) =>
    authored.exports.some((exported) => entries_of(folder, authored, exported).length > 0),
  ) || carried(tree, folder).length > 0

/** The folders whose registries a folder's carries: below a domain's folder, every folder that is not a past major's (D105). Above the domains, none. */
const carried = (tree: Tree, folder: Folder): readonly Folder[] =>
  folder.segments.length < 2 || major_of(folder) !== undefined
    ? []
    : below(tree, folder, false).filter((child) => has_a_registry(tree, child))

const shown = (folder: Folder): string => `\`${folder.segments.join('/')}\``

const header = (tree: Tree, folder: Folder): readonly string[] => {
  const major = major_of(folder)
  const parent = folder.segments.slice(0, -1)
  if (major !== undefined) {
    return wrap(
      `The path registry of \`${parent.join('/')}\` ${String(major)}.x, a past major (DOM-22, DOM-24, PER-17): its whole map, every path of the major with its component, written whole or delegated to the next major's, and the input of every leaf, its own or delegated; the same paths as the current's, the version apart. The majors of the domain list it (\`../_majors.ts\`).`,
    )
  }
  const children = carried(tree, folder)
  return wrap(
    `The path registry of ${shown(folder)} (DOM-24): every path with its component, in the order of the twins. The configurator gives it to the library, which reads it in reverse, from a component to its path, by object identity.${folder.segments.length > 2 ? ` The registry of \`${parent.join('/')}\` carries it: a folder of a domain is its subtree (D105).` : ''}${children.length > 0 ? ' The registries of the folders below it come with it, its subtree (D105).' : ''}`,
  )
}

/** The paths of a folder's registry: its own, then those of the folders it carries (DOM-24). */
export const registry_paths = (tree: Tree, folder: Folder): readonly string[] => [
  ...registered(folder).flatMap((authored) =>
    authored.exports.flatMap((exported) =>
      entries_of(folder, authored, exported).map((entry) => entry.path),
    ),
  ),
  ...carried(tree, folder).flatMap((child) => registry_paths(tree, child)),
]

/** The modules a registry imports, by the name it gives each: two under one name fail (DOM-24). */
const aliases = (
  folder: Folder,
  read: readonly AuthoredFile[],
  children: readonly string[],
): readonly Failure[] => {
  const names: readonly Named[] = [
    { name: 'wlib', what: 'the library' },
    ...read.map((authored) => ({ name: authored.stem, what: `the twin _${authored.stem}.ts` })),
    ...children.map((child) => ({
      name: child,
      what: `the registry of ${[...folder.segments, child].join('/')}`,
    })),
  ]
  return given_twice(names).map(([first, again]) => ({
    path: [...folder.segments, '_registry.ts'].join('/'),
    line: 1,
    rule: 'DOM-24',
    sentence: `the registry of ${folder.segments.join('/')} would import two modules as ${first.name}, ${first.what} and ${again.what}: a registry names each module once`,
  }))
}

/** The registry of a folder (`_registry.ts`), if it has one, and the failures met writing it. */
const registry = (
  tree: Tree,
  folder: Folder,
): { readonly files: readonly GeneratedFile[]; readonly failures: readonly Failure[] } => {
  if (!has_a_registry(tree, folder)) return { files: [], failures: [] }
  const files = registered(folder)
  const entries = files.flatMap((authored) =>
    authored.exports.flatMap((exported) => entries_of(folder, authored, exported)),
  )
  const read = files.filter((authored) =>
    entries.some((entry) => entry.member.startsWith(`${authored.stem}.`)),
  )
  const children = carried(tree, folder).map((child) => child.segments.at(-1) ?? '')
  return {
    failures: aliases(folder, read, children),
    files: [
      {
        path: [...folder.segments, '_registry.ts'].join('/'),
        text: file(header(tree, folder), [
          [
            `import type * as wlib from '${library_from(tree, folder.segments)}'`,
            ...read.map((authored) => `import * as ${authored.stem} from './_${authored.stem}.ts'`),
            ...children.map(
              (child) => `import { registry as ${child} } from './${child}/_registry.ts'`,
            ),
          ].join('\n'),
          [
            'export const registry = {',
            ...entries.map((entry) => `  '${entry.path}': ${entry.member},`),
            ...children.map((child) => `  ...${child},`),
            '} satisfies wlib.Registry',
          ].join('\n'),
        ]),
      },
    ],
  }
}

/** The current major of a folder: the major of the version it declares, if it declares one. */
export const current_major = (folder: Folder): number | undefined =>
  files_of(folder, 'version')
    .flatMap((authored) => authored.exports)
    .flatMap((exported) =>
      exported.value?.is === 'component' && exported.value.major !== undefined
        ? [exported.value.major]
        : [],
    )[0]

/** The majors of a folder that declares its version (`_majors.ts`): the current's registry and each past major's, by number, the newest first. */
const majors = (tree: Tree, folder: Folder): readonly GeneratedFile[] => {
  const current = current_major(folder)
  if (current === undefined) return []
  const past = below(tree, folder, true)
    .filter((child) => has_a_registry(tree, child))
    .map((child) => ({ major: major_of(child) ?? 0, segment: child.segments.at(-1) ?? '' }))
    .sort((a, b) => b.major - a.major)
  const all = [{ major: current, module: './_registry.ts' }].concat(
    past.map((one) => ({ major: one.major, module: `./${one.segment}/_registry.ts` })),
  )
  const name = folder.segments.at(-1) ?? ''
  return [
    {
      path: [...folder.segments, '_majors.ts'].join('/'),
      text: file(
        wrap(
          `The majors of \`${name}\` (DOM-22, PER-17): the current's registry${past.length === 0 ? ', by number, and no past major' : " and each past major's, by number, from the folders. The only file of the current version that names a past major: the generator rewrites it when a folder is deleted"}. The configurator gives it where a version picks a major: the versions of a store (\`wlib.versions\`), the ports of a tree (\`wlib.tree_ports\`).`,
        ),
        [
          [
            `import type * as wlib from '${library_from(tree, folder.segments)}'`,
            ...all.map(
              (one) => `import { registry as major_${String(one.major)} } from '${one.module}'`,
            ),
          ].join('\n'),
          `export const majors = { ${all.map((one) => `${String(one.major)}: major_${String(one.major)}`).join(', ')} } satisfies wlib.Majors`,
        ],
      ),
    },
  ]
}

/** The registries and the majors of every folder of a tree, and the failures met writing them. */
export const registries = (
  tree: Tree,
): { readonly files: readonly GeneratedFile[]; readonly failures: readonly Failure[] } => {
  const written = tree.folders.map((folder) => ({
    registry: registry(tree, folder),
    majors: majors(tree, folder),
  }))
  return {
    files: written.flatMap((one) => [...one.registry.files, ...one.majors]),
    failures: written.flatMap((one) => one.registry.failures),
  }
}
