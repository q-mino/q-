import * as boundary from '@q-mino/boundary'
import { ESLint, Linter } from 'eslint'
import tseslint from 'typescript-eslint'
import { describe, expect, expectTypeOf, test } from 'vitest'
import { z } from 'zod'
import committed from '../manifest.json' with { type: 'json' }
import package_json from '../package.json' with { type: 'json' }
import { manifest } from '../manifest.ts'
import type { registry } from '../persona/self/_registry.ts'
import { the_manifest_of_greetings } from '../the_manifest.ts'

// The test extension's manifest (EXT-10; part 12.4): its declaration, typed
// by its tree's registry, and its data form, derived by its build and
// committed (`manifest.json`), which must not differ from what the build
// derives now, as `generate:check` keeps the generated files.

/** The rule the repository's lint gives a file at this path, as its configuration resolves there. */
const the_restricted_syntax_at = async (path: string) =>
  z
    .object({
      rules: z.object({
        'no-restricted-syntax': z
          .tuple([z.union([z.literal('error'), z.literal(2)])])
          .rest(z.object({ selector: z.string(), message: z.string() })),
      }),
    })
    .parse(await new ESLint().calculateConfigForFile(path)).rules['no-restricted-syntax']

describe('the manifest of greetings (EXT-10)', () => {
  test('the committed manifest.json is what the build derives: run `pnpm --filter @q-mino/greetings manifest`', () => {
    expect(boundary.the_manifest.parse(committed)).toEqual(the_manifest_of_greetings)
  })

  test('its versions are its package’s and the boundary’s; its action invokes its leaf on self', () => {
    expect(the_manifest_of_greetings).toMatchObject({
      name: 'greetings',
      version: package_json.version,
      boundary_version: boundary.version,
      actions: { greet: { on: 'a_bond', invokes: 'usecase/greet_a_bond' } },
    })
    expect(Object.keys(the_manifest_of_greetings.surfaces.self?.majors['1'] ?? {})).toEqual([
      'usecase/greet_a_bond',
    ])
  })

  test('greet on known: a command that answers in one event, its own events and the kernel’s, whole', () => {
    const greet = the_manifest_of_greetings.surfaces.known?.majors['1']?.['usecase/greet']
    expect(greet).toMatchObject({ kind: 'command', answers_in_one_event: true })
    expect(Object.keys(greet?.events ?? {})).toEqual([
      'greeted_back',
      'not_greeted_back',
      'not_found',
      'invalid_request',
      'version_not_supported',
      'identity_already_used',
    ])
    expect(JSON.stringify(greet?.input)).not.toMatch(/x-refined|x-unrepresentable|x-lossy/)
  })

  test('an action whose leaf is no leaf of self does not compile against its registry', () => {
    expectTypeOf<boundary.LeavesOnSelf<typeof registry>>().toEqualTypeOf<'usecase/greet_a_bond'>()
    expectTypeOf(manifest).toExtend<boundary.Manifest<typeof registry>>()
    expectTypeOf<{
      name: 'greetings'
      touches: []
      actions: { greet: { on: 'a_bond'; invokes: 'usecase/greet' } }
    }>().not.toExtend<boundary.Manifest<typeof registry>>()
    expectTypeOf<{
      name: 'greetings'
      touches: []
      actions: { greet: { on: 'a_bond'; invokes: 'usecase/greet_a_bond_input' } }
    }>().not.toExtend<boundary.Manifest<typeof registry>>()
  })

  test('the lint asks every manifest.ts for its satisfies boundary.Manifest<typeof registry> (A, 21 Nov 2026)', async () => {
    const at = 'packages/extensions/greetings/manifest.ts'
    const rule = await the_restricted_syntax_at(at)
    const linted = (code: string) =>
      new Linter({ configType: 'flat' })
        .verify(
          code,
          [
            {
              files: ['**/*.ts'],
              languageOptions: { parser: tseslint.parser },
              rules: { 'no-restricted-syntax': rule },
            },
          ],
          { filename: at },
        )
        .map((message) => message.message)
    const declared = "boundary.manifest({ name: 'greetings', touches: [] })"
    expect(
      linted(`export const manifest = ${declared} satisfies boundary.Manifest<typeof registry>`),
    ).toEqual([])
    const asked = [expect.stringContaining('satisfies `boundary.Manifest<typeof registry>`')]
    expect(linted(`export const manifest = ${declared}`)).toEqual(asked)
    expect(
      linted(`export const manifest = ${declared} satisfies boundary.Manifest<typeof other>`),
    ).toEqual(asked)
    expect(linted(`export const manifest = ${declared} satisfies object`)).toEqual(asked)
  })
})
