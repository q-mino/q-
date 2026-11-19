import { branded, plural_of } from './kinds.ts'
import type { AuthoredFile, Export, Folder, GeneratedFile, Input, Tree } from './model.ts'
import { file, jsdoc, wrap } from './text.ts'
import { library_from, major_of, path_segments } from './tree.ts'

// The twin of an authored file (DOM-25): `_x.ts` beside `x.ts`, which the
// rest of the code imports. Every component under its name, the same object
// as the author's; every schema with its output type under the same name, so
// that one import gives both; identities, facts, predicates, selection
// predicates, calculations and effects branded with their path (DOM-24), a
// past major's with its major too (DOM-22); the input a builder declares
// inline under `<name>_input` (a delegated leaf's delegated to the next
// major's, DOM-24); a node's context, closes and accumulated for the point
// of its folder (PER-6, SC-31); the author's JSDoc with a link to the
// authored member. The twin of a file of `dsl` re-exports it whole.

/** The twin of an authored file of a folder, from what the runtime says of its exports. */
export const twin = (tree: Tree, folder: Folder, authored: AuthoredFile): GeneratedFile => {
  const path = [...folder.segments, `_${authored.stem}.ts`].join('/')
  const shown = `\`${folder.segments.join('/')}\``
  if (authored.kind === 'dsl') {
    return {
      path,
      text: file(
        wrap(
          `The ${plural_of.dsl} of ${shown} from \`${authored.stem}.ts\` (DOM-5, DOM-25): the code imports them from here.`,
        ),
        [`export * from './${authored.stem}.ts'`],
      ),
    }
  }
  const alias = authored.kind
  const members = authored.exports.flatMap((exported) => members_of(folder, alias, exported))
  const typed = members.some((member) => member.includes('z.output<'))
  const delegated = members.some((member) => member.includes('= delegate(next.'))
  return {
    path,
    text: file(
      wrap(
        `The ${plural_of[authored.kind]} of ${shown} from \`${authored.stem}.ts\` (DOM-25): the same objects under the same names, ${branded.has(authored.kind) ? 'branded with their path (DOM-24), ' : ''}each schema with its output type under the same name, so that one import gives both. Only this module imports \`${authored.stem}.ts\`.`,
      ),
      [
        [
          ...(typed ? [`import { z } from 'zod'`] : []),
          ...(authored.kind === 'node'
            ? [`import type * as wlib from '${library_from(tree, folder.segments)}'`]
            : []),
          ...(delegated ? [`import { delegate, next } from './_scope_${authored.kind}.ts'`] : []),
          `import * as ${alias} from './${authored.stem}.ts'`,
        ].join('\n'),
        ...members,
      ],
    ),
  }
}

const see = (alias: string, name: string): readonly string[] => [`@see {@link ${alias}.${name}}`]

const output_of = (name: string): string => `export type ${name} = z.output<typeof ${name}>`

/** The path of a component, as its brand's literal (DOM-24): its folders, its kind, its subject, its name, a past major's major. */
const path_of = (folder: Folder, exported: Export): string | undefined => {
  const value = exported.value
  if (value?.is !== 'component') return undefined
  const built = value.built
  const subject = 'subject' in built ? [built.subject] : []
  const major = major_of(folder)
  const version = value.past.is === 'earlier' && major !== undefined ? `@${String(major)}` : ''
  return `${[...path_segments(folder.segments), built.kind, ...subject, exported.name].join('/')}${version}`
}

const input_of = (
  alias: string,
  name: string,
  input: Input,
  doc: readonly string[],
): readonly string[] =>
  input === 'none'
    ? []
    : [
        [
          jsdoc([[`The input of \`${name}\`, declared inline.`], doc, see(alias, name)]),
          `export const ${name}_input = ${alias}.${name}.input`,
          input === 'schema'
            ? output_of(`${name}_input`)
            : `export type ${name}_input = z.output<ReturnType<typeof ${name}_input>>`,
        ].join('\n'),
      ]

/** The members of the twin for an export of the authored file, each a block of lines. */
const members_of = (folder: Folder, alias: string, exported: Export): readonly string[] => {
  const name = exported.name
  const value = exported.value
  const doc = jsdoc([exported.doc, see(alias, name)])
  const plain = `export const ${name} = ${alias}.${name}`
  if (value === undefined || value.is === 'other') return []
  if (value.is === 'value') return [[doc, plain, output_of(name)].join('\n')]
  const kind = value.built.kind
  if (value.past.is === 'delegated') {
    return [
      [doc, plain].join('\n'),
      ...(kind === 'usecase' && value.past.next_input !== 'none'
        ? [
            [
              jsdoc([
                [`The input of \`${name}\`, delegated to the next major's (DOM-24, PER-17).`],
                see(alias, name),
              ]),
              `export const ${name}_input = delegate(next.${name}_input)`,
              `export type ${name}_input = next.${name}_input`,
            ].join('\n'),
          ]
        : []),
    ]
  }
  switch (kind) {
    case 'condition':
      return [[doc, plain, output_of(name)].join('\n')]
    case 'id':
    case 'fact':
    case 'predicate':
    case 'selection':
    case 'calculation':
    case 'effect':
      return [
        [
          doc,
          `export const ${name} = ${alias}.${name}.brand<'${path_of(folder, exported) ?? ''}'>()`,
          output_of(name),
        ].join('\n'),
      ]
    case 'command':
    case 'query':
    case 'usecase':
      return [[doc, plain].join('\n'), ...input_of(alias, name, value.input, exported.input_doc)]
    case 'node':
      return [
        [doc, plain].join('\n'),
        [
          `/** The context the node \`${name}\` gives to everything below it. */`,
          `export type ${name}_context = wlib.ContextOf<typeof ${name}>`,
        ].join('\n'),
        [
          `/** How the node \`${name}\` and the nodes above it may close a request (PER-14), for the leaves below it. */`,
          `export type ${name}_closes = wlib.ClosesOf<typeof ${name}>`,
        ].join('\n'),
        [
          `/** What the node \`${name}\` and the nodes above it add to the commands below it (D105, SC-31). */`,
          `export type ${name}_accumulated = wlib.AccumulatedOf<typeof ${name}>`,
        ].join('\n'),
      ]
    case 'lookup':
    case 'reaction':
    case 'version':
      return [[doc, plain].join('\n')]
  }
}
