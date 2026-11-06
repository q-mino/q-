// Compiles a root and brings its generated files up to date, or checks that they are (LIB-19).
import { readFile, rm, writeFile } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'
import * as prettier from 'prettier'
import { compile } from '@q-mino/domains/library'
import { readRoot } from './source.ts'

export type Mode = 'write' | 'check'

/** Compile errors, and the generated files that were (or, in check mode, would be) written or removed. */
export interface Report {
  readonly errors: readonly string[]
  readonly changes: readonly string[]
}

const readOrNull = async (path: string): Promise<string | null> => {
  try {
    return await readFile(path, 'utf8')
  } catch {
    return null
  }
}

const format = async (path: string, text: string): Promise<string> => {
  const config = (await prettier.resolveConfig(path)) ?? {}
  return prettier.format(text, { ...config, filepath: path })
}

export async function run(root: string, mode: Mode, repository: string): Promise<Report> {
  const rootFromRepo = relative(repository, root).split(sep).join('/')
  const shown = (path: string): string => (rootFromRepo === '' ? path : `${rootFromRepo}/${path}`)
  const { tree, generated } = await readRoot(root)
  const result = compile(tree, { rootFromRepo })
  if (!result.ok) {
    const errors = result.errors.map((e) => `${shown(e.at)}: ${e.code}: ${e.detail}`)
    return { errors, changes: [] }
  }
  const changes: string[] = []
  const expected = new Set(result.files.map((f) => f.path))
  for (const file of result.files) {
    const path = join(root, file.path)
    const text = await format(path, file.text)
    if ((await readOrNull(path)) === text) continue
    changes.push(shown(file.path))
    if (mode === 'write') await writeFile(path, text)
  }
  for (const stale of generated.filter((g) => !expected.has(g))) {
    changes.push(`${shown(stale)} (stale)`)
    if (mode === 'write') await rm(join(root, stale))
  }
  return { errors: [], changes }
}
