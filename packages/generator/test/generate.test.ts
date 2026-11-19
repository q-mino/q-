import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'
import { kind_of } from '@q-mino/domains/library'
import { generate, type Released } from '../shell/generate.ts'
import { as_schema, is_a_major_registry, type MajorRegistry } from '../src/index.ts'

// The generator on a tree of authored files alone (DOM-25): it writes the
// scopes and the doors, imports the authored files in the order their imports
// allow, writes their twins, then the registries and the majors (DOM-24,
// DOM-22), with no generated file to start from; run again, it writes
// nothing; checking a twin changed by hand, or a generated file it no longer
// writes, it names them. Compared with main, it reads the registries by
// major a release left and names a shape changed in the wrong direction.

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
  'business/things/version.ts': `import { version } from './_scope_version.ts'

/** The things since they have a name. */
export const things = version('2.0.0')
`,
  'business/others/fact.ts': `import { z } from 'zod'
import { fact, things } from './_scope_fact.ts'

/** Another domain names a thing by its identity, through the door of \`things\`. */
export const a_thing_has_been_lent = fact({
  payload: z.strictObject({ thing_id: things.id.thing_id }),
})
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

/** A member of a module or an object, if it is one. */
const member = (of: unknown, name: string): unknown => {
  if (typeof of !== 'object' || of === null) return undefined
  const value: unknown = Reflect.get(of, name)
  return value
}

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
      '_door_business.ts',
      '_registry.ts',
      '_majors.ts',
      '1/_registry.ts',
      '../others/_scope_fact.ts',
      '../others/_fact.ts',
      '../others/_registry.ts',
    ]) {
      expect(existsSync(join(root, 'business/things', file)), file).toBe(true)
    }
    // A door to the folders the map opens it to, the identities alone (GR-3); the other domain's scope carries it.
    expect(read('business/things/_door_business.ts')).toContain("export * as id from './_id.ts'")
    expect(read('business/others/_scope_fact.ts')).toContain(
      "export * as things from '../things/_door_business.ts'",
    )
    // The registry, its paths with their components; the majors, the current's and the past's (DOM-24, DOM-22).
    const majors: unknown = await import(
      pathToFileURL(join(root, 'business/things/_majors.ts')).href
    )
    const facts: unknown = await import(pathToFileURL(join(root, 'business/things/_fact.ts')).href)
    const listed = member(majors, 'majors')
    expect(typeof listed === 'object' && listed !== null ? Object.keys(listed) : []).toEqual([
      '1',
      '2',
    ])
    expect(member(member(listed, '2'), 'business/things/fact/a_thing_has_been_added')).toBe(
      member(facts, 'a_thing_has_been_added'),
    )
    expect(read('business/things/_registry.ts')).toContain(
      "'business/things/command/add_a_thing_input': command.add_a_thing_input,",
    )

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
    expect(again).toEqual({ written: [], held: [], failures: [] })

    writeFileSync(
      join(root, 'business/things/_id.ts'),
      read('business/things/_id.ts').replace('A thing', 'Something'),
    )
    writeFileSync(join(root, 'business/things/_gone.ts'), '// generated\n\nexport {}\n')
    const checked = await generate(repository, configuration, true)
    expect(checked.failures).toEqual([
      {
        path: `${configuration.root}/business/things/_id.ts`,
        line: 1,
        rule: 'DOM-24',
        sentence: 'is not what the generator writes: run pnpm generate',
      },
      {
        path: `${configuration.root}/business/things/_gone.ts`,
        line: 1,
        rule: 'DOM-24',
        sentence: 'is no longer written by the generator: run pnpm generate',
      },
    ])
    await generate(repository, configuration, false)
    expect(existsSync(join(root, 'business/things/_gone.ts'))).toBe(false)
  })

  it('holds a file as written, and fails on one it would write the same or does not write', async () => {
    const changed = read('business/things/_scope_id.ts').replace('(DOM-25)', '(DOM-25, held)')
    writeFileSync(join(root, 'business/things/_scope_id.ts'), changed)
    const holding = (held: readonly string[]) => ({ ...configuration, held })

    expect(await generate(repository, holding(['business/things/_scope_id.ts']), true)).toEqual({
      written: [],
      held: [`${configuration.root}/business/things/_scope_id.ts`],
      failures: [],
    })
    await generate(repository, holding(['business/things/_scope_id.ts']), false)
    expect(read('business/things/_scope_id.ts')).toBe(changed)

    const stale = await generate(
      repository,
      holding(['business/things/_scope_fact.ts', 'business/things/_scope_nothing.ts']),
      true,
    )
    expect(stale.failures.map((failure) => `${failure.path}  ${failure.sentence}`)).toEqual([
      `${configuration.root}/business/things/_scope_id.ts  is not what the generator writes: run pnpm generate`,
      `${configuration.root}/business/things/_scope_fact.ts  is held as written by generator.config.ts, and is what the generator writes: remove it from held`,
      `${configuration.root}/business/things/_scope_nothing.ts  is held as written by generator.config.ts, and the generator writes no such file: remove it from held`,
    ])
    await generate(repository, configuration, false)
  })

  it('names a component exported twice, and one reachable and not exported, from what the runtime says', async () => {
    // A file of its own: the runtime keeps a module once imported.
    writeFileSync(
      join(root, 'business/things/more_predicates.ts'),
      `import { z } from 'zod'
import { predicate, NOT, id } from './_scope_predicate.ts'

export const a_thing_is_listed = predicate({
  parameters: z.strictObject({ thing_id: id.thing_id }),
})

const a_thing_is_hidden = predicate({ parameters: z.strictObject({ thing_id: id.thing_id }) })

/** The thing is not hidden. */
export const the_thing_is_shown = NOT(a_thing_is_hidden)

export const a_thing_is_here = a_thing_is_listed
`,
    )
    const checked = await generate(repository, configuration, false)
    expect(
      checked.failures.map(
        (failure) =>
          `${failure.path}:${String(failure.line)}  ${failure.rule}  ${failure.sentence}`,
      ),
    ).toEqual([
      `${configuration.root}/business/things/more_predicates.ts:13  DOM-24  business/things/predicate/a_thing_is_listed is exported twice, as a_thing_is_listed and a_thing_is_here: one object, one path`,
      `${configuration.root}/business/things/more_predicates.ts:11  DOM-25  business/things/predicate/the_thing_is_shown holds a predicate that no file exports: a component it reaches is exported, so that it has a path`,
    ])
  })

  it('writes the registries by major as JSON Schema, and compares them with those a release left (DOM-24, TST-7)', async () => {
    rmSync(join(root, 'business/things/more_predicates.ts'))
    await generate(repository, configuration, false)
    const on_disk = (path: string): MajorRegistry => {
      const parsed: unknown = JSON.parse(read(path))
      if (!is_a_major_registry(parsed)) throw new Error(`${path} is no registry`)
      return parsed
    }
    const current = on_disk('business/things/_registry.json')
    const past = on_disk('business/things/1/_registry.json')
    expect([current.version, past.major, past.version]).toEqual(['2.0.0', 1, undefined])
    expect(existsSync(join(root, 'business/others/_registry.json'))).toBe(false)
    const compared = { ...configuration, compared_with_main: true }
    const from = (released: Released) => () => released

    // As released: nothing to say.
    expect(
      (
        await generate(
          repository,
          compared,
          true,
          from({ is: 'read', registries: [current, past] }),
        )
      ).failures,
    ).toEqual([])

    // Released with an optional note in the fact's payload, which the tree no longer reads: a major.
    const path = 'business/things/fact/a_thing_has_been_added'
    const shape = current.paths[path]?.shapes?.['schema']
    const schema = as_schema(shape?.schema)
    if (typeof schema !== 'object') throw new Error('no schema')
    const properties = as_schema(schema['properties'])
    const with_a_note: MajorRegistry = {
      ...current,
      paths: {
        ...current.paths,
        [path]: {
          kind: 'fact',
          shapes: {
            schema: {
              direction: 'read',
              schema: {
                ...schema,
                properties: {
                  ...(typeof properties === 'object' ? properties : {}),
                  note: { type: 'string' },
                },
              },
            },
          },
        },
      },
    }
    const checked = await generate(
      repository,
      compared,
      true,
      from({ is: 'read', registries: [with_a_note, past] }),
    )
    expect(
      checked.failures.map(
        (failure) =>
          `${failure.path}:${String(failure.line)}  ${failure.rule}  ${failure.sentence}`,
      ),
    ).toEqual([
      `${configuration.root}/business/things/fact.ts:5  DOM-24  ${path} changes its shape against the direction it is read in, since things 2.0.0: what the tree reads only widens, every shape it left still parsing; this is a major`,
    ])

    // Main not readable: said, never passed in silence.
    expect(
      (await generate(repository, compared, true, from({ is: 'unread', why: 'git knows no main' })))
        .failures,
    ).toEqual([
      {
        path: 'generator.config.ts',
        line: 1,
        rule: 'DOM-24',
        sentence: `${configuration.root} is compared with main, and its registries cannot be read: git knows no main`,
      },
    ])

    // A registry by major the generator no longer writes is named, then deleted.
    writeFileSync(join(root, 'business/others/_registry.json'), '{}\n')
    expect((await generate(repository, configuration, true)).failures).toEqual([
      {
        path: `${configuration.root}/business/others/_registry.json`,
        line: 1,
        rule: 'DOM-24',
        sentence: 'is no longer written by the generator: run pnpm generate',
      },
    ])
    await generate(repository, configuration, false)
    expect(existsSync(join(root, 'business/others/_registry.json'))).toBe(false)
  })
})
