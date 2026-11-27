// The assistant's build for Node (AST-14, on the relay's model, REL-5): one
// ES module, `dist/assistant.mjs`, that runs with `node` alone, with no
// workspace and no `node_modules`: the main and everything it imports,
// bundled by Rolldown; only Node's own modules outside. The build's values
// written over `src/build_info.ts`; the system prompt copied beside the
// bundle, where `the_system_prompt.ts` finds it; its source map beside it.
// What the container's image runs (`deploy/assistant/Dockerfile`).
// [Q, C, 28 Nov 2026]
//
// Usage: node build/bundle.ts [--out <dir>]

import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { build } from 'rolldown'
import type { TheBuild } from '../src/build_info.ts'

const the_assistant = join(import.meta.dirname, '..')
const the_build_info = join(the_assistant, 'src', 'build_info.ts')

const git = (...command: string[]): string => {
  try {
    return execFileSync('git', command, { encoding: 'utf8', cwd: the_assistant }).trim()
  } catch {
    return 'unknown'
  }
}

/** The build of this checkout: from the image's arguments, or from git. */
export const the_release = (): TheBuild => ({
  version: process.env['Q_VERSION'] ?? git('describe', '--tags', '--always', '--dirty'),
  commit: process.env['Q_COMMIT'] ?? process.env['GITHUB_SHA'] ?? git('rev-parse', 'HEAD'),
  repository: process.env['Q_REPOSITORY'] ?? 'https://github.com/q-mino/q-',
})

/** `build_info.ts` with the build's values. */
const written = (values: TheBuild): string => {
  const source = readFileSync(the_build_info, 'utf8')
  const not_built = /export const the_build: TheBuild = \{[^}]*\}/
  if (!not_built.test(source)) throw new Error(`${the_build_info}: no the_build to write over`)
  return source.replace(
    not_built,
    `export const the_build: TheBuild = ${JSON.stringify(values, null, 2)}`,
  )
}

/** The bundle written into a folder, the system prompt beside it; the build's values it carries. */
export const bundle = async (out: string, values: TheBuild = the_release()): Promise<TheBuild> => {
  await build({
    input: join(the_assistant, 'src', 'main.ts'),
    platform: 'node',
    logLevel: 'warn',
    plugins: [
      {
        name: 'the-build-s-values',
        load: (id) => (id === the_build_info ? written(values) : null),
      },
    ],
    output: {
      file: join(out, 'assistant.mjs'),
      format: 'esm',
      sourcemap: true,
      comments: { legal: true },
      banner: `// Cumino's assistant ${values.version} (${values.commit}), AGPL-3.0-only; its source: ${values.repository}/tree/${values.commit}`,
    },
  })
  mkdirSync(out, { recursive: true })
  copyFileSync(
    join(the_assistant, 'src', 'answerer', 'the_system_prompt.md'),
    join(out, 'the_system_prompt.md'),
  )
  return values
}

if (import.meta.main) {
  const at = process.argv.indexOf('--out')
  const out = at >= 0 ? (process.argv[at + 1] ?? 'dist') : join(the_assistant, 'dist')
  const started = performance.now()
  const values = await bundle(out)
  const seconds = ((performance.now() - started) / 1000).toFixed(1)
  console.log(`${join(out, 'assistant.mjs')} in ${seconds} s: ${values.version} (${values.commit})`)
}
