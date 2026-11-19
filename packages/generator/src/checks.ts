import type { Built } from '@q-mino/domains/library'
import { below, builders_of, plural_of } from './kinds.ts'
import type { AuthoredFile, Export, Failure, FileKind, Folder, Identity, Tree } from './model.ts'
import { current_major, entries_of, registry_paths } from './registries.ts'
import {
  ancestors_of,
  files_of,
  folder_at,
  is_a_major,
  major_of,
  node_of,
  path_segments,
} from './tree.ts'

// The generator's checks over a tree as read (DOM-22, DOM-24, DOM-25): what
// the files it writes would say only through the type errors, or the faults
// at runtime, they cause, named first in the tree's words, one line each
// (`file:line  rule  sentence`, provisional: A to confirm). Pure: the shell
// gives the runtime's answers (an object's identity, the components its parts
// hold) in the tree as read.

/** What the tree names: a component or a value under its path, or a component's input under `<name>_input`. */
interface Named {
  readonly path: string
  /** The registry it is in: the current version's (''), or a past major's folder. */
  readonly major: string
  readonly folder: Folder
  readonly file: AuthoredFile
  readonly exported: Export
  readonly input: boolean
  readonly identity: Identity | undefined
}

const where = (folder: Folder, authored: AuthoredFile): string =>
  [...folder.segments, `${authored.stem}.ts`].join('/')

const shown = (folder: Folder): string => folder.segments.join('/')

/** The past major's folder a folder is in (`business/loans/1`), or '' for the current version. */
const major_folder = (folder: Folder): string => {
  const index = folder.segments.findIndex(is_a_major)
  return index === -1 ? '' : folder.segments.slice(0, index + 1).join('/')
}

/** Every path the tree names, in the order of its folders, files and sources (DOM-24). */
const named = (tree: Tree): readonly Named[] =>
  tree.folders.flatMap((folder) =>
    folder.files.flatMap((authored) =>
      authored.exports.flatMap((exported) =>
        entries_of(folder, authored, exported).map((entry) => ({
          path: entry.path,
          major: major_folder(folder),
          folder,
          file: authored,
          exported,
          input: entry.input,
          identity:
            exported.value === undefined || exported.value.is === 'other'
              ? undefined
              : entry.input
                ? exported.value.is === 'component'
                  ? exported.value.input_identity
                  : undefined
                : exported.value.identity,
        })),
      ),
    ),
  )

const at = (one: Named): Pick<Failure, 'path' | 'line'> => ({
  path: where(one.folder, one.file),
  line: one.exported.line,
})

/** The pairs among these that one key gives twice: each with the first that gave it. */
const twice = <item>(
  items: readonly item[],
  key: (item: item) => string | undefined,
): readonly { readonly first: item; readonly again: item }[] =>
  items.flatMap((item, index) => {
    const mine = key(item)
    if (mine === undefined) return []
    const first = items.slice(0, index).find((other) => key(other) === mine)
    return first === undefined ? [] : [{ first, again: item }]
  })

/**
 * One object, one path (DOM-24): the library finds a component's path by
 * object identity, so an object the tree names twice, as two exports or as an
 * export and an input, has no path of its own.
 */
const one_object_one_path = (all: readonly Named[]): readonly Failure[] =>
  twice(all, (one) => (one.identity === undefined ? undefined : String(one.identity))).map(
    ({ first, again }) => ({
      ...at(again),
      rule: 'DOM-24',
      sentence:
        first.input || again.input
          ? `${again.path} and ${first.path} are one object: one object, one path`
          : `${first.path} is exported twice, as ${shown(first.folder) === shown(again.folder) ? `${first.exported.name} and ${again.exported.name}` : `${first.path} and ${again.path}`}: one object, one path`,
    }),
  )

const named_as = (one: Named): string =>
  one.input
    ? `as the input of ${one.exported.name} in ${one.file.stem}.ts`
    : `in ${one.file.stem}.ts`

/**
 * A name is unique per folder and kind (DOM-25): two components of one kind
 * with one name in a folder, or a component named as another's input, would
 * be one path for two objects.
 */
const one_name_per_folder_and_kind = (all: readonly Named[]): readonly Failure[] =>
  twice(all, (one) => `${one.major}|${one.path}`).map(({ first, again }) => ({
    ...at(again),
    rule: 'DOM-25',
    sentence: `${again.path} is declared twice, ${named_as(first)} and ${named_as(again)}: a name is unique per folder and kind`,
  }))

const singular: Readonly<Record<Built['kind'], string>> = {
  id: 'an identity',
  fact: 'a fact',
  predicate: 'a predicate',
  selection: 'a selection predicate',
  calculation: 'a calculation',
  effect: 'an effect',
  command: 'a command',
  query: 'a query',
  usecase: 'a use case',
  lookup: 'a lookup',
  node: 'a node',
  reaction: 'a reaction',
  version: 'a version',
  condition: 'a condition',
}

/**
 * A component reachable is exported (DOM-25): one that another holds and no
 * file exports has no path, and the library could not tell it. Checked once
 * every file is imported, since an export not yet imported tells nothing.
 */
const reachable_and_exported = (tree: Tree, all: readonly Named[]): readonly Failure[] => {
  const exports = tree.folders.flatMap((folder) =>
    folder.files.flatMap((authored) =>
      authored.exports.map((exported) => ({ folder, authored, exported })),
    ),
  )
  if (exports.some(({ exported }) => exported.value === undefined)) return []
  const known = new Set(all.flatMap((one) => (one.identity === undefined ? [] : [one.identity])))
  return exports.flatMap(({ folder, authored, exported }) => {
    const value = exported.value
    if (value?.is !== 'component') return []
    const path = entries_of(folder, authored, exported)[0]?.path ?? exported.name
    return value.holds
      .filter((held) => !known.has(held.identity))
      .filter(
        (held, index, holds) => holds.findIndex((one) => one.identity === held.identity) === index,
      )
      .map((held) => ({
        path: where(folder, authored),
        line: exported.line,
        rule: 'DOM-25',
        sentence: `${path} holds ${singular[held.built.kind]} that no file exports: a component it reaches is exported, so that it has a path`,
      }))
  })
}

/**
 * Two ancestors with one name (DOM-25): a scope carries every ancestor under
 * its name prefixed with `_`, whatever the distance, so two would be one name.
 */
const ancestors_by_name = (tree: Tree): readonly Failure[] => {
  const clashes = tree.folders.flatMap((folder) =>
    twice(ancestors_of(tree, folder.segments), (ancestor) => ancestor.at(-1)).map(
      ({ first, again }) => ({ first: first.join('/'), again: again.join('/') }),
    ),
  )
  return clashes
    .filter((clash, index) => clashes.findIndex((other) => other.again === clash.again) === index)
    .map(({ first, again }) => ({
      path: `${again}/_door_below.ts`,
      line: 1,
      rule: 'DOM-25',
      sentence: `${again} has the name of its ancestor ${first}: the scopes below it would carry both as _${again.split('/').at(-1) ?? ''}`,
    }))
}

/** The first authored file of a folder, line 1: where a failure of the folder is told. */
const first_file = (folder: Folder): Pick<Failure, 'path' | 'line'> => ({
  path: [...folder.segments, `${folder.files[0]?.stem ?? '_scope'}.ts`].join('/'),
  line: 1,
})

/**
 * A past major's folder (DOM-22): of a domain that declares its version, from
 * which its majors are listed (`_majors.ts`), and below its current major.
 */
const past_majors = (tree: Tree): readonly Failure[] =>
  tree.folders.flatMap((folder) => {
    const major = major_of(folder)
    if (major === undefined) return []
    const domain = folder.segments.slice(0, -1)
    const at_domain = folder_at(tree, domain)
    const current = at_domain === undefined ? undefined : current_major(at_domain)
    if (current === undefined) {
      return [
        {
          ...first_file(folder),
          rule: 'DOM-22',
          sentence: `${shown(folder)} is a past major of ${domain.join('/')}, which declares no version: the majors of a domain are listed from its version`,
        },
      ]
    }
    return major < current
      ? []
      : [
          {
            ...first_file(folder),
            rule: 'DOM-22',
            sentence: `${shown(folder)} is a past major, and ${domain.join('/')} is at major ${String(current)}: a past major is below the current one`,
          },
        ]
  })

/** The kinds of the vocabulary whose scope takes its builders from the point (`_scope.ts`). */
const from_the_point: readonly FileKind[] = below.node.filter(
  (kind) => builders_of[kind].length > 0,
)

/**
 * A folder with a node holds no vocabulary that builds (DOM-25, the layers):
 * its scope would take its builders from the point, whose context is the
 * node's, and the node's scope gives the vocabulary of its folder, a cycle.
 */
const nodes_and_their_vocabulary = (tree: Tree): readonly Failure[] =>
  tree.folders.flatMap((folder) =>
    node_of(folder) === undefined
      ? []
      : from_the_point.flatMap((kind) =>
          files_of(folder, kind).map((authored) => ({
            path: where(folder, authored),
            line: 1,
            rule: 'DOM-25',
            sentence: `${shown(folder)} holds a node and ${plural_of[kind]}: their scope takes its builders from the point, which reads the node's context, and the node's scope gives them, a cycle of the layers`,
          })),
        ),
  )

/**
 * A folder below a domain is reached through its parent (DOM-25): the doors
 * and the registries carry the folders right below theirs, so one under a
 * folder with no file of its own would be in neither, until a case asks how
 * an empty folder carries it.
 */
const folders_through_their_parent = (tree: Tree): readonly Failure[] =>
  tree.folders
    .filter((folder) => folder.segments.length > 2 && !folder.segments.some(is_a_major))
    .flatMap((folder) => {
      const parent = folder.segments.slice(0, -1)
      return folder_at(tree, parent) === undefined
        ? [
            {
              ...first_file(folder),
              rule: 'DOM-25',
              sentence: `${shown(folder)} holds files, and ${parent.join('/')} none: the doors and the registries carry a folder through its parent, so it would be in neither`,
            },
          ]
        : []
    })

/** The checks of a tree, each failure one line (DOM-22, DOM-24, DOM-25). */
export const checks = (tree: Tree): readonly Failure[] => {
  const all = named(tree)
  return [
    ...one_object_one_path(all),
    ...one_name_per_folder_and_kind(all),
    ...reachable_and_exported(tree, all),
    ...ancestors_by_name(tree),
    ...past_majors(tree),
    ...nodes_and_their_vocabulary(tree),
    ...folders_through_their_parent(tree),
  ]
}

/** A major's registry as released (DOM-24): its domain's folder from the root, its major, its paths. */
export interface Released {
  readonly domain: string
  readonly major: number
  readonly paths: readonly string[]
}

/**
 * A component forgotten (DOM-22, DOM-24): every path a major was released
 * with is still in its registry, the current's while the major is current,
 * its folder's once it is past, written whole or delegated; a major no
 * longer in the tree has left the window (D101). What a major was released
 * with is not in the tree: CI gives it, from `main` (part 3.6).
 */
export const forgotten = (tree: Tree, released: readonly Released[]): readonly Failure[] =>
  released.flatMap((one) => {
    const segments = one.domain.split('/')
    const domain = folder_at(tree, segments)
    const past = folder_at(tree, [...segments, String(one.major)])
    const current = domain === undefined ? undefined : current_major(domain)
    const folder = current === one.major ? domain : past
    if (folder === undefined) return []
    const kept = new Set(registry_paths(tree, folder))
    const name = segments.at(-1) ?? ''
    return one.paths
      .filter((path) => !kept.has(path))
      .map((path) => {
        const kind = path.split('/')[path_segments(folder.segments).length]
        const authored = folder.files.find((file) => file.kind === kind)
        return {
          path:
            authored === undefined
              ? [...folder.segments, '_registry.ts'].join('/')
              : where(folder, authored),
          line: 1,
          rule: folder === past ? 'DOM-22' : 'DOM-24',
          sentence:
            folder === past
              ? `${path} was released at ${name} ${String(one.major)}.x, and ${shown(folder)} has it not: a past major keeps every component it was released with, written whole or delegated`
              : `${path} was released at ${name} ${String(one.major)}.x, and is no longer there: a path disappears only with a major, kept in its folder`,
        }
      })
  })
