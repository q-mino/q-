import { describe, expect, expectTypeOf, test } from 'vitest'
import type * as z from 'zod'
import * as boundary from '../src/index.ts'

// The manifest (EXT-3, EXT-10, EXT-11; part 12.4): the declaration as its
// author writes it, its leaves typed by `self`'s registry, its data form,
// the mounted folders it gives the generator's configuration.

/**
 * A registry of `persona/self` as the generator writes it (DOM-24), by its
 * shapes: a leaf is a component with an input (and the library's mark, a
 * symbol), its input's schema is registered beside it, a value is a schema.
 */
interface Registry {
  readonly 'persona/self/usecase/greet_a_bond': {
    readonly input: z.ZodObject
    readonly [mark: symbol]: unknown
  }
  readonly 'persona/self/usecase/greet_a_bond_input': z.ZodObject
  readonly 'persona/self/greetings/usecase/the_greetings_of_a_bond': {
    readonly input: z.ZodObject
    readonly [mark: symbol]: unknown
  }
  readonly 'persona/self/value/greeting': z.ZodString
}

const declaration = boundary.manifest({
  name: 'greetings',
  sees: { known: ['the_name_of_the_bond'] },
  touches: ['the_port_of_requests', 'its_storage'],
  actions: { greet: { on: 'a_bond', invokes: 'usecase/greet_a_bond' } },
  slots: {
    the_greetings_of_a_bond: { on: 'a_bond', shows: 'frame/the_greetings_of_a_bond.html' },
  },
  pages: { all_the_greetings: { on: 'the_extension', shows: 'frame/all_the_greetings.html' } },
}) satisfies boundary.Manifest<Registry>

/** The surface of `known`, as the build derives it (EXT-10): a leaf at major 1, its input and events as JSON Schemas. */
const surface_of_known = {
  version: '1.0.0',
  majors: {
    '1': {
      'usecase/greet': {
        kind: 'command',
        input: { type: 'object', properties: {}, additionalProperties: false },
        events: { greeted: { type: 'object' } },
        answers_in_one_event: true,
      },
    },
  },
} as const

describe('the declaration (EXT-10)', () => {
  test('keeps its literal types, and is given back as written', () => {
    expectTypeOf(declaration.name).toEqualTypeOf<'greetings'>()
    expectTypeOf(declaration.touches).toEqualTypeOf<
      readonly ['the_port_of_requests', 'its_storage']
    >()
    expectTypeOf(declaration.actions.greet.invokes).toEqualTypeOf<'usecase/greet_a_bond'>()
    expect(declaration.slots.the_greetings_of_a_bond.on).toBe('a_bond')
  })

  test('what its author writes, its schema takes', () => {
    expectTypeOf<boundary.Declaration>().toExtend<z.input<typeof boundary.the_declaration>>()
  })

  test('the leaves of self are its registry’s components with an input under a usecase/ segment', () => {
    expectTypeOf<boundary.LeavesOnSelf<Registry>>().toEqualTypeOf<
      'usecase/greet_a_bond' | 'greetings/usecase/the_greetings_of_a_bond'
    >()
  })

  test('an action that invokes no leaf of self does not compile', () => {
    interface InvokingTheInput {
      readonly name: 'greetings'
      readonly touches: readonly []
      readonly actions: {
        readonly greet: { readonly on: 'a_bond'; readonly invokes: 'usecase/greet_a_bond_input' }
      }
    }
    interface InvokingAValue {
      readonly name: 'greetings'
      readonly touches: readonly []
      readonly actions: {
        readonly greet: { readonly on: 'a_bond'; readonly invokes: 'value/greeting' }
      }
    }
    expectTypeOf<InvokingTheInput>().not.toExtend<boundary.Manifest<Registry>>()
    expectTypeOf<InvokingAValue>().not.toExtend<boundary.Manifest<Registry>>()
    expectTypeOf<InvokingAValue>().toExtend<boundary.Declaration>()
  })

  test('a self with no leaf takes no action', () => {
    expectTypeOf<
      boundary.LeavesOnSelf<{ readonly 'persona/self/value/greeting': z.ZodString }>
    >().toBeNever()
  })

  test('refused when its module loads: a name not in snake_case, a name listed twice, a page off its place', () => {
    expect(() => boundary.manifest({ name: 'Greetings', touches: [] })).toThrow()
    expect(() =>
      boundary.manifest({ name: 'greetings', touches: ['its_storage', 'its_storage'] }),
    ).toThrow()
    expect(() =>
      boundary.the_declaration.parse({
        name: 'greetings',
        touches: [],
        pages: { all: { on: 'a_bond', shows: 'frame/all.html' } },
      }),
    ).toThrow()
    expect(() =>
      boundary.the_declaration.parse({ name: 'greetings', touches: [], runs: 'in_process' }),
    ).toThrow()
  })
})

describe('the manifest as data (EXT-10)', () => {
  test('made from the declaration, every list and record present, the boundary version its own', () => {
    const data = boundary.the_manifest_as_data({
      declaration: boundary.manifest({ name: 'greetings', touches: ['its_storage'] }),
      version: '0.1.0',
      surfaces: { known: surface_of_known },
    })
    expect(data).toEqual({
      name: 'greetings',
      version: '0.1.0',
      boundary_version: boundary.version,
      sees: { known: [] },
      touches: ['its_storage'],
      actions: {},
      slots: {},
      pages: {},
      surfaces: { known: surface_of_known },
    })
  })

  test('parses a sample, and refuses an unknown field, here or in a surface', () => {
    const data = boundary.the_manifest_as_data({ declaration, version: '0.1.0', surfaces: {} })
    expect(boundary.the_manifest.parse(JSON.parse(JSON.stringify(data)))).toEqual(data)
    expect(boundary.the_manifest.safeParse({ ...data, runs: 'in_process' }).success).toBe(false)
    expect(
      boundary.the_manifest.safeParse({
        ...data,
        surfaces: { known: { ...surface_of_known, window: [1] } },
      }).success,
    ).toBe(false)
    expect(
      boundary.the_manifest.safeParse({ ...data, surfaces: { unknown: surface_of_known } }).success,
    ).toBe(false)
  })

  test('refuses a surface whose majors do not hold its version’s, or a leaf that is no path of one', () => {
    expect(boundary.a_surface.safeParse({ ...surface_of_known, version: '2.0.0' }).success).toBe(
      false,
    )
    expect(
      boundary.a_surface.safeParse({
        version: '1.0.0',
        majors: { '1': { 'value/greeting': surface_of_known.majors['1']['usecase/greet'] } },
      }).success,
    ).toBe(false)
  })

  test('refuses a version that is not semver', () => {
    expect(() =>
      boundary.the_manifest_as_data({ declaration, version: 'one', surfaces: {} }),
    ).toThrow()
  })
})

describe('the mounted folders (EXT-11)', () => {
  test('on known the bond alone, on self the root’s context, when it sees nothing more', () => {
    expect(boundary.mounted_of(boundary.manifest({ name: 'greetings', touches: [] }))).toEqual({
      'persona/known': { from: '@q-mino/boundary', context: ['the_bond'] },
      'persona/self': { from: '@q-mino/boundary', context: [] },
    })
  })

  test('on known the bond and what it sees, by the names the boundary exports', () => {
    const mounted = boundary.mounted_of(
      boundary.manifest({
        name: 'greetings',
        sees: { known: ['the_peer_key', 'the_name_of_the_bond'] },
        touches: [],
      }),
    )
    expect(mounted['persona/known'].context).toEqual([
      'the_bond',
      'the_peer_key',
      'the_name_of_the_bond',
    ])
    for (const name of mounted['persona/known'].context) expect(boundary).toHaveProperty(name)
    expect(mounted['persona/self'].context).toEqual([])
  })

  test('the module named is the boundary’s package, its version semver', () => {
    expect(boundary.name).toBe('@q-mino/boundary')
    expect(boundary.semver.safeParse(boundary.version).success).toBe(true)
  })
})
