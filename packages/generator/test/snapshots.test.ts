import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { json_schema_of, type Json } from '@q-mino/domains/library'
import {
  compared,
  major_registries,
  snapshots,
  type Failure,
  type Folder,
  type MajorRegistry,
  type Tree,
} from '../src/index.ts'
import { component, exported, file, folder, sight, text_in, value } from './trees.ts'

// The registries by major as JSON Schema (`_registry.json`, TST-7) and their
// comparison with those a release left, by direction (DOM-24, PER-17, SC-46):
// a business domain with a past major, a persona with a leaf; each changed in
// the right direction and in the wrong one.

const json = (of: z.ZodType): Json => json_schema_of(of)

const added = z.strictObject({ thing_id: z.string().min(1) })
const tell = z.strictObject({ thing_id: z.string().min(1), name: z.string() })

interface Parts {
  readonly things?: string
  readonly member?: string
  /** The payload of `a_thing_has_been_added`, which the tree reads. */
  readonly fact?: z.ZodType
  /** The payload of the past major's `a_thing_has_been_added`, delegated or its own. */
  readonly past_fact?: z.ZodType
  /** The past major's facts, beyond `a_thing_has_been_added`. */
  readonly past_more?: boolean
  /** A value carried by the others. */
  readonly colour?: z.ZodType
  /** A command's input, which the tree reads. */
  readonly input?: z.ZodType
  /** A leaf's events, which its clients read. */
  readonly events?: Readonly<Record<string, z.ZodType>>
  /** A use case added. */
  readonly more?: boolean
  /** Whether `business/things` has a past major. */
  readonly past?: boolean
}

const version = (name: string, at: string): Folder['files'][number] =>
  file('version', 'version', [
    exported(
      name,
      component(
        { kind: 'version' },
        'none',
        { is: 'current' },
        {
          major: Number(at.split('.')[0]),
          version: at,
        },
      ),
      2,
    ),
  ])

const tree = (parts: Parts = {}): Tree => {
  const past = parts.past ?? true
  return {
    sight,
    library: 'wlib.ts',
    folders: [
      folder('business/things', [
        file('id', 'id', [
          exported(
            'thing_id',
            component({ kind: 'id' }, 'none', undefined, {
              shapes: { schema: json(z.string().min(1)) },
            }),
          ),
        ]),
        file('value', 'value', [
          exported('colour', value(undefined, json(parts.colour ?? z.enum(['red', 'blue'])))),
        ]),
        file('fact', 'fact', [
          exported(
            'a_thing_has_been_added',
            component({ kind: 'fact' }, 'none', undefined, {
              shapes: { schema: json(parts.fact ?? added) },
            }),
            4,
          ),
        ]),
        file('command', 'command', [
          exported(
            'add_a_thing',
            component({ kind: 'command' }, 'schema', undefined, {
              shapes: { input: json(parts.input ?? added) },
            }),
            6,
          ),
        ]),
        file('usecase', 'usecase', [
          exported('add_a_thing', component({ kind: 'usecase' }, 'none')),
          ...(parts.more === true
            ? [exported('paint_a_thing', component({ kind: 'usecase' }, 'none'), 3)]
            : []),
        ]),
        version('things', parts.things ?? '2.0.0'),
      ]),
      ...(past
        ? [
            folder('business/things/1', [
              file('fact', 'fact', [
                exported(
                  'a_thing_has_been_added',
                  component(
                    { kind: 'fact' },
                    'none',
                    { is: 'earlier' },
                    {
                      shapes: { schema: json(parts.past_fact ?? z.strictObject({})) },
                    },
                  ),
                  5,
                ),
                ...(parts.past_more === true
                  ? [
                      exported(
                        'a_thing_has_been_painted',
                        component(
                          { kind: 'fact' },
                          'none',
                          { is: 'earlier' },
                          {
                            shapes: { schema: json(z.strictObject({})) },
                          },
                        ),
                        9,
                      ),
                    ]
                  : []),
              ]),
            ]),
          ]
        : []),
      folder('persona/member', [
        file('usecase', 'usecase', [
          exported(
            'add_a_thing',
            component({ kind: 'usecase' }, 'schema', undefined, {
              shapes: {
                input: json(added),
                ...Object.fromEntries(
                  Object.entries(parts.events ?? { you_have_added_the_thing: tell }).map(
                    ([name, schema]) => [`event/${name}`, json(schema)],
                  ),
                ),
              },
            }),
            7,
          ),
        ]),
        version('member', parts.member ?? '1.0.0'),
      ]),
    ],
  }
}

const released = major_registries(tree())

const lines = (failures: readonly Failure[]): readonly string[] =>
  failures.map(
    (failure) => `${failure.path}:${String(failure.line)}  ${failure.rule}  ${failure.sentence}`,
  )

describe('the registries by major as JSON Schema', () => {
  it('writes beside each version the current major, in each past major its own, with the shapes and their directions (TST-7)', () => {
    const files = snapshots(tree())
    expect(files.map((one) => one.path)).toEqual([
      'business/things/_registry.json',
      'business/things/1/_registry.json',
      'persona/member/_registry.json',
    ])
    const current: unknown = JSON.parse(text_in(files, 'business/things/_registry.json'))
    expect(current).toMatchObject({
      domain: 'business/things',
      major: 2,
      version: '2.0.0',
      paths: {
        'business/things/id/thing_id': { kind: 'id', shapes: { schema: { direction: 'carried' } } },
        'business/things/value/colour': {
          kind: 'value',
          shapes: { schema: { direction: 'carried' } },
        },
        'business/things/fact/a_thing_has_been_added': {
          kind: 'fact',
          shapes: { schema: { direction: 'read' } },
        },
        'business/things/command/add_a_thing': { kind: 'command' },
        'business/things/command/add_a_thing_input': {
          kind: 'command',
          shapes: { schema: { direction: 'read' } },
        },
        'business/things/usecase/add_a_thing': { kind: 'usecase' },
        'business/things/version/things': { kind: 'version' },
      },
    })
    const past: unknown = JSON.parse(text_in(files, 'business/things/1/_registry.json'))
    expect(past).toEqual({
      domain: 'business/things',
      major: 1,
      paths: {
        'business/things/fact/a_thing_has_been_added': {
          kind: 'fact',
          shapes: { schema: { direction: 'read', schema: json(z.strictObject({})) } },
        },
      },
    })
    const leaf: unknown = JSON.parse(text_in(files, 'persona/member/_registry.json'))
    expect(leaf).toMatchObject({
      paths: {
        'persona/member/usecase/add_a_thing': {
          shapes: { 'event/you_have_added_the_thing': { direction: 'given' } },
        },
        'persona/member/usecase/add_a_thing_input': { shapes: { schema: { direction: 'read' } } },
      },
    })
  })

  it('passes a tree as it was released', () => {
    expect(compared(tree(), released)).toEqual([])
  })
})

describe('the comparison with the registries a release left, by direction (DOM-24, PER-17)', () => {
  it('passes what the tree reads widened at a minor, and stops it narrowed, at any version', () => {
    const wider = z.strictObject({ thing_id: z.string().min(1), note: z.string().optional() })
    const narrower = z.strictObject({ thing_id: z.string().min(1), note: z.string() })
    expect(compared(tree({ things: '2.1.0', fact: wider, input: wider }), released)).toEqual([])
    expect(lines(compared(tree({ things: '2.1.0', fact: narrower }), released))).toEqual([
      'business/things/fact.ts:4  DOM-24  business/things/fact/a_thing_has_been_added changes its shape against the direction it is read in, since things 2.0.0: what the tree reads only widens, every shape it left still parsing; this is a major',
    ])
    expect(lines(compared(tree({ input: wider }), released))).toEqual([
      'business/things/command.ts:6  DOM-24  business/things/command/add_a_thing_input changes its shape, and things stays at 2.0.0: a shape changes at a minor',
    ])
    expect(lines(compared(tree({ things: '2.0.1', input: wider }), released))).toEqual([
      'business/things/command.ts:6  DOM-24  business/things/command/add_a_thing_input changes its shape, and things stays at 2.0.1: a shape changes at a minor',
    ])
  })

  it('passes what its clients read narrowed at a minor, and stops it widened or an event added', () => {
    const narrower = z.strictObject({ thing_id: z.string().min(1), name: z.string().min(1) })
    const wider = z.strictObject({
      thing_id: z.string().min(1),
      name: z.string(),
      pick_up_by: z.iso.date().optional(),
    })
    expect(
      compared(tree({ member: '1.1.0', events: { you_have_added_the_thing: narrower } }), released),
    ).toEqual([])
    expect(
      lines(
        compared(tree({ member: '1.1.0', events: { you_have_added_the_thing: wider } }), released),
      ),
    ).toEqual([
      'persona/member/usecase.ts:7  DOM-24  persona/member/usecase/add_a_thing changes its event you_have_added_the_thing against the direction it is read in, since member 1.0.0: what its clients read only narrows, every shape it gives parsing with the old schema; this is a major',
    ])
    expect(
      lines(
        compared(
          tree({
            member: '1.1.0',
            events: { you_have_added_the_thing: tell, the_thing_is_already_there: tell },
          }),
          released,
        ),
      ),
    ).toEqual([
      'persona/member/usecase.ts:7  DOM-24  persona/member/usecase/add_a_thing changes its event the_thing_is_already_there against the direction it is read in, since member 1.0.0: what its clients read only narrows, every shape it gives parsing with the old schema; this is a major',
    ])
  })

  it('passes a shape carried by others changed at a minor, whatever its direction, and a path added', () => {
    const colours = z.enum(['red'])
    expect(compared(tree({ things: '2.1.0', colour: colours, more: true }), released)).toEqual([])
    expect(lines(compared(tree({ colour: colours, more: true }), released))).toEqual([
      'business/things/usecase.ts:3  DOM-24  business/things/usecase/paint_a_thing is new, and things stays at 2.0.0: a path is added at a minor',
      'business/things/value.ts:1  DOM-24  business/things/value/colour changes its shape, and things stays at 2.0.0: a shape changes at a minor',
    ])
  })

  it('stops a path gone, and a version gone back', () => {
    const without: Tree = {
      ...tree(),
      folders: tree().folders.map((one) =>
        one.segments.join('/') === 'business/things'
          ? { ...one, files: one.files.filter((authored) => authored.stem !== 'usecase') }
          : one,
      ),
    }
    expect(lines(compared(without, released))).toEqual([
      'business/things/_registry.ts:1  DOM-24  business/things/usecase/add_a_thing was released at things 2.x, and is no longer there: a path disappears only with a major, kept in its folder',
    ])
    expect(lines(compared(tree({ things: '1.9.0', past: false }), released))).toEqual([
      'business/things/version.ts:2  DOM-22  things is at 1.9.0, and was released at 2.0.0: a version only grows',
    ])
  })

  it("keeps a past major's folder in its direction, its paths those it was released with (DOM-22)", () => {
    const narrower = z.strictObject({ name: z.string() })
    expect(lines(compared(tree({ past_fact: narrower, past_more: true }), released))).toEqual([
      'business/things/1/fact.ts:9  DOM-22  business/things/fact/a_thing_has_been_painted is in business/things/1, and things 1.x was not released with it: a past major keeps what it was released with, nothing more',
      "business/things/1/fact.ts:5  DOM-22  business/things/fact/a_thing_has_been_added changes its shape against the direction it is read in, since things 1.x: what the tree reads only widens, every shape it left still parsing; a past major's folder keeps it",
    ])
  })

  it('compares the major released as current with its folder once the next is out (SC-46)', () => {
    const at_one: readonly MajorRegistry[] = major_registries(
      tree({ things: '1.4.0', past: false, fact: z.strictObject({}) }),
    )
    expect(compared(tree(), at_one)).toEqual([])
    const forgotten_in_the_folder: Tree = {
      ...tree(),
      folders: tree().folders.map((one) =>
        one.segments.join('/') === 'business/things/1' ? { ...one, files: [] } : one,
      ),
    }
    // Its identities, values, commands and the business's use cases change with the current major alone; its facts stay.
    expect(lines(compared(forgotten_in_the_folder, at_one))).toEqual([
      'business/things/1/_registry.ts:1  DOM-22  business/things/fact/a_thing_has_been_added was released at things 1.x, and business/things/1 has it not: a past major keeps every component it was released with, written whole or delegated',
    ])
    expect(lines(compared(tree({ past_more: true }), at_one))).toEqual([
      'business/things/1/fact.ts:9  DOM-22  business/things/fact/a_thing_has_been_painted is in business/things/1, and things 1.4.0 was not released with it: a past major keeps what it was released with, nothing more',
    ])
  })
})
