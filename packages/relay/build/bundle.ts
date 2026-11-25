// The relay's build for Node (REL-5): one ES module, `dist/relay.mjs`, that
// runs with `node` alone, with no workspace and no `node_modules`: the relay's
// main and everything it imports, the workspace's packages and its
// dependencies, bundled by Rolldown (already the lockfile's, through Vite);
// only Node's own modules (`node:sqlite`, `node:http`, …) outside. The
// build's values (the version, the commit, the repository) written over
// `src/build_info.ts`, as the phone's build writes its own, so that `GET /`
// tells them (REL-4); its source map beside it, for a fault's stack
// (`node --enable-source-maps`). [Q, C, 25 Nov 2026]
//
// Usage: node build/bundle.ts [--out <dir>]

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { build } from 'rolldown'
import type { TheBuild } from '../src/build_info.ts'

const the_relay = join(import.meta.dirname, '..')
const the_build_info = join(the_relay, 'src', 'build_info.ts')

const git = (...command: string[]): string => {
  try {
    return execFileSync('git', command, { encoding: 'utf8', cwd: the_relay }).trim()
  } catch {
    return 'unknown'
  }
}

/** The build of this checkout: from the CI's variables or the deploy's, or from git. */
export const the_release = (): TheBuild => ({
  version: process.env['Q_VERSION'] ?? git('describe', '--tags', '--always', '--dirty'),
  commit: process.env['GITHUB_SHA'] ?? git('rev-parse', 'HEAD'),
  repository: process.env['Q_REPOSITORY'] ?? 'https://github.com/q-mino/q-',
})

/** `build_info.ts` with the build's values in place of a relay not built's. */
const written = (values: TheBuild): string => {
  const source = readFileSync(the_build_info, 'utf8')
  const not_built = /export const the_build: TheBuild = \{[^}]*\}/
  if (!not_built.test(source)) throw new Error(`${the_build_info}: no the_build to write over`)
  return source.replace(
    not_built,
    `export const the_build: TheBuild = ${JSON.stringify(values, null, 2)}`,
  )
}

/** The bundle written into a folder; the build's values it carries. */
export const bundle = async (out: string, values: TheBuild = the_release()): Promise<TheBuild> => {
  await build({
    input: join(the_relay, 'src', 'main.ts'),
    platform: 'node',
    logLevel: 'warn',
    plugins: [
      {
        name: 'the-build-s-values',
        load: (id) => (id === the_build_info ? written(values) : null),
      },
    ],
    output: {
      file: join(out, 'relay.mjs'),
      format: 'esm',
      sourcemap: true,
      comments: { legal: true },
      banner: `// Cumino's relay ${values.version} (${values.commit}), AGPL-3.0-only; its source: ${values.repository}/tree/${values.commit}`,
    },
  })
  return values
}

if (import.meta.main) {
  const at = process.argv.indexOf('--out')
  const out = at >= 0 ? (process.argv[at + 1] ?? 'dist') : join(the_relay, 'dist')
  const started = performance.now()
  const values = await bundle(out)
  const seconds = ((performance.now() - started) / 1000).toFixed(1)
  console.log(`${join(out, 'relay.mjs')} in ${seconds} s: ${values.version} (${values.commit})`)
}
