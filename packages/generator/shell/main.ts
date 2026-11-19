import { fileURLToPath, pathToFileURL } from 'node:url'
import { join } from 'node:path'
import { layer_order, type Configuration, type TreeConfiguration } from '../src/index.ts'
import { generate } from './generate.ts'

// `pnpm generate` writes the generated files of every tree of
// `generator.config.ts`; `pnpm generate:check` writes nothing and fails on a
// difference or a check, one line per failure (DOM-25).

const is_a_record = (value: unknown): value is object => typeof value === 'object' && value !== null

const is_a_map = (value: unknown): value is TreeConfiguration['sight'] =>
  is_a_record(value) &&
  Object.values(value).every(
    (seen: unknown) =>
      is_a_record(seen) &&
      Object.values(seen).every(
        (kinds: unknown) =>
          Array.isArray(kinds) &&
          kinds.every((kind: unknown) => layer_order.some((known) => known === kind)),
      ),
  )

const is_a_tree = (value: unknown): value is TreeConfiguration =>
  is_a_record(value) &&
  'root' in value &&
  typeof value.root === 'string' &&
  'library' in value &&
  typeof value.library === 'string' &&
  'compared_with_main' in value &&
  typeof value.compared_with_main === 'boolean' &&
  'sight' in value &&
  is_a_map(value.sight)

const is_a_configuration = (value: unknown): value is Configuration =>
  is_a_record(value) &&
  'trees' in value &&
  Array.isArray(value.trees) &&
  value.trees.every((tree: unknown) => is_a_tree(tree))

const repository = fileURLToPath(new URL('../../../', import.meta.url))
const check = process.argv.includes('--check')
const loaded: unknown = await import(pathToFileURL(join(repository, 'generator.config.ts')).href)
const configuration = is_a_record(loaded) && 'default' in loaded ? loaded.default : undefined
if (!is_a_configuration(configuration)) {
  throw new Error('generator.config.ts: its default export is no configuration of the generator')
}

const outcomes = []
for (const tree of configuration.trees) outcomes.push(await generate(repository, tree, check))

const failures = outcomes.flatMap((outcome) => outcome.failures)
for (const failure of failures) {
  process.stderr.write(
    `${failure.path}:${String(failure.line)}  ${failure.rule}  ${failure.sentence}\n`,
  )
}
if (!check) {
  const written = outcomes.flatMap((outcome) => outcome.written)
  process.stdout.write(
    written.length === 0
      ? 'generate: nothing to write\n'
      : `generate: ${String(written.length)} files written\n`,
  )
}
process.exitCode = failures.length === 0 ? 0 : 1
