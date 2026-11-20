import type { ConstructKind } from '@q-mino/domains/library'
import type { AuthoredFile, FileKind, Folder, NodeParts, Tree } from './model.ts'

// The structure of a tree (DOM-25): past majors, nodes, ancestors, the doors a
// folder sees, and the paths between folders. Pure, over the tree as read.

/** Whether a segment is a past major of its domain (`business/loans/1/`): a number (DOM-22, DOM-25). */
export const is_a_major = (segment: string): boolean => /^[0-9]+$/.test(segment)

/** The major a folder holds, if it is a past major's. */
export const major_of = (folder: Folder): number | undefined => {
  const last = folder.segments.at(-1)
  return last !== undefined && is_a_major(last) ? Number(last) : undefined
}

/** The segments of a path, the past majors' folders left out: the path names a component in every version (DOM-22, DOM-24). */
export const path_segments = (segments: readonly string[]): readonly string[] =>
  segments.filter((segment) => !is_a_major(segment))

/** The folder of a tree at these segments, if it holds an authored file. */
export const folder_at = (tree: Tree, segments: readonly string[]): Folder | undefined =>
  tree.folders.find((folder) => same(folder.segments, segments))

const same = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && a.every((segment, index) => segment === b[index])

const is_a_prefix = (prefix: readonly string[], of: readonly string[]): boolean =>
  prefix.length <= of.length && prefix.every((segment, index) => segment === of[index])

/** The files of a folder of a kind. */
export const files_of = (folder: Folder, kind: FileKind): readonly AuthoredFile[] =>
  folder.files.filter((file) => file.kind === kind)

/** A node of the tree: its folder, its name, and what its declaration adds to the types, once imported. */
export interface NodeAbove {
  readonly segments: readonly string[]
  readonly name: string
  readonly parts: NodeParts
}

/** The node of a folder, if it has one (PER-6): the export of its node file. */
export const node_of = (folder: Folder): NodeAbove | undefined =>
  files_of(folder, 'node')
    .flatMap((file) => file.exports)
    .map((exported) => ({
      segments: folder.segments,
      name: exported.name,
      parts:
        exported.value?.is === 'component' && exported.value.node !== undefined
          ? exported.value.node
          : { closes: false, accumulates: false, takes: false },
    }))[0]

/**
 * The nodes above a point of the tree, nearest first: from the folder (`at`),
 * or from the folder above it (`above`, for the point of the node itself).
 */
export const nodes_above = (
  tree: Tree,
  segments: readonly string[],
  from: 'at' | 'above',
): readonly NodeAbove[] => {
  const highest = segments.length - (from === 'at' ? 0 : 1)
  return Array.from({ length: Math.max(highest, 0) }, (_, index) =>
    segments.slice(0, highest - index),
  ).flatMap((at) => {
    const mount = mount_at(tree, at)
    if (mount !== undefined) return [mount]
    const folder = folder_at(tree, at)
    const node = folder === undefined ? undefined : node_of(folder)
    return node === undefined ? [] : [node]
  })
}

/**
 * A folder mounted below a node of another tree (EXT-11), met as a node
 * above the points below it, named by its last segment (`known`): its
 * `_node.ts` gives their context, which no node of the tree takes.
 */
export const mount_at = (tree: Tree, segments: readonly string[]): NodeAbove | undefined => {
  const name = segments.at(-1)
  return name !== undefined && tree.mounted?.[segments.join('/')] !== undefined
    ? { segments, name, parts: { closes: false, accumulates: false, takes: false } }
    : undefined
}

/** The ancestors of a folder that hold authored files, outer first: each is seen through its door to the folders below (DOM-25). */
export const ancestors_of = (tree: Tree, segments: readonly string[]): readonly string[][] =>
  tree.folders
    .map((folder) => [...folder.segments])
    .filter((at) => at.length < segments.length && is_a_prefix(at, segments))
    .sort((a, b) => a.length - b.length)

/** A door a folder sees: the folder it opens, by its name, and the path of the door. */
export interface Door {
  readonly name: string
  readonly segments: readonly string[]
  readonly file: string
}

/**
 * The doors the map opens to a folder (`sight.ts`, DOM-25): of every folder
 * under a first segment its map names, the domain's folder (`business/tools/`)
 * and its door to the folder's first segment (`_door_persona.ts`), with the
 * kinds the map lists, which `carried` filters; never its own domain's.
 */
export const doors_of = (
  tree: Tree,
  segments: readonly string[],
  carried: (kinds: readonly ConstructKind[]) => boolean,
): readonly Door[] => {
  const top = segments[0]
  if (top === undefined) return []
  const seen = tree.sight[top] ?? {}
  return Object.entries(seen)
    .filter(([, kinds]) => carried(kinds))
    .flatMap(([seen_top]) =>
      [
        ...new Set(
          tree.folders
            .filter((folder) => folder.segments[0] === seen_top && folder.segments.length > 1)
            .map((folder) => folder.segments[1] ?? ''),
        ),
      ]
        .filter((name) => !is_a_prefix([seen_top, name], segments))
        .sort()
        .map((name) => ({ name, segments: [seen_top, name], file: `_door_${top}.ts` })),
    )
}

/** The path of a file of a folder, from another folder (`../loans/_door_business.ts`). */
export const relative = (from: readonly string[], to: readonly string[], file: string): string => {
  const differs = from.findIndex((segment, index) => segment !== to[index])
  const common = differs === -1 ? Math.min(from.length, to.length) : differs
  const up = from.length - common
  return [
    ...(up === 0 ? ['.'] : Array.from({ length: up }, () => '..')),
    ...to.slice(common),
    file,
  ].join('/')
}

/** The path of the library's module from a folder (`../../../../src/library/index.ts`). */
export const library_from = (tree: Tree, segments: readonly string[]): string =>
  relative(segments, [], tree.library)

/** The domain of a past major's folder, and the folder of the next major: a later past major's, or the domain's (DOM-22). */
export const next_major_of = (
  tree: Tree,
  folder: Folder,
): { readonly domain: readonly string[]; readonly next: readonly string[] } | undefined => {
  const major = major_of(folder)
  if (major === undefined) return undefined
  const domain = folder.segments.slice(0, -1)
  const later = tree.folders
    .filter((other) => same(other.segments.slice(0, -1), domain))
    .map((other) => major_of(other))
    .filter((other): other is number => other !== undefined && other > major)
    .sort((a, b) => a - b)[0]
  return { domain, next: later === undefined ? domain : [...domain, String(later)] }
}
