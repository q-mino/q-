import {
  below,
  builders_of,
  functions_of,
  layer_order,
  past_builders,
  plural_of,
  point_builders,
  sees_its_ancestors,
  seen_of,
  type BuilderName,
} from './kinds.ts'
import { has_a_door } from './doors.ts'
import type { Failure, FileKind, Folder, GeneratedFile, Tree } from './model.ts'
import { given_twice, type Named } from './names.ts'
import { file, wrap } from './text.ts'
import {
  ancestors_of,
  doors_of,
  files_of,
  folder_at,
  library_from,
  major_of,
  next_major_of,
  nodes_above,
  relative,
  type NodeAbove,
} from './tree.ts'

// The scopes of a folder (DOM-25): the point, `_scope.ts`, every builder bound
// to the context the nodes above give there; and one scope per kind of the
// folder, `_scope_<kind>.ts`, the one import of an authored file of that kind:
// the builders of its kind by name, its folder's twins in the layers below it
// as namespaces, its ancestors' doors to the folders below, and the doors the
// map opens to it. A past major's (DOM-22) gives `earlier` and `delegate`,
// the next major as `next`, and what the domain's scope of the kind gives
// but its functions of `dsl` and its ancestors, which may change under it.
// The scopes need no runtime: the shell writes them before it imports a file.

/** The scopes of every folder of a tree, and the failures met writing them. */
export const scopes = (
  tree: Tree,
): { readonly files: readonly GeneratedFile[]; readonly failures: readonly Failure[] } => {
  const written = tree.folders.map((folder) => scopes_of(tree, folder))
  return {
    files: written.flatMap((folder) => folder.files),
    failures: written.flatMap((folder) => folder.failures),
  }
}

const scopes_of = (
  tree: Tree,
  folder: Folder,
): { readonly files: readonly GeneratedFile[]; readonly failures: readonly Failure[] } => {
  const kinds = layer_order.filter((kind) => files_of(folder, kind).length > 0)
  const past = major_of(folder) !== undefined
  const each = kinds.map((kind) =>
    past ? past_scope(tree, folder, kind) : scope(tree, folder, kind),
  )
  return {
    files: [point(tree, folder, past), ...each.map((one) => one.file)],
    failures: each.flatMap((one) => one.failures),
  }
}

const at = (folder: Folder, file: string): string => [...folder.segments, file].join('/')

const shown = (folder: Folder): string => `\`${folder.segments.join('/')}\``

/**
 * The type arguments of `builders_at` at a point (PER-6, SC-31): the context
 * of the nearest node above, and what it and the nodes above it close and
 * accumulate, each only when one of them does, a default left out.
 */
const context_of = (
  folder: Folder,
  nodes: readonly NodeAbove[],
): { readonly imports: readonly string[]; readonly arguments: string } => {
  const node = nodes[0]
  if (node === undefined) return { imports: [], arguments: 'zz.RootContext' }
  const accumulated = nodes.some((above) => above.parts.accumulates)
  const closes = accumulated || nodes.some((above) => above.parts.closes)
  const types = [
    `${node.name}_context`,
    ...(closes ? [`${node.name}_closes`] : []),
    ...(accumulated ? [`${node.name}_accumulated`] : []),
  ]
  return {
    imports: [
      `import type { ${[...types].sort().join(', ')} } from '${relative(folder.segments, node.segments, '_node.ts')}'`,
    ],
    arguments: types.join(', '),
  }
}

const destructured = (names: readonly string[], context: string): string =>
  `export const { ${names.join(', ')} } = zz.builders_at<${context}>()`

/** The point of a folder (`_scope.ts`). */
const point = (tree: Tree, folder: Folder, past: boolean): GeneratedFile => {
  const nodes = nodes_above(tree, folder.segments, 'at')
  const node = nodes[0]
  const context = context_of(folder, nodes)
  return {
    path: at(folder, '_scope.ts'),
    text: file(
      wrap(
        `The point of ${shown(folder)} (DOM-25): ${past ? 'the builders of a past major (DOM-22)' : 'every builder'}, bound to the context the nodes above give here (PER-6), ${node === undefined ? "the root's, with no node above" : tree.mounted?.[node.segments.join('/')] === undefined ? `the node \`${node.name}\`'s` : `the mounted folder \`${node.name}\`'s, given from outside (EXT-11)`}. The authored files take them from the scope of their kind, never from this file.`,
      ),
      [
        [`import * as zz from '${library_from(tree, folder.segments)}'`, ...context.imports].join(
          '\n',
        ),
        destructured(past ? past_builders : point_builders, context.arguments),
      ],
    ),
  }
}

/** A namespace a scope exports: its name, the module it re-exports, and what it is, in the tree's words. */
interface Namespace extends Named {
  readonly module: string
}

const exported = (namespace: Namespace): string =>
  `export * as ${namespace.name} from '${namespace.module}'`

/** The twins of a folder of these kinds, as namespaces, in the order of the layers, then by name. */
const twins = (from: Folder, of: Folder, kinds: readonly FileKind[]): readonly Namespace[] =>
  layer_order
    .filter((kind) => kinds.includes(kind))
    .flatMap((kind) =>
      files_of(of, kind)
        .map((authored) => authored.stem)
        .sort()
        .map((stem) => ({
          name: stem,
          module: relative(from.segments, of.segments, `_${stem}.ts`),
          what:
            from.segments.join('/') === of.segments.join('/')
              ? `the file ${stem}.ts`
              : `the file ${[...of.segments, stem].join('/')}.ts`,
        })),
    )

/** The doors of the folders the map opens to a folder, for a kind. */
const doors = (tree: Tree, folder: Folder, kind: FileKind): readonly Namespace[] =>
  doors_of(tree, folder.segments, (kinds) => kinds.some(seen_of(kind)))
    .filter((door) => has_a_door(tree, door.segments, folder.segments[0] ?? ''))
    .map((door) => ({
      name: door.name,
      module: relative(folder.segments, door.segments, door.file),
      what: `the door of ${door.segments.join('/')}`,
    }))

/** The doors of a folder's ancestors to the folders below (`_door_below.ts`), each under its name prefixed with `_`. */
const ancestors = (tree: Tree, folder: Folder): readonly Namespace[] =>
  ancestors_of(tree, folder.segments).map((ancestor) => ({
    name: `_${ancestor.at(-1) ?? ''}`,
    module: relative(folder.segments, ancestor, '_door_below.ts'),
    what: `the ancestor ${ancestor.join('/')}`,
  }))

const builders_sentence = (names: readonly string[]): string =>
  names.length === 0
    ? 'no builder'
    : `the builders ${names.map((name) => `\`${name}\``).join(', ')}`

/** The members of a scope given twice: a failure each (DOM-25). */
const twice = (
  path: string,
  folder: Folder,
  kind: FileKind,
  members: readonly Named[],
): readonly Failure[] =>
  given_twice(members).map(([first, again]) => ({
    path,
    line: 1,
    rule: 'DOM-25',
    sentence: `the scope of the ${plural_of[kind]} of ${folder.segments.join('/')} would give two members named ${first.name}, ${first.what} and ${again.what}: a scope gives each one name`,
  }))

const builders_named = (
  builders: readonly string[],
  functions: readonly string[],
): readonly Named[] => [
  ...builders.map((name) => ({ name, what: `the builder ${name}` })),
  ...functions.map((name) => ({ name, what: `the library's ${name}` })),
]

/** The scope of a kind of a folder of the current version (`_scope_<kind>.ts`), and the failures met writing it. */
const scope = (
  tree: Tree,
  folder: Folder,
  kind: FileKind,
): { readonly file: GeneratedFile; readonly failures: readonly Failure[] } => {
  const builders: readonly BuilderName[] = builders_of[kind]
  const functions = functions_of[kind] ?? []
  const namespaces = [
    ...twins(folder, folder, below[kind]),
    ...(sees_its_ancestors(kind) ? ancestors(tree, folder) : []),
    ...doors(tree, folder, kind),
  ]
  const header = wrap(
    `The scope of the ${plural_of[kind]} of ${shown(folder)} (DOM-25): ${builders_sentence([...builders, ...functions])}; ${namespaces.length === 0 ? 'nothing it sees' : "the twins of its folder in the layers below, its ancestors' doors to the folders below and the doors the map opens to it"}.`,
  )
  const path = at(folder, `_scope_${kind}.ts`)
  const failures = twice(path, folder, kind, [
    ...builders_named(builders, functions),
    ...namespaces,
  ])
  if (kind === 'node') {
    const context = context_of(folder, nodes_above(tree, folder.segments, 'above'))
    return {
      failures,
      file: {
        path,
        text: file(header, [
          [`import * as zz from '${library_from(tree, folder.segments)}'`, ...context.imports].join(
            '\n',
          ),
          namespaces.map(exported).join('\n'),
          destructured(builders, context.arguments),
        ]),
      },
    }
  }
  return {
    failures,
    file: {
      path,
      text: file(header, [
        [
          ...(builders.length === 0
            ? []
            : [`export { ${builders.join(', ')} } from './_scope.ts'`]),
          ...(functions.length === 0
            ? []
            : [`export { ${functions.join(', ')} } from '${library_from(tree, folder.segments)}'`]),
          ...namespaces.map(exported),
        ].join('\n'),
      ]),
    },
  }
}

/** The scope of a kind of a past major's folder (DOM-22). */
const past_scope = (
  tree: Tree,
  folder: Folder,
  kind: FileKind,
): { readonly file: GeneratedFile; readonly failures: readonly Failure[] } => {
  const majors = next_major_of(tree, folder)
  const domain = majors === undefined ? undefined : folder_at(tree, majors.domain)
  const next = majors === undefined ? undefined : folder_at(tree, majors.next)
  const next_files = next === undefined ? [] : files_of(next, kind)
  const path = at(folder, `_scope_${kind}.ts`)
  const misses: readonly Failure[] =
    next_files.length === 1
      ? []
      : [
          {
            path,
            line: 1,
            rule: 'DOM-22',
            sentence: `${folder.segments.join('/')} holds ${plural_of[kind]} of a past major, and the next major has ${next_files.length === 0 ? 'none' : `${String(next_files.length)} files of them`}: its scope names one as \`next\``,
          },
        ]
  const own = twins(folder, folder, below[kind])
  const of_the_domain =
    domain === undefined
      ? []
      : twins(
          folder,
          domain,
          below[kind].filter((seen) => seen !== 'dsl'),
        ).filter((namespace) => !own.some((mine) => mine.name === namespace.name))
  const namespaces = [
    ...next_files.map((next_file) => ({
      name: 'next',
      module: relative(folder.segments, next?.segments ?? [], `_${next_file.stem}.ts`),
      what: `the next major's ${next_file.stem}.ts`,
    })),
    ...own,
    ...of_the_domain,
    ...doors(tree, folder, kind),
  ]
  const failures = [
    ...misses,
    ...twice(path, folder, kind, [...builders_named(past_builders, []), ...namespaces]),
  ]
  return {
    file: {
      path,
      text: file(
        wrap(
          `The scope of the ${plural_of[kind]} of ${shown(folder)}, a past major (DOM-22): the builders \`earlier\` and \`delegate\`; the next major's as \`next\`; what the domain's scope gives, but its functions of \`dsl\` and its ancestors, which may change under a folder once released.`,
        ),
        [
          [
            `export { ${past_builders.join(', ')} } from './_scope.ts'`,
            ...namespaces.map(exported),
          ].join('\n'),
        ],
      ),
    },
    failures,
  }
}
