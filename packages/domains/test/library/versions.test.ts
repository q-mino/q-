import { describe, expect, test } from 'vitest'
import * as z from 'zod'
import {
  $Versions,
  builders_at,
  correlation,
  date_time,
  entry_id,
  fingerprint,
  operation_id,
  position,
  replay,
  versions,
} from '../../src/library/index.ts'
import type {
  FactLog,
  LogEvent,
  Majors,
  RootContext,
  StoredEnvelope,
  StoredPart,
} from '../../src/library/index.ts'

// The versions of a store (part 4.4, DOM-22): a stored part or entry goes
// from the major it was written at to the current shape, major by major;
// what no major reads stops the reader, and, kept by the store, the start;
// the rebuild of an adapter's state from its log (`replay`). On a test
// domain written for the purpose (LIB-2), at its third major: a thing's size
// was a text at 1.x, inside the thing at 2.x, a number since 3.0.0.

const { fact, effect, version, earlier, delegate } = builders_at<RootContext>()

// Branded with their paths, as the generator brands a tree's (DOM-24).
const made_3 = fact({
  payload: z.strictObject({ thing: z.strictObject({ id: z.string(), size: z.number() }) }),
}).brand<'business/things/fact/a_thing_has_been_made'>()
const kept_3 = fact({
  payload: z.strictObject({ id: z.string() }),
}).brand<'business/things/fact/a_thing_has_been_kept'>()
const make_3 = effect({
  payload: z.strictObject({ id: z.string(), size: z.number() }),
}).brand<'business/things/effect/make_a_thing'>()

const current = {
  'business/things/fact/a_thing_has_been_made': made_3,
  'business/things/fact/a_thing_has_been_kept': kept_3,
  'business/things/effect/make_a_thing': make_3,
  'business/things/version/things': version('3.0.0'),
}

const made_2 = earlier(made_3)({
  payload: z.strictObject({ thing: z.strictObject({ id: z.string(), size: z.string() }) }),
  to_next: (payload) => ({ thing: { id: payload.thing.id, size: Number(payload.thing.size) } }),
}).brand<'business/things/fact/a_thing_has_been_made@2'>()
const kept_2 = delegate(kept_3)

const major_2 = {
  'business/things/fact/a_thing_has_been_made': made_2,
  'business/things/fact/a_thing_has_been_kept': kept_2,
  'business/things/effect/make_a_thing': delegate(make_3),
}

const major_1 = {
  'business/things/fact/a_thing_has_been_made': earlier(made_2)({
    payload: z.strictObject({ id: z.string(), size: z.string() }),
    to_next: (payload) => ({ thing: { id: payload.id, size: payload.size } }),
  }),
  'business/things/fact/a_thing_has_been_kept': delegate(kept_2),
  'business/things/effect/make_a_thing': earlier(make_3)({
    payload: z.strictObject({ id: z.string(), size: z.string() }),
    to_next: (payload) => ({ id: payload.id, size: Number(payload.size) }),
  }),
}

const things: Majors = { 3: current, 2: major_2, 1: major_1 }

/** A part of a thing made, as stored at a version. */
const made_at = (version: StoredPart['version'], payload: unknown): StoredPart => ({
  path: 'business/things/fact/a_thing_has_been_made',
  version,
  payload,
  resources: [],
})

const nothing_kept = { stored: () => Promise.resolve([]) }

/** Every value an async iterable gives, in order. */
const all_of = async <value>(values: AsyncIterable<value>): Promise<readonly value[]> => {
  const all: value[] = []
  for await (const each of values) all.push(each)
  return all
}

describe('a stored part at the current shape', () => {
  test('a part of 1.x goes through 2.x to 3.0.0, each step pure over the payload', async () => {
    const read = (await versions([things])(nothing_kept))[$Versions]
    expect(read.part(made_at('1.2.0', { id: 'T1', size: '12' }))).toEqual({
      path: 'business/things/fact/a_thing_has_been_made',
      payload: { thing: { id: 'T1', size: 12 } },
      resources: [],
    })
    expect(read.part(made_at('2.7.1', { thing: { id: 'T1', size: '12' } })).payload).toEqual({
      thing: { id: 'T1', size: 12 },
    })
  })

  test('a part delegated twice reaches the current shape as written', async () => {
    const read = (await versions([things])(nothing_kept))[$Versions]
    expect(
      read.part({
        path: 'business/things/fact/a_thing_has_been_kept',
        version: '1.0.0',
        payload: { id: 'T1' },
        resources: [{ path: 'business/things/id/thing_id', value: 'T1' }],
      }),
    ).toEqual({
      path: 'business/things/fact/a_thing_has_been_kept',
      payload: { id: 'T1' },
      resources: [{ path: 'business/things/id/thing_id', value: 'T1' }],
    })
  })

  test('the current major at its minor or a lower one, any patch, parses with the current schema', async () => {
    const read = (await versions([things])(nothing_kept))[$Versions]
    const at_3 = { thing: { id: 'T1', size: 12 } }
    expect(read.part(made_at('3.0.0', at_3)).payload).toEqual(at_3)
    expect(read.part(made_at('3.0.4', at_3)).payload).toEqual(at_3)
  })

  test('a newer minor or major, a path its major has not, a domain not given: the reader stops', async () => {
    const read = (await versions([things])(nothing_kept))[$Versions]
    const at_3 = { thing: { id: 'T1', size: 12 } }
    expect(() => read.part(made_at('3.1.0', at_3))).toThrow(
      'business/things/fact/a_thing_has_been_made at 3.1.0: newer than business/things at 3.0.0: written by a newer release, the reader stops and retries (DOM-22): the reader stops',
    )
    expect(() => read.part(made_at('4.0.0', at_3))).toThrow('newer than business/things at 3.0.0')
    expect(() =>
      read.part({ ...made_at('2.0.0', at_3), path: 'business/things/fact/a_thing_has_been_lost' }),
    ).toThrow('no component of business/things at major 2 leads to one of 3.0.0')
    expect(() =>
      read.part({ ...made_at('1.0.0', {}), path: 'business/others/fact/a_thing_has_been_made' }),
    ).toThrow('of no domain whose majors the store was given')
  })

  test('a payload its version does not parse stops the reader, never guessed', async () => {
    const read = (await versions([things])(nothing_kept))[$Versions]
    expect(() => read.part(made_at('1.0.0', { id: 'T1', size: 12 }))).toThrow()
  })

  test('which paths the versions read: the domains given', async () => {
    const read = (await versions([things])(nothing_kept))[$Versions]
    expect(read.reads('business/things/fact/a_thing_has_been_made')).toBe(true)
    expect(read.reads('business/things/an_open_thing/usecase/close_it')).toBe(true)
    expect(read.reads('business/thingsmith/fact/a_thing_has_been_made')).toBe(false)
  })
})

describe('a stored entry at the current shape', () => {
  test('its payload translated, its id, when it may go, its resources and its correlation as queued, no version', async () => {
    const read = (await versions([things])(nothing_kept))[$Versions]
    expect(
      read.entry({
        effect: 'business/things/effect/make_a_thing',
        id: entry_id.parse('T1'),
        version: '1.0.0',
        payload: { id: 'T1', size: '12' },
        not_before: date_time.parse('2026-11-15T10:12:00-05:00'),
        resources: [{ path: 'business/things/id/thing_id', value: 'T1' }],
        correlation: correlation.parse('C1'),
      }),
    ).toEqual({
      effect: 'business/things/effect/make_a_thing',
      id: 'T1',
      payload: { id: 'T1', size: 12 },
      not_before: '2026-11-15T10:12:00-05:00',
      resources: [{ path: 'business/things/id/thing_id', value: 'T1' }],
      correlation: 'C1',
    })
  })
})

describe('the checks at wiring', () => {
  test('a stored version no major reads stops the start, naming each', async () => {
    await expect(
      versions([{ 3: current, 2: major_2 }])({
        stored: () =>
          Promise.resolve([
            { path: 'business/things/fact/a_thing_has_been_made', version: '1.4.0' },
            { path: 'business/things/fact/a_thing_has_been_kept', version: '2.0.0' },
            { path: 'business/things/effect/make_a_thing', version: '3.2.0' },
          ]),
      }),
    ).rejects.toThrow(
      [
        'the store keeps business/things/fact/a_thing_has_been_made at 1.4.0: business/things keeps no folder of major 1: deleted while the store keeps it (DOM-22, D101)',
        'the store keeps business/things/effect/make_a_thing at 3.2.0: newer than business/things at 3.0.0: written by a newer release, the reader stops and retries (DOM-22)',
      ].join('\n'),
    )
  })

  test("a current major not its version.ts's, majors with no version or two, a domain given twice", async () => {
    await expect(versions([{ 2: current }])(nothing_kept)).rejects.toThrow(
      'business/things is at 3.0.0 by its version.ts, and its majors give it as major 2',
    )
    await expect(versions([{ 2: major_2 }])(nothing_kept)).rejects.toThrow(
      'majors given with 0 versions declared',
    )
    await expect(versions([{ 3: current, 2: current }])(nothing_kept)).rejects.toThrow(
      'majors given with 2 versions declared',
    )
    await expect(versions([things, { 3: current }])(nothing_kept)).rejects.toThrow(
      'business/things given twice: one domain, one majors (DOM-22)',
    )
  })
})

describe('replay, the facts of a log for a rebuild', () => {
  test('writes of a domain the versions do not read stop it at wiring', async () => {
    const read = await versions([{ 3: current }])(nothing_kept)
    expect(() =>
      replay<typeof made_3, number>({
        versions: read,
        writes: { 'business/things/fact/a_thing_has_been_made': () => 0 },
      }),
    ).not.toThrow()
    const others = await versions([])(nothing_kept)
    expect(() =>
      replay<typeof made_3, number>({
        versions: others,
        writes: { 'business/things/fact/a_thing_has_been_made': () => 0 },
      }),
    ).toThrow(
      'the writes name business/things/fact/a_thing_has_been_made, of no domain whose majors the versions were given (DOM-22, CFG-2)',
    )
  })

  const log =
    (events: readonly LogEvent[]): FactLog =>
    () => ({
      [Symbol.asyncIterator]: () => {
        const each = events[Symbol.iterator]()
        return { next: () => Promise.resolve(each.next()) }
      },
    })
  const envelope = (parts: readonly StoredPart[]): StoredEnvelope => ({
    parts,
    operation: { id: operation_id.parse('O1'), scope: 'test' },
    correlation: correlation.parse('C1'),
    branch: 'made',
    composed: {},
    fingerprint: fingerprint.parse('F1'),
  })

  test('each part at the current shape through its write; a part of a path with no write passes', async () => {
    const read = await versions([things])(nothing_kept)
    const replayed = await all_of(
      replay<typeof made_3, number>({
        versions: read,
        writes: {
          'business/things/fact/a_thing_has_been_made': (payload) => payload.thing.size,
        },
      })(
        log([
          {
            event: 'fact',
            position: position.parse('1'),
            fact: envelope([
              made_at('1.0.0', { id: 'T1', size: '12' }),
              {
                path: 'business/things/fact/a_thing_has_been_kept',
                version: '1.0.0',
                payload: { id: 'T1' },
                resources: [],
              },
            ]),
          },
          { event: 'caught_up', position: position.parse('1') },
        ]),
      ),
    )
    expect(replayed).toEqual([{ position: '1', writes: [12] }])
  })

  test('a log that keeps its first fact no longer stops the rebuild', async () => {
    const read = await versions([things])(nothing_kept)
    const replayed = replay<typeof made_3, number>({
      versions: read,
      writes: { 'business/things/fact/a_thing_has_been_made': () => 0 },
    })(log([{ event: 'position_unavailable' }]))
    await expect(all_of(replayed)).rejects.toThrow('the log keeps its first fact no longer')
  })
})
