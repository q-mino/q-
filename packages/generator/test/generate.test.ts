import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'
import { kind_of } from '@q-mino/domains/library'
import { generate } from '../shell/generate.ts'

// The generator on a tree of authored files alone (DOM-25): it writes the
// scopes, imports the authored files in the order their imports allow, and
// writes their twins, with no generated file to start from; run again, it
// writes nothing; checking a twin changed by hand, it names it.

const repository = fileURLToPath(new URL('../../../', import.meta.url))
const root = join(repository, 'packages/generator/test/.generated', `tree-${String(process.pid)}`)
const library = relative(root, join(repository, 'packages/domains/src/library/index.ts'))

const authored: Readonly<Record<string, string>> = {
  'wlib.ts': `export * from '${library}'\n`,
  'business/things/id.ts': `import { z } from 'zod'
import { id } from './_scope_id.ts'

/** A thing of the shed. */
export const thing_id = id({ format: z.string().min(1) })
`,
  'business/things/value.ts': `import { z } from 'zod'
import { id } from './_scope_value.ts'

export const thing = z.strictObject({ id: id.thing_id, name: z.string().min(1) })
`,
  'business/things/plain.ts': `import { z } from 'zod'

/** A value in a file that imports no scope. */
export const colour = z.enum(['red', 'blue'])
`,
  'business/things/dsl.ts': `import { id } from './_scope_dsl.ts'

export const the_same_thing = (a: id.thing_id, b: id.thing_id): boolean => a === b
`,
  'business/things/fact.ts': `import { z } from 'zod'
import { fact, value } from './_scope_fact.ts'

/** Carries the thing whole. */
export const a_thing_has_been_added = fact({
  payload: z.strictObject({ added_thing: value.thing }),
})
`,
  'business/things/predicate.ts': `import { z } from 'zod'
import { predicate, id } from './_scope_predicate.ts'

export const a_thing_has_this_id = predicate({
  parameters: z.strictObject({ thing_id: id.thing_id }),
})
`,
  'business/things/command.ts': `import { z } from 'zod'
import { command, NOT, fact, id, predicate, value } from './_scope_command.ts'

/** No thing has the requested id. */
export const the_thing_is_new = NOT(predicate.a_thing_has_this_id)

export const add_a_thing = command({
  /** Its name, as the keeper writes it. */
  input: z.strictObject({ id: id.thing_id, name: value.thing.shape.name }),
  outcomes: {
    the_thing_is_new_so_it_is_added: [the_thing_is_new, fact.a_thing_has_been_added],
  },
  creator: () => (input) => ({
    the_thing_is_new_so_it_is_added: [{ thing_id: input.id }, { added_thing: input }],
  }),
})
`,
  'business/things/usecase.ts': `import { command_use_case, command } from './_scope_usecase.ts'

export const add_a_thing = command_use_case({ command: command.add_a_thing })
`,
  'business/things/1/fact.ts': `import { z } from 'zod'
import { earlier, next, id } from './_scope_fact.ts'

/** A thing of 1.x had no name. */
export const a_thing_has_been_added = earlier(next.a_thing_has_been_added)({
  payload: z.strictObject({ added_thing: z.strictObject({ id: id.thing_id }) }),
  to_next: (payload) => ({ added_thing: { id: payload.added_thing.id, name: 'unnamed' } }),
})
`,
}

const configuration = {
  root: relative(repository, root),
  sight: { business: { business: ['id'] } },
  library: 'wlib.ts',
  compared_with_main: false,
} as const

const read = (path: string): string => readFileSync(join(root, path), 'utf8')

afterAll(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('the generator on a tree of authored files alone', () => {
  it('writes the scopes and twins, then nothing; a twin changed by hand fails the check', async () => {
    rmSync(root, { recursive: true, force: true })
    for (const [path, text] of Object.entries(authored)) {
      mkdirSync(dirname(join(root, path)), { recursive: true })
      writeFileSync(join(root, path), text)
    }

    const first = await generate(repository, configuration, false)
    expect(first.failures).toEqual([])
    for (const file of [
      '_scope.ts',
      '_scope_id.ts',
      '_scope_value.ts',
      '_scope_dsl.ts',
      '_scope_fact.ts',
      '_scope_predicate.ts',
      '_scope_command.ts',
      '_scope_usecase.ts',
      '_id.ts',
      '_value.ts',
      '_plain.ts',
      '_dsl.ts',
      '_fact.ts',
      '_predicate.ts',
      '_command.ts',
      '_usecase.ts',
      '1/_scope.ts',
      '1/_scope_fact.ts',
      '1/_fact.ts',
    ]) {
      expect(existsSync(join(root, 'business/things', file)), file).toBe(true)
    }

    // A component branded with its path; a past major's with its major (DOM-24, DOM-22).
    expect(read('business/things/_fact.ts')).toContain(
      "fact.a_thing_has_been_added.brand<'business/things/fact/a_thing_has_been_added'>()",
    )
    expect(read('business/things/1/_fact.ts')).toContain(
      "brand<'business/things/fact/a_thing_has_been_added@1'>()",
    )
    // The input declared inline, under `<command>_input`, with the JSDoc of the input.
    expect(read('business/things/_command.ts')).toContain(
      'export const add_a_thing_input = command.add_a_thing.input',
    )
    expect(read('business/things/_command.ts')).toContain('Its name, as the keeper writes it.')
    // A file that imports no scope is a value file, by what it exports.
    expect(read('business/things/_plain.ts')).toContain('export const colour = value.colour')
    // The past major's scope names the next as `next`, and gives no functions of `dsl` (DOM-22).
    expect(read('business/things/1/_scope_fact.ts')).toContain(
      "export * as next from '../_fact.ts'",
    )
    expect(read('business/things/1/_scope_fact.ts')).not.toContain('_dsl.ts')

    const twin: unknown = await import(
      pathToFileURL(join(root, 'business/things/_usecase.ts')).href
    )
    expect(
      kind_of(typeof twin === 'object' && twin !== null ? Reflect.get(twin, 'add_a_thing') : twin),
    ).toEqual({ kind: 'usecase' })

    const again = await generate(repository, configuration, false)
    expect(again).toEqual({ written: [], failures: [] })

    writeFileSync(
      join(root, 'business/things/_id.ts'),
      read('business/things/_id.ts').replace('A thing', 'Something'),
    )
    const checked = await generate(repository, configuration, true)
    expect(checked.failures).toEqual([
      {
        path: `${configuration.root}/business/things/_id.ts`,
        line: 1,
        rule: 'DOM-24',
        sentence: 'is not what the generator writes: run pnpm generate',
      },
    ])
  })
})
