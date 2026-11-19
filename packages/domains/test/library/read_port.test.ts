import { describe, expect, test } from 'vitest'
import * as z from 'zod'
import {
  builders_at,
  date_time,
  day,
  day_of,
  position,
  read_use_case_ports,
  time_zone,
  versions,
} from '../../src/library/index.ts'
import type { PlannedQuery, Registry, RootContext } from '../../src/library/index.ts'

// The read ports (part 5.1, DOM-18, LIB-9): the query planned as data for
// the adapter, its selection folded into the adapter's fragments, a
// calculation one more field, the order closed by the identity; the entries
// parsed; the snapshot at the position read at; an input not in its schema,
// and the faults of the wiring. On a test domain written for the purpose
// (LIB-2): the things of a workshop, their uses counted since a day.

const { id, selection, calculation, query, read_use_case, AND, NOT } = builders_at<RootContext>()

// Branded with their paths, as the generator brands a tree's (DOM-24).
const thing_id = id({ format: z.string().min(1) }).brand<'business/things/id/thing_id'>()
const owner_id = id({ format: z.string().min(1) }).brand<'business/owners/id/owner_id'>()
const the_thing_is_kept = selection({
  subject: 'thing',
  parameters: z.strictObject({}),
}).brand<'business/things/selection/thing/the_thing_is_kept'>()
const the_thing_is_lost = selection({
  subject: 'thing',
  parameters: z.strictObject({}),
}).brand<'business/things/selection/thing/the_thing_is_lost'>()
const the_thing_is_of_this_kind = selection({
  subject: 'thing',
  parameters: z.strictObject({ kind: z.string() }),
}).brand<'business/things/selection/thing/the_thing_is_of_this_kind'>()
const the_uses_of_the_thing_since = calculation({
  subject: 'thing',
  parameters: z.strictObject({ since: day }),
  value: z.number().int().nonnegative(),
}).brand<'business/things/calculation/thing/the_uses_of_the_thing_since'>()

const the_thing_is_at_hand = AND({
  the_thing_is_kept,
  the_thing_is_not_lost: NOT(the_thing_is_lost),
  the_thing_is_of_the_kind: the_thing_is_of_this_kind,
})

/** The things at hand of a kind, the most used since a day first, then by name. */
const the_things_at_hand = query({
  input: (context: RootContext) =>
    z.strictObject({
      kind: z.string(),
      // A static rule over the input and `now` (DOM-21): a day before today.
      since: day.refine((since) => since < day_of(context.now)),
    }),
  fields: z.strictObject({ id: thing_id, name: z.string(), owner: owner_id.optional() }),
  calculations: { uses: the_uses_of_the_thing_since },
  identity: 'id',
  selection: the_thing_is_at_hand,
  order: { uses: 'descending', name: 'ascending' },
  creator: () => (input) => ({
    selection: {
      the_thing_is_kept: {},
      the_thing_is_not_lost: {},
      the_thing_is_of_the_kind: { kind: input.kind },
    },
    calculations: { uses: { since: input.since } },
  }),
})

/** The things of an owner, named by the owner's identity, of another domain. */
const the_owners_of_things = query({
  input: z.strictObject({}),
  fields: z.strictObject({ owner: owner_id, name: z.string() }),
  identity: 'owner',
  selection: the_thing_is_kept,
  order: { owner: 'descending' },
  creator: () => () => ({ selection: {} }),
})

const things_at_hand = read_use_case({ query: the_things_at_hand })
const owners = read_use_case({ query: the_owners_of_things })

const registry = {
  'business/things/id/thing_id': thing_id,
  'business/things/selection/thing/the_thing_is_kept': the_thing_is_kept,
  'business/things/selection/thing/the_thing_is_lost': the_thing_is_lost,
  'business/things/selection/thing/the_thing_is_of_this_kind': the_thing_is_of_this_kind,
  'business/things/calculation/thing/the_uses_of_the_thing_since': the_uses_of_the_thing_since,
  'business/things/query/the_things_at_hand': the_things_at_hand,
  'business/things/query/the_owners_of_things': the_owners_of_things,
  'business/things/usecase/things_at_hand': things_at_hand,
  'business/things/usecase/owners': owners,
} satisfies Registry

const owners_registry = { 'business/owners/id/owner_id': owner_id } satisfies Registry

const the_versions = await versions([])({ stored: () => Promise.resolve([]) })

const context: RootContext = {
  now: date_time.parse('2026-11-19T10:00:00-05:00'),
  time_zone: time_zone.parse('America/Toronto'),
}

/** A fragment of the test adapter: a text, as SQL would write it. */
type Text = string

/** An adapter that writes its fragments as text, keeps the plans it is given, and reads the entries it is told. */
const an_adapter = (stored: readonly unknown[]) => {
  const plans: PlannedQuery<Text, Text, Text>[] = []
  return {
    plans,
    calculations: {
      'business/things/calculation/thing/the_uses_of_the_thing_since': (parameters: {
        readonly since: string
      }) => `(select count(*) from uses where day >= '${parameters.since}')`,
    },
    adapter: {
      algebra: {
        predicate: {
          'business/things/selection/thing/the_thing_is_kept': () => 'kept',
          'business/things/selection/thing/the_thing_is_lost': () => 'lost',
          'business/things/selection/thing/the_thing_is_of_this_kind': (parameters: {
            readonly kind: string
          }) => `kind = '${parameters.kind}'`,
        },
        and: (components: readonly Text[]) => `(${components.join(' and ')})`,
        or: (components: readonly Text[]) => `(${components.join(' or ')})`,
        not: (operand: Text) => `not ${operand}`,
        after: () => 'after',
      },
      sources: {
        things_at_hand: { from: 'things', fields: { id: 'id', name: 'name', owner: 'owner' } },
        owners: { from: 'things', fields: { owner: 'owner', name: 'name' } },
      },
      read: (plan: PlannedQuery<Text, Text, Text>) => {
        plans.push(plan)
        return Promise.resolve({ entries: stored, position: position.parse('7') })
      },
      page: () => Promise.reject(new Error('no page in this test')),
    },
  }
}

describe('the read ports (part 5.1)', () => {
  test('a query planned as data: the selection folded, a calculation one more field, the order closed by the identity', async () => {
    const { plans, adapter, calculations } = an_adapter([
      { id: 'hammer-2', name: 'Hammer', owner: undefined, uses: 3 },
      { id: 'hammer-1', name: 'Hammer', uses: 3 },
    ])
    const ports = read_use_case_ports({
      registry,
      identities: owners_registry,
      versions: the_versions,
      use_cases: { things_at_hand, owners },
    })({ ...adapter, calculations, streams: {} })
    const events = []
    for await (const event of ports.things_at_hand(context, {
      kind: 'hand',
      since: '2026-11-01',
    })) {
      events.push(event)
    }
    expect(plans).toEqual([
      {
        from: 'things',
        fields: {
          id: 'id',
          name: 'name',
          owner: 'owner',
          uses: "(select count(*) from uses where day >= '2026-11-01')",
        },
        identity: { field: 'id', path: 'business/things/id/thing_id' },
        selection: "(kept and not lost and kind = 'hand')",
        order: [
          ["(select count(*) from uses where day >= '2026-11-01')", 'descending'],
          ['name', 'ascending'],
          ['id', 'ascending'],
        ],
      },
    ])
    expect(events).toEqual([
      {
        event: 'snapshot',
        entries: [
          { id: 'hammer-2', name: 'Hammer', owner: undefined, uses: 3 },
          { id: 'hammer-1', name: 'Hammer', uses: 3 },
        ],
        position: '7',
        total: 2,
      },
    ])
    expect(ports.things_at_hand.streamed).toBe(false)
  })

  test("an order that names the identity already is total as written; an identity of another domain, by the registry of its domain's identities", async () => {
    const { plans, adapter } = an_adapter([])
    const ports = read_use_case_ports({
      registry,
      identities: owners_registry,
      versions: the_versions,
      use_cases: { owners },
    })({ ...adapter, streams: {} })
    expect(await first(ports.owners(context, {}))).toMatchObject({ entries: [], total: 0 })
    expect(plans[0]?.order).toEqual([['owner', 'descending']])
    expect(plans[0]?.identity).toEqual({ field: 'owner', path: 'business/owners/id/owner_id' })
  })

  test('an input not in its schema, built over the context, reads nothing', async () => {
    const { plans, adapter, calculations } = an_adapter([])
    const ports = read_use_case_ports({
      registry,
      identities: owners_registry,
      versions: the_versions,
      use_cases: { things_at_hand },
    })({ ...adapter, calculations, streams: {} })
    const invalid = { event: 'invalid_request', reason: 'input_not_in_schema' }
    // Today, 19 November, is not before today.
    expect(
      await every(ports.things_at_hand(context, { kind: 'hand', since: '2026-11-19' })),
    ).toEqual([invalid])
    expect(plans).toEqual([])
  })

  test('an entry its fields do not parse is a fault of the adapter', async () => {
    const { adapter, calculations } = an_adapter([{ id: '', name: 'Hammer', uses: 3 }])
    const ports = read_use_case_ports({
      registry,
      identities: owners_registry,
      versions: the_versions,
      use_cases: { things_at_hand },
    })({ ...adapter, calculations, streams: {} })
    await expect(
      first(ports.things_at_hand(context, { kind: 'hand', since: '2026-11-01' })),
    ).rejects.toThrow(
      'business/things/usecase/things_at_hand: the adapter gives an entry its fields do not parse (ADP-8)',
    )
  })

  test('at wiring, every fault in one message: a use case not in the registry, an identity no registry given names', () => {
    const without_the_use_case: Registry = Object.fromEntries(
      Object.entries(registry).filter(
        ([path]) => path !== 'business/things/usecase/things_at_hand',
      ),
    )
    expect(() =>
      read_use_case_ports({
        registry: without_the_use_case,
        versions: the_versions,
        use_cases: { things_at_hand, owners },
      }),
    ).toThrow(
      [
        'the use case things_at_hand is not in the registry given (DOM-24)',
        'business/things/usecase/owners: its identity owner is an identity that no registry given names: give the registry of its domain (identities, DOM-24)',
      ].join('\n'),
    )
  })

  test('a port that streams gives its snapshot; the stream after it, the pages and a resume come with their parts', async () => {
    const { adapter } = an_adapter([])
    const log = () => every_of([])
    const ports = read_use_case_ports({
      registry,
      identities: owners_registry,
      versions: the_versions,
      use_cases: { owners },
    })({ ...adapter, streams: { owners: { strategy: 'composed', log } } })
    expect(ports.owners.streamed).toBe(true)
    expect(await first(ports.owners(context, {}))).toMatchObject({ event: 'snapshot' })
    await expect(every(ports.owners(context, {}))).rejects.toThrow('part 5.2')
    await expect(every(ports.owners(context, {}, position.parse('3')))).rejects.toThrow('part 5.2')
    expect(() => ports.owners.pages(context, {}, {})).toThrow('part 5.3')
  })
})

/** The first event of a stream. */
const first = async <event>(events: AsyncIterable<event>): Promise<event> => {
  for await (const event of events) return event
  throw new Error('no event')
}

/** Every event of a stream, until it ends. */
const every = async <event>(events: AsyncIterable<event>): Promise<readonly event[]> => {
  const all: event[] = []
  for await (const event of events) all.push(event)
  return all
}

/** The values given, one at a time. */
const every_of = <value>(values: readonly value[]): AsyncIterable<value> => ({
  [Symbol.asyncIterator]: () => {
    const each = values[Symbol.iterator]()
    return { next: () => Promise.resolve(each.next()) }
  },
})
