import type { Failure, GeneratedFile, Tree } from './model.ts'
import { file, wrap } from './text.ts'
import { files_of, folder_at, library_from, node_of } from './tree.ts'

// The folders mounted below a node of another tree (EXT-11, PER-6, "A
// mounted folder"): their point takes the context that node gives there, as
// the configuration names it, and no node of theirs takes (D78.6, D105.2: a
// mount inherits the constraints of where it sits, and binds nothing again).
// The generator writes each point's `_node.ts`, the one module of the tree
// that imports the context's schemas, which the scopes below read as they
// read a node's; it knows only the names the configuration gives, never what
// they mean.

const shown = (path: string): string => `\`${path}\``

/** The `_node.ts` of every mounted folder, and the failures: a folder outside the map, a node in a mounted folder, a node that takes below one. */
export const mounts = (
  tree: Tree,
): { readonly files: readonly GeneratedFile[]; readonly failures: readonly Failure[] } => {
  const mounted = Object.entries(tree.mounted ?? {})
  const files = mounted.map(([path, mount]): GeneratedFile => {
    const segments = path.split('/')
    const name = segments.at(-1) ?? ''
    const imports = [...mount.context].sort()
    return {
      path: `${path}/_node.ts`,
      text: file(
        wrap(
          `The point of ${shown(path)}, mounted below a node of another tree (EXT-11): the context that node gives here, ${imports.length === 0 ? "the root's alone" : `composed of the schemas ${shown(mount.from)} exports by these names`} (PER-6, "A mounted folder"). The one module of the tree that ${imports.length === 0 ? 'gives it' : 'imports them'}; the scopes below read the context from here, and no node takes it again (D105.2).`,
        ),
        [
          [
            `import * as z from 'zod'`,
            `import type * as zz from '${library_from(tree, segments)}'`,
            ...(imports.length === 0
              ? []
              : [`import { ${imports.join(', ')} } from '${mount.from}'`]),
          ].join('\n'),
          [
            `/** The folder ${shown(path)}, mounted: the context given to everything below it, from outside (EXT-11). */`,
            `export const ${name} = {`,
            `  mounted: '${path}',`,
            `  context: z.strictObject({${mount.context.map((schema) => ` ...${schema}.shape`).join(',')}${imports.length === 0 ? '' : ' '}}),`,
            `} satisfies zz.Mounted`,
          ].join('\n'),
          [
            `/** The context given at the mounted folder \`${name}\` to everything below it. */`,
            `export type ${name}_context = zz.ContextOf<typeof ${name}>`,
          ].join('\n'),
        ],
      ),
    }
  })
  const failures = mounted.flatMap(([path]): readonly Failure[] => {
    const segments = path.split('/')
    const top = segments[0] ?? ''
    if (segments.length < 2 || tree.sight[top] === undefined) {
      return [
        {
          path: `${path}/`,
          line: 1,
          rule: 'EXT-11',
          sentence: `is mounted, but is no folder under a top its map names: a mounted folder sits in the tree (generator.config.ts)`,
        },
      ]
    }
    const own = folder_at(tree, segments)
    const in_it =
      own === undefined || node_of(own) === undefined
        ? []
        : [
            {
              path: `${path}/${files_of(own, 'node')[0]?.stem ?? 'node'}.ts`,
              line: 1,
              rule: 'EXT-11',
              sentence: `holds a node in a mounted folder, whose point the context given from outside holds (_node.ts): a node that adds goes in a folder below`,
            },
          ]
    const below = tree.folders
      .filter(
        (folder) =>
          folder.segments.length > segments.length &&
          segments.every((segment, index) => folder.segments[index] === segment),
      )
      .flatMap((folder) => {
        const node = node_of(folder)
        return node?.parts.takes === true
          ? [
              {
                path: `${folder.segments.join('/')}/${files_of(folder, 'node')[0]?.stem ?? 'node'}.ts`,
                line: 1,
                rule: 'EXT-11',
                sentence: `the node ${node.name} takes, below the mounted folder ${shown(path)}, whose context is given from outside (D105.2): a node below may add, never take`,
              },
            ]
          : []
      })
    return [...in_it, ...below]
  })
  return { files, failures }
}
