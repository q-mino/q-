import ts from 'typescript'
import type { FileKind } from '../src/index.ts'

// What the generator reads in a source, which the runtime does not keep
// (DOM-25): the scope an authored file imports, the names it exports in
// order, their JSDoc and the JSDoc of an input declared inline; and the
// runtime imports of any module of the tree, for the order of the imports.

/** What the source of an authored file says. */
export interface Source {
  /** The kind of the scope it imports (`./_scope_command.ts`), if it imports one. */
  readonly scope: FileKind | undefined
  readonly exports: readonly {
    readonly name: string
    readonly doc: readonly string[]
    readonly input_doc: readonly string[]
  }[]
}

const parse = (path: string, text: string): ts.SourceFile =>
  ts.createSourceFile(path, text, ts.ScriptTarget.ES2024, true, ts.ScriptKind.TS)

const kinds: readonly FileKind[] = [
  'id',
  'value',
  'dsl',
  'fact',
  'predicate',
  'selection',
  'calculation',
  'effect',
  'lookup',
  'command',
  'query',
  'usecase',
  'node',
  'reaction',
  'version',
]

const kind_named = (name: string): FileKind | undefined => kinds.find((kind) => kind === name)

/** The lines of the JSDoc right before a node, as written; none if it has none. */
const doc_of = (text: string, node: ts.Node): readonly string[] => {
  const ranges = ts.getLeadingCommentRanges(text, node.getFullStart()) ?? []
  const last = ranges
    .filter((range) => range.kind === ts.SyntaxKind.MultiLineCommentTrivia)
    .map((range) => text.slice(range.pos, range.end))
    .filter((comment) => comment.startsWith('/**'))
    .at(-1)
  if (last === undefined) return []
  const lines = last
    .slice(3, -2)
    .split('\n')
    .map((line) => line.replace(/^\s*\*?\s?/, '').trimEnd())
  const first = lines.findIndex((line) => line.trim() !== '')
  const end = lines.findLastIndex((line) => line.trim() !== '')
  return first === -1
    ? []
    : lines.slice(first, end + 1).map((line) => (line.trim() === '' ? '' : line))
}

/** The JSDoc of the first `input` declared inline in an object given to a builder. */
const input_doc_of = (text: string, node: ts.Node): readonly string[] => {
  const found = (at: ts.Node): ts.PropertyAssignment | undefined =>
    ts.isPropertyAssignment(at) && ts.isIdentifier(at.name) && at.name.text === 'input'
      ? at
      : ts.forEachChild(at, found)
  const input = found(node)
  return input === undefined ? [] : doc_of(text, input)
}

/** What the source of an authored file says. */
export const read_source = (path: string, text: string): Source => {
  const source = parse(path, text)
  const scope = source.statements
    .filter(ts.isImportDeclaration)
    .map((declaration) => declaration.moduleSpecifier)
    .filter(ts.isStringLiteral)
    .map((specifier) => /^\.\/_scope_([a-z]+)\.ts$/.exec(specifier.text)?.[1])
    .find((kind) => kind !== undefined)
  const exports = source.statements
    .filter(ts.isVariableStatement)
    .filter((statement) =>
      (ts.getModifiers(statement) ?? []).some(
        (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
      ),
    )
    .flatMap((statement) =>
      statement.declarationList.declarations.flatMap((declaration) =>
        ts.isIdentifier(declaration.name)
          ? [
              {
                name: declaration.name.text,
                doc: doc_of(text, statement),
                input_doc:
                  declaration.initializer === undefined
                    ? []
                    : input_doc_of(text, declaration.initializer),
              },
            ]
          : [],
      ),
    )
  return { scope: scope === undefined ? undefined : kind_named(scope), exports }
}

/**
 * The relative modules a module imports at runtime, as written: a declaration
 * `import type` or `export type` is erased, and reaches nothing.
 */
export const runtime_imports = (path: string, text: string): readonly string[] =>
  parse(path, text)
    .statements.flatMap((statement) => {
      if (ts.isImportDeclaration(statement)) {
        return statement.importClause?.phaseModifier === ts.SyntaxKind.TypeKeyword
          ? []
          : [statement.moduleSpecifier]
      }
      if (ts.isExportDeclaration(statement)) {
        return statement.isTypeOnly || statement.moduleSpecifier === undefined
          ? []
          : [statement.moduleSpecifier]
      }
      return []
    })
    .filter(ts.isStringLiteral)
    .map((specifier) => specifier.text)
    .filter((specifier) => specifier.startsWith('.'))
