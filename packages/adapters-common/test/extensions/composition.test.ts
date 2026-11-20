import * as boundary from '@q-mino/boundary'
import * as zz from '@q-mino/domains/library'
import { describe, expect, test } from 'vitest'
import * as z from 'zod'
import {
  compose_an_extension,
  the_kernels_offer,
  the_marks_in,
  type Composed,
  type Composition,
} from '../../src/index.ts'
import { a_leaf, the_manifest_of_waves, wave_input, waved } from './fixtures.ts'

// The composition of an extension (EXT-4, EXT-6, EXT-9, EXT-10, CFG-2; part
// 12.4): composed with what the kernel offers, or every fault in one
// message; and the measure of zod's `fromJSONSchema` as the kernel's check
// of a peer's input (EXT-6, the gate's open point).

const offer = the_kernels_offer([])

/** The extension composed, or the test fails with the composition's message. */
const composed = (composition: Composition): Composed => {
  if (composition.composition === 'a_fault') throw new Error(composition.message)
  return composition.composed
}

/** The faults of a composition, by their kind. */
const faults_of = (composition: Composition): readonly string[] =>
  composition.composition === 'a_fault' ? composition.faults.map((fault) => fault.fault) : []

/** A surface on `known` of one leaf, `usecase/wave`, below the kernel's node. */
const known_with = (leaf: ReturnType<typeof a_leaf>) =>
  boundary.below_the_kernels_node('known')({
    version: '1.0.0',
    majors: { 1: { 'usecase/wave': leaf } },
  })

describe('an extension composed (EXT-4, EXT-6)', () => {
  test('its surfaces read into the surfaces its leaves are mounted with', () => {
    const waves = composed(compose_an_extension(offer)(the_manifest_of_waves()))
    expect(waves.manifest.name).toBe('waves')
    const wave = waves.surfaces.known?.majors[1]?.['usecase/wave']
    expect(wave?.kind).toBe('command')
    expect(wave?.input.safeParse({ to: 'Bruno' }).success).toBe(true)
    expect(wave?.input.safeParse({ to: '' }).success).toBe(false)
    expect(wave?.input.safeParse({ to: 'Bruno', more: 1 }).success).toBe(false)
    expect(Object.keys(wave?.events ?? {})).toEqual([
      'waved',
      'not_found',
      'invalid_request',
      'version_not_supported',
      'identity_already_used',
    ])
    expect(
      wave?.events['waved']?.safeParse({ event: 'waved', payload: { to: 'Anna' } }).success,
    ).toBe(true)
    expect(wave?.events['waved']?.safeParse({ event: 'waved', payload: {} }).success).toBe(false)
    expect(waves.surfaces.self?.version).toBe('1.0.0')
  })

  test('a manifest that does not parse', () => {
    const composition = compose_an_extension(offer)({ name: 'waves', version: 'one' })
    expect(faults_of(composition)).toEqual(['the_manifest_does_not_parse'])
    expect(composition.composition === 'a_fault' && composition.message).toMatch(
      /^waves: its manifest does not parse: version: .* \(EXT-10\)$/,
    )
  })

  test('each fault, one by one', () => {
    const waves = the_manifest_of_waves()
    expect(faults_of(compose_an_extension({ ...offer, boundary_majors: [2] })(waves))).toEqual([
      'a_boundary_major_not_spoken',
    ])
    expect(faults_of(compose_an_extension(the_kernels_offer(['waves']))(waves))).toEqual([
      'a_name_not_unique',
    ])
    expect(faults_of(compose_an_extension({ ...offer, ports: ['its_storage'] })(waves))).toEqual([
      'a_port_not_offered',
    ])
    expect(
      faults_of(
        compose_an_extension(offer)(
          the_manifest_of_waves({
            known: known_with(a_leaf(wave_input, { waved }, { answers_in_one_event: false })),
          }),
        ),
      ),
    ).toEqual(['a_leaf_on_known_that_does_not_answer_in_one_event'])
    expect(
      faults_of(
        compose_an_extension(offer)(
          the_manifest_of_waves({
            known: known_with(
              a_leaf(z.strictObject({ to: z.string().refine((to) => to !== 'Carla') }), { waved }),
            ),
          }),
        ),
      ),
    ).toEqual(['a_refined_input_on_known'])
    expect(
      faults_of(
        compose_an_extension(offer)(
          the_manifest_of_waves({
            known: {
              version: '2.0.0',
              majors: { 1: { 'usecase/wave': a_leaf(wave_input, { waved }) }, 2: {} },
            },
          }),
        ),
      ),
    ).toEqual(['a_surface_with_no_leaves_at_its_version'])
    expect(
      faults_of(
        compose_an_extension(offer)(
          the_manifest_of_waves({
            known: known_with({ ...a_leaf(wave_input, { waved }), input: { if: {}, then: {} } }),
          }),
        ),
      ),
    ).toEqual(['a_json_schema_not_read'])
    expect(
      faults_of(
        compose_an_extension(offer)(
          the_manifest_of_waves({
            actions: { wave: { on: 'a_bond', invokes: 'usecase/nothing' } },
          }),
        ),
      ),
    ).toEqual(['an_action_on_no_leaf_of_self'])
  })

  test('every fault in one message, one line each', () => {
    const composition = compose_an_extension({
      boundary_majors: [2],
      ports: ['its_storage'],
      installed: ['waves'],
    })(
      the_manifest_of_waves({
        known: known_with(
          a_leaf(
            z.strictObject({ to: z.string().refine((to) => to !== 'Carla') }),
            { waved },
            {
              answers_in_one_event: false,
            },
          ),
        ),
      }),
    )
    expect(faults_of(composition)).toEqual([
      'a_boundary_major_not_spoken',
      'a_name_not_unique',
      'a_port_not_offered',
      'a_leaf_on_known_that_does_not_answer_in_one_event',
      'a_refined_input_on_known',
    ])
    expect(composition.composition === 'a_fault' && composition.message.split('\n')).toEqual([
      'waves: built with the boundary 1.0.0, a major the kernel does not speak (2) (EXT-9, EXT-4)',
      'waves: an extension of this name is installed already (EXT-3)',
      'waves: it touches the_port_of_requests, a port the kernel does not offer extensions (EXT-4)',
      'waves: its leaf usecase/wave on known, at major 1, does not answer in one event (F7, EXT-4)',
      'waves: the input of its leaf usecase/wave on known, at major 1, holds a refinement JSON Schema cannot tell, at /properties/to (EXT-6, EXT-4)',
    ])
  })

  test('a refined input on self is no fault: the extension checks it after the node (EXT-6)', () => {
    const refined = z.strictObject({ bond: z.string().refine((bond) => bond !== '') })
    const waves = composed(
      compose_an_extension(offer)(
        the_manifest_of_waves({
          self: {
            version: '1.0.0',
            majors: { 1: { 'usecase/wave_to_a_bond': a_leaf(refined, {}) } },
          },
        }),
      ),
    )
    expect(the_marks_in(zz.json_schema_of(refined))).toEqual(['/properties/bond'])
    expect(waves.surfaces.self?.majors[1]?.['usecase/wave_to_a_bond']?.kind).toBe('command')
  })
})

/**
 * How a shape read back from its JSON Schema checks (EXT-6): `holds`, it
 * accepts and refuses as the original; `accepts_more`, lossy, it lets
 * through what the original refuses (unmarked: the kernel would let a
 * malformed input reach the extension, which parses again, PER-5);
 * `refuses_more`, it refuses what the original accepts; `marked`, the export
 * marks it (`x-refined`, `x-unrepresentable`), which the composition refuses
 * on `known`.
 */
type Verdict = 'holds' | 'accepts_more' | 'refuses_more' | 'marked'

/** A shape of the table: the original, values it accepts, values it refuses, and the verdict measured. */
type Row = readonly [string, z.ZodType, readonly unknown[], readonly unknown[], Verdict]

const recursive: z.ZodType = z.lazy(() => z.strictObject({ children: z.array(recursive) }))

const the_table: readonly Row[] = [
  [
    'a strict object',
    z.strictObject({ a: z.string() }),
    [{ a: 'x' }],
    [{ a: 'x', b: 1 }, {}],
    'holds',
  ],
  ['an object, loose', z.object({ a: z.string() }), [{ a: 'x', b: 1 }], [{}], 'holds'],
  [
    'an optional field',
    z.strictObject({ a: z.string().optional() }),
    [{}, { a: 'x' }],
    [{ a: 1 }],
    'holds',
  ],
  [
    'a field with a default',
    z.strictObject({ a: z.number().default(1) }),
    [{}, { a: 2 }],
    [{ a: 'x' }],
    'holds',
  ],
  ['a string, min and max', z.string().min(2).max(4), ['abc'], ['a', 'abcde'], 'holds'],
  ['a string, a regex', z.string().regex(/^[a-z]+$/), ['abc'], ['AB1'], 'holds'],
  ['a string, an email', z.email(), ['anna@cumino.test'], ['anna'], 'holds'],
  ['a string, a uuid', z.uuid(), ['123e4567-e89b-42d3-a456-426614174000'], ['x'], 'holds'],
  [
    'an instant, zz.date_time',
    zz.date_time,
    ['2026-11-20T10:00:00+01:00'],
    ['2026-13-20T10:00:00+01:00', 'x'],
    'holds',
  ],
  ['a number, bounds', z.number().min(1).max(10), [1, 10], [0, 11], 'holds'],
  ['a number, exclusive bounds', z.number().gt(0).lt(1), [0.5], [0, 1], 'holds'],
  ['an integer, bounds', z.number().int().min(0).max(5), [0, 5], [6, -1, 1.5], 'holds'],
  ['a multiple', z.number().multipleOf(5), [10], [3], 'holds'],
  ['a literal', z.literal('x'), ['x'], ['y'], 'holds'],
  ['a literal number', z.literal(3), [3], [4], 'holds'],
  ['an enum', z.enum(['a', 'b']), ['a'], ['c'], 'holds'],
  [
    'a discriminated union',
    z.discriminatedUnion('k', [
      z.strictObject({ k: z.literal('a'), n: z.number() }),
      z.strictObject({ k: z.literal('b'), s: z.string() }),
    ]),
    [
      { k: 'a', n: 1 },
      { k: 'b', s: 's' },
    ],
    [{ k: 'a', s: 's' }, { k: 'c' }],
    'holds',
  ],
  ['a union', z.union([z.string(), z.number()]), ['a', 1], [true], 'holds'],
  [
    'an array, bounds',
    z.array(z.string()).min(1).max(2),
    [['a']],
    [[], ['a', 'b', 'c'], [1]],
    'holds',
  ],
  ['a tuple', z.tuple([z.string(), z.number()]), [['a', 1]], [['a'], ['a', 'b']], 'holds'],
  ['nullable', z.string().nullable(), ['a', null], [1], 'holds'],
  ['a record', z.record(z.string(), z.number()), [{ a: 1 }], [{ a: 'x' }], 'holds'],
  ['a branded string', z.string().min(1).brand<'bond'>(), ['B-1'], [''], 'holds'],
  [
    'nested objects',
    z.strictObject({ a: z.strictObject({ b: z.array(z.strictObject({ c: z.number().int() })) }) }),
    [{ a: { b: [{ c: 1 }] } }],
    [{ a: { b: [{ c: 1.5 }] } }, { a: { b: [{ c: 1, d: 2 }] } }],
    'holds',
  ],
  [
    'a recursive object',
    recursive,
    [{ children: [{ children: [] }] }],
    [{ children: [{ c: 1 }] }],
    'holds',
  ],
  [
    'a URL of a protocol',
    z.url({ protocol: /^https$/ }),
    ['https://relay.test'],
    ['http://relay.test'],
    'accepts_more',
  ],
  [
    'a record with enum keys',
    z.record(z.enum(['a', 'b']), z.number()),
    [{ a: 1, b: 2 }],
    [{ a: 1 }],
    'accepts_more',
  ],
  ['a string trimmed', z.string().trim().min(1), ['a'], ['   '], 'accepts_more'],
  ['a pipe', z.string().pipe(z.string().min(2)), ['ab'], ['a'], 'accepts_more'],
  ['an emoji, a Unicode class', z.emoji(), ['😀'], ['a'], 'refuses_more'],
  ['a refinement', z.string().refine((s) => s.startsWith('q')), ['q1'], ['a'], 'marked'],
  ['a date', z.date(), [new Date(0)], ['1970'], 'marked'],
]

/** A shape read back by the kernel: through a manifest's leaf on `self`, composed, as an extension's input is. */
const read_back = (shape: z.ZodType): z.ZodType => {
  const waves = composed(
    compose_an_extension(offer)(
      the_manifest_of_waves({
        self: { version: '1.0.0', majors: { 1: { 'usecase/wave_to_a_bond': a_leaf(shape, {}) } } },
      }),
    ),
  )
  const leaf = waves.surfaces.self?.majors[1]?.['usecase/wave_to_a_bond']
  if (leaf === undefined) throw new Error('no leaf read')
  return leaf.input
}

describe('zod’s fromJSONSchema as the kernel’s check of a peer’s input (EXT-6, as measured)', () => {
  test.each(the_table)('%s', (_, shape, accepted, refused, verdict) => {
    const read = read_back(shape)
    expect(accepted.every((value) => shape.safeParse(value).success)).toBe(true)
    expect(refused.some((value) => shape.safeParse(value).success)).toBe(false)
    const accepts = accepted.every((value) => read.safeParse(value).success)
    const refuses = refused.every((value) => !read.safeParse(value).success)
    const marked = the_marks_in(zz.json_schema_of(shape)).length > 0
    const measured: Verdict = marked
      ? 'marked'
      : !accepts
        ? 'refuses_more'
        : !refuses
          ? 'accepts_more'
          : 'holds'
    expect(measured).toBe(verdict)
  })
})
