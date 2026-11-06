import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import ts from 'typescript'
import { afterAll, describe, expect, test } from 'vitest'
import { consumesOf, exportsOf, run } from '../src/index.ts'

const parse = (text: string): ts.SourceFile =>
  ts.createSourceFile('m.ts', text, ts.ScriptTarget.Latest, false, ts.ScriptKind.TS)

describe('reading modules with the TypeScript API (LIB-20)', () => {
  test('exports and their forms', () => {
    const file = parse(`
      export const a = 1, b = 2
      export function c() {}
      export default function d() {}
      export type E = number
      export interface F {}
      const g = 1
      export { g, g as h }
      export type { F as I }
      export * from './x.ts'
      const helper = 0
    `)
    expect(exportsOf(file)).toEqual([
      { name: 'a', form: 'value' },
      { name: 'b', form: 'value' },
      { name: 'c', form: 'value' },
      { name: 'd', form: 'default' },
      { name: 'E', form: 'type' },
      { name: 'F', form: 'type' },
      { name: 'g', form: 'value' },
      { name: 'h', form: 'value' },
      { name: 'I', form: 'type' },
      { name: '*', form: 'star' },
    ])
  })

  test('a marker declares its arrows as a literal list', () => {
    expect(consumesOf(parse(`export const consumes: readonly P[] = ['a/b', 'c']`))).toEqual([
      'a/b',
      'c',
    ])
    expect(consumesOf(parse(`export const consumes = ['a'] as const`))).toEqual(['a'])
    expect(consumesOf(parse(`const x = 'a'\nexport const consumes = [x]`))).toBeNull()
    expect(consumesOf(parse(`export const other = []`))).toBeNull()
  })
})

describe('check and write (LIB-19)', () => {
  const repository = resolve(import.meta.dirname, '../../..')
  const source = join(repository, 'packages/domains/test/domains')
  const temporary: string[] = []
  afterAll(async () => {
    for (const folder of temporary) await rm(folder, { recursive: true, force: true })
  })

  test('the committed test domains are up to date', async () => {
    expect(await run(source, 'check', repository)).toEqual({ errors: [], changes: [] })
  })

  /** A copy of the test domains, compiled as a root of its own, formatted like the repository. */
  const copy = async (): Promise<string> => {
    const root = await mkdtemp(join(tmpdir(), 'q-compiler-'))
    temporary.push(root)
    await cp(source, root, { recursive: true })
    await cp(join(repository, '.prettierrc.json'), join(root, '.prettierrc.json'))
    await run(root, 'write', root)
    return root
  }

  test('check reports a stale or edited file; write repairs it', async () => {
    const root = await copy()
    const index = join(root, 'town/lending/index.ts')
    const original = await readFile(index, 'utf8')
    await writeFile(index, `${original}// edited\n`)
    await writeFile(join(root, 'town/lending/gone.types.ts'), 'export {}\n')
    const before = await run(root, 'check', root)
    expect(before.errors).toEqual([])
    expect(before.changes).toEqual(['town/lending/index.ts', 'town/lending/gone.types.ts (stale)'])
    await run(root, 'write', root)
    expect(await readFile(index, 'utf8')).toBe(original)
    expect(await run(root, 'check', root)).toEqual({ errors: [], changes: [] })
  })

  test('compile errors name the module at fault', async () => {
    const root = await copy()
    await writeFile(
      join(root, 'town/lending/loans.command.ts'),
      'export const lend = 1\nexport const renew = 2\n',
    )
    const report = await run(root, 'check', root)
    expect(report.errors).toEqual([
      'town/lending/loans/renew: schema-missing: no "renew" in loans.schema.ts',
    ])
  })
})
