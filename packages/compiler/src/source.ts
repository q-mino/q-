// Reads a compiled root from disk into the facts the library's compiler needs (LIB-20).
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import ts from 'typescript'
import {
  arrowsFile,
  roleOf,
  type SourceExport,
  type SourceMarker,
  type SourceModule,
  type SourceTree,
} from '@q-mino/domains/library'

const skipped = new Set(['node_modules', '.tsbuild', 'dist'])

export interface ReadRoot {
  readonly tree: SourceTree
  /** The generated files present on disk, relative to the root. */
  readonly generated: readonly string[]
}

export async function readRoot(root: string): Promise<ReadRoot> {
  const folders: string[] = []
  const modules: SourceModule[] = []
  const markers: SourceMarker[] = []
  const generated: string[] = []
  const walk = async (folder: string): Promise<void> => {
    const entries = await readdir(join(root, folder), { withFileTypes: true })
    for (const entry of entries) {
      const path = folder === '' ? entry.name : `${folder}/${entry.name}`
      if (entry.isDirectory()) {
        if (skipped.has(entry.name)) continue
        folders.push(path)
        await walk(path)
      } else if (path === arrowsFile) {
        generated.push(path)
      } else if (entry.name.endsWith('.ts')) {
        const role = roleOf(path)
        if (role.role === 'generated') generated.push(path)
        else if (role.role === 'component' || role.role === 'unknown-kind') {
          const text = await readFile(join(root, path), 'utf8')
          modules.push({ path, exports: exportsOf(parse(path, text)) })
        } else if (role.role === 'marker') {
          const text = await readFile(join(root, path), 'utf8')
          markers.push({ folder: role.folder, consumes: consumesOf(parse(path, text)) })
        }
      }
    }
  }
  await walk('')
  return { tree: { folders, modules, markers }, generated }
}

const parse = (path: string, text: string): ts.SourceFile =>
  ts.createSourceFile(path, text, ts.ScriptTarget.Latest, false, ts.ScriptKind.TS)

const has = (node: ts.Node, kind: ts.SyntaxKind): boolean =>
  ts.canHaveModifiers(node) && (ts.getModifiers(node) ?? []).some((m) => m.kind === kind)

/** The names a module exports, and how (LIB-16). */
export function exportsOf(file: ts.SourceFile): readonly SourceExport[] {
  const found: SourceExport[] = []
  for (const statement of file.statements) {
    const exported = has(statement, ts.SyntaxKind.ExportKeyword)
    const isDefault = has(statement, ts.SyntaxKind.DefaultKeyword)
    if (ts.isVariableStatement(statement) && exported) {
      for (const declaration of statement.declarationList.declarations)
        found.push({ name: declaration.name.getText(file), form: 'value' })
    } else if (
      (ts.isFunctionDeclaration(statement) ||
        ts.isClassDeclaration(statement) ||
        ts.isEnumDeclaration(statement)) &&
      exported
    ) {
      const name = statement.name?.text ?? 'default'
      found.push({ name, form: isDefault ? 'default' : 'value' })
    } else if (
      (ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement)) &&
      exported
    ) {
      found.push({ name: statement.name.text, form: 'type' })
    } else if (ts.isExportDeclaration(statement)) {
      const clause = statement.exportClause
      if (clause === undefined || ts.isNamespaceExport(clause)) {
        found.push({ name: clause?.name.getText(file) ?? '*', form: 'star' })
      } else {
        for (const element of clause.elements) {
          const typeOnly = statement.isTypeOnly || element.isTypeOnly
          found.push({ name: element.name.getText(file), form: typeOnly ? 'type' : 'value' })
        }
      }
    } else if (ts.isExportAssignment(statement)) {
      found.push({ name: 'default', form: 'default' })
    }
  }
  return found
}

const unwrap = (expression: ts.Expression): ts.Expression =>
  ts.isAsExpression(expression) ||
  ts.isSatisfiesExpression(expression) ||
  ts.isParenthesizedExpression(expression)
    ? unwrap(expression.expression)
    : expression

/** The domains a marker consumes, when it declares them as an array of string literals (LIB-14). */
export function consumesOf(file: ts.SourceFile): readonly string[] | null {
  for (const statement of file.statements) {
    if (!ts.isVariableStatement(statement) || !has(statement, ts.SyntaxKind.ExportKeyword)) continue
    for (const declaration of statement.declarationList.declarations) {
      if (declaration.name.getText(file) !== 'consumes' || declaration.initializer === undefined)
        continue
      const array = unwrap(declaration.initializer)
      if (!ts.isArrayLiteralExpression(array)) return null
      const paths: string[] = []
      for (const element of array.elements) {
        if (!ts.isStringLiteral(element)) return null
        paths.push(element.text)
      }
      return paths
    }
  }
  return null
}
