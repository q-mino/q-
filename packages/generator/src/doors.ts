import type { ConstructKind } from '@q-mino/domains/library'
import { layer_order, plural_of } from './kinds.ts'
import type { Failure, Folder, GeneratedFile, Tree } from './model.ts'
import { file, wrap } from './text.ts'
import { files_of, folder_at, is_a_major, major_of } from './tree.ts'

// The doors of a folder (DOM-25). A door to an audience, `_door_<audience>.ts`
// (`business/tools/_door_persona.ts`): what the map lets the folders under
// that first segment see of a domain's folder, a namespace per kind of
// construct, in the order the map lists them, and the doors of the folders
// below it, its subtree (D105), under their names. A door to the folders
// below, `_door_below.ts`: every twin of a folder, each a namespace by its
// file's name, which the scopes below carry as the ancestor (`_persona`).
// Neither needs the runtime: the shell writes them before it imports a file.

/** A namespace a door exports: its name and the module it re-exports. */
interface Namespace {
  readonly name: string
  readonly module: string
}

const exported = (namespace: Namespace): string =>
  `export * as ${namespace.name} from '${namespace.module}'`

const at = (folder: Folder, name: string): string => [...folder.segments, name].join('/')

const shown = (segments: readonly string[]): string => `\`${segments.join('/')}\``

const listed = (names: readonly string[]): string => names.join(', ')

/** The folders right below a folder, a past major's left out: it is outside the path, and nothing sees it (DOM-22). */
const children_of = (tree: Tree, folder: Folder): readonly Folder[] =>
  tree.folders
    .filter(
      (other) =>
        other.segments.length === folder.segments.length + 1 &&
        folder.segments.every((segment, index) => segment === other.segments[index]) &&
        major_of(other) === undefined,
    )
    .sort((a, b) => (a.segments.at(-1) ?? '').localeCompare(b.segments.at(-1) ?? ''))

/** The audiences of a folder: the first segments whose map lists its own, with the kinds listed. */
const audiences_of = (
  tree: Tree,
  folder: Folder,
): readonly { readonly audience: string; readonly kinds: readonly ConstructKind[] }[] => {
  const top = folder.segments[0]
  return Object.entries(tree.sight).flatMap(([audience, seen]) => {
    const kinds = top === undefined ? undefined : seen[top]
    return kinds === undefined ? [] : [{ audience, kinds }]
  })
}

/** What a door of a folder to an audience exposes: the namespaces, and a failure for a kind it cannot give as one. */
interface Door {
  readonly namespaces: readonly Namespace[]
  readonly kinds: readonly string[]
  readonly below: readonly string[]
  readonly failures: readonly Failure[]
}

/**
 * The door of a folder to an audience: a namespace per kind the map lists and
 * the folder holds, from its one file of that kind, then the door of every
 * folder below it that exposes something, under its name. Two files of a
 * kind the map opens cannot make one namespace: the generator stops, until a
 * case asks how a door joins them.
 */
const door = (
  tree: Tree,
  folder: Folder,
  audience: string,
  kinds: readonly ConstructKind[],
): Door => {
  const path = at(folder, `_door_${audience}.ts`)
  const own = kinds.flatMap((kind) => {
    const files = files_of(folder, kind)
    return files.length === 0 ? [] : [{ kind, files }]
  })
  const below = children_of(tree, folder)
    .filter((child) => door(tree, child, audience, kinds).namespaces.length > 0)
    .map((child) => child.segments.at(-1) ?? '')
  return {
    namespaces: [
      ...own.flatMap(({ kind, files }) =>
        files.length === 1 ? [{ name: kind, module: `./_${files[0]?.stem ?? kind}.ts` }] : [],
      ),
      ...below.map((name) => ({ name, module: `./${name}/_door_${audience}.ts` })),
    ],
    kinds: own.map(({ kind }) => kind),
    below,
    failures: own
      .filter(({ files }) => files.length > 1)
      .map(({ kind, files }) => ({
        path,
        line: 1,
        rule: 'DOM-25',
        sentence: `${folder.segments.join('/')} holds ${String(files.length)} files of ${plural_of[kind]} (${files.map((one) => `${one.stem}.ts`).join(', ')}), which the map opens to ${audience}: a door gives one namespace per kind, from one file`,
      })),
  }
}

/** Whether the folders under a first segment see a folder through a door (DOM-25): the map lists its kinds there, and the door exposes something. */
export const has_a_door = (tree: Tree, segments: readonly string[], audience: string): boolean => {
  const folder = folder_at(tree, segments)
  const top = segments[0]
  const kinds = top === undefined ? undefined : tree.sight[audience]?.[top]
  return (
    folder !== undefined &&
    kinds !== undefined &&
    door(tree, folder, audience, kinds).namespaces.length > 0
  )
}

/** The doors of a folder to the audiences of the map, each one that exposes something. */
const audience_doors = (
  tree: Tree,
  folder: Folder,
): { readonly files: readonly GeneratedFile[]; readonly failures: readonly Failure[] } => {
  const doors = audiences_of(tree, folder).map(({ audience, kinds }) => ({
    audience,
    door: door(tree, folder, audience, kinds),
  }))
  return {
    files: doors
      .filter(({ door: one }) => one.namespaces.length > 0)
      .map(({ audience, door: one }) => ({
        path: at(folder, `_door_${audience}.ts`),
        text: file(
          wrap(
            `The door of ${shown(folder.segments)} for the folders under \`${audience}\` (DOM-25): what the map lets them see of it, ${listed([...one.kinds, ...one.below])}, each a namespace${folder.segments.length > 2 ? `; the door of ${shown(folder.segments.slice(0, -1))} carries it under the folder's name` : ''}. Nothing else of the folder can be named from there.`,
          ),
          [one.namespaces.map(exported).join('\n')],
        ),
      })),
    failures: doors.flatMap(({ door: one }) => one.failures),
  }
}

/** Whether a folder has a folder below it that is not a past major's, whose scopes carry it as an ancestor (DOM-25). */
const has_folders_below = (tree: Tree, folder: Folder): boolean =>
  tree.folders.some(
    (other) =>
      other.segments.length > folder.segments.length &&
      folder.segments.every((segment, index) => segment === other.segments[index]) &&
      !other.segments.slice(folder.segments.length).some(is_a_major),
  )

/** The door of a folder to the folders below it (`_door_below.ts`): every twin of the folder, each a namespace, in the order of the layers, then by name. */
const below_door = (tree: Tree, folder: Folder): readonly GeneratedFile[] =>
  has_folders_below(tree, folder)
    ? [
        {
          path: at(folder, '_door_below.ts'),
          text: file(
            wrap(
              `The door of ${shown(folder.segments)} to the folders below it (DOM-25): what a file sees above it, as a lexical scope, every twin of the folder, each a namespace; the scopes below carry it under the folder's name prefixed with \`_\` (\`_${folder.segments.at(-1) ?? ''}\`), so that it meets no name of their own. No folder imports those below it, so no import goes round.`,
            ),
            [
              layer_order
                .flatMap((kind) =>
                  files_of(folder, kind)
                    .map((authored) => authored.stem)
                    .sort(),
                )
                .map((stem) => exported({ name: stem, module: `./_${stem}.ts` }))
                .join('\n'),
            ],
          ),
        },
      ]
    : []

/** The doors of every folder of a tree, and the failures met writing them. A past major's folder has none: nothing sees it. */
export const doors = (
  tree: Tree,
): { readonly files: readonly GeneratedFile[]; readonly failures: readonly Failure[] } => {
  const current = tree.folders.filter((folder) => !folder.segments.some(is_a_major))
  const audiences = current
    .filter((folder) => folder.segments.length > 1)
    .map((folder) => audience_doors(tree, folder))
  return {
    files: [
      ...current.flatMap((folder) => below_door(tree, folder)),
      ...audiences.flatMap((one) => one.files),
    ],
    failures: audiences.flatMap((one) => one.failures),
  }
}
