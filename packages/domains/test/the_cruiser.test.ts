import { cruise } from 'dependency-cruiser'
import extractDepcruiseOptions from 'dependency-cruiser/config-utl/extract-depcruise-options'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// The cruiser's rules on npm imports fire (§ 8, GR-10): the repository's configuration over a fixture
// laid out as the repository (`cruiser/packages/...`), each file an import a rule refuses or allows.
// The fixture sits under `packages/domains/test/`, where no rule of the normal run reaches it.
const the_configuration = fileURLToPath(
  new URL('../../../.dependency-cruiser.mjs', import.meta.url),
)
const the_fixture = fileURLToPath(new URL('cruiser', import.meta.url))

const the_refusals = async (): Promise<readonly string[]> => {
  const options = await extractDepcruiseOptions(the_configuration)
  const result = await cruise(['packages'], { ...options, baseDir: the_fixture })
  if (typeof result.output === 'string') throw new Error('the cruiser gave a report, not a result')
  return result.output.summary.violations
    .map((violation) => `${violation.from} ${violation.rule.name}`)
    .toSorted()
}

describe("the cruiser's rules on npm imports", () => {
  it('refuses the imports the fixture makes, and only those', async () => {
    expect(await the_refusals()).toEqual([
      'packages/boundary/src/an_import_of_npm.js boundary-imports-zod-only',
      'packages/domains/src/an_import_of_npm.js domains-npm-allowlist',
      'packages/generator/src/an_import_of_npm.js generator-core-no-node',
    ])
  })
})
