import {
  a_hosted_extension,
  compose_an_extension,
  the_kernels_offer,
  type ANotice,
  type Composed,
  type TheKernelsTraced,
  type Transport,
} from '@q-mino/adapters-common'
import * as boundary from '@q-mino/boundary'
import * as zz from '@q-mino/domains/library'
import { greetings } from '@q-mino/greetings'
import manifest_json from '@q-mino/greetings/manifest.json' with { type: 'json' }
import { describe, expect, test } from 'vitest'
import { in_process, partitions } from '../../src/index.ts'

// The test extension hosted by the kernel's side on the oracle (EXT-2,
// EXT-4, EXT-6, EXT-13, EXT-14, EXT-15; part 12.4): `greetings` composed
// from its `manifest.json`, loaded in process (each message copied as
// JSON) over its partition, its leaves invoked through the boundary, its
// calls served. The story of two nodes and the relay is
// `on_the_oracle.test.ts`.

const clock: zz.Clock = {
  now: () => zz.date_time.parse('2026-11-20T09:00:00.000Z'),
  time_zone: zz.time_zone.parse('Europe/Rome'),
}

/** The composition of greetings, or the test fails with its message. */
const composed_from = (manifest: unknown): Composed => {
  const composition = compose_an_extension(the_kernels_offer([]))(manifest)
  if (composition.composition === 'a_fault') throw new Error(composition.message)
  return composition.composed
}

/** Turns of the event loop, until a condition holds. */
const until = async (holds: () => boolean): Promise<void> => {
  for (let round = 0; round < 400 && !holds(); round += 1) {
    await new Promise<void>((done) => {
      setTimeout(done, 1)
    })
  }
  if (!holds()) throw new Error('it did not come to pass')
}

/** Every event of a stream, until it ends. */
const all = async (events: AsyncIterable<unknown>): Promise<readonly unknown[]> => {
  const every: unknown[] = []
  for await (const event of events) every.push(event)
  return every
}

/** A node of the oracle hosting greetings: its partition of the node's, its port of requests answering as the test says, what it traced and was told. */
const a_node = (
  more: {
    readonly manifest?: unknown
    readonly characters?: number
    readonly answering?: (request: boundary.a_request) => boundary.an_answer_to_a_request
  } = {},
) => {
  const traced: TheKernelsTraced[] = []
  const notices: ANotice[] = []
  const requests: boundary.a_request[] = []
  const to_the_extension: boundary.a_message_to_an_extension[] = []
  const answering = {
    current:
      more.answering ??
      ((): boundary.an_answer_to_a_request => ({
        answer: 'responded',
        event: { event: 'greeted_back', payload: { words: 'ciao anche a te' } },
      })),
  }
  const storage = partitions({ characters: more.characters ?? 1_000_000 })
  const loaded = in_process((send) =>
    greetings({
      clock,
      elapsed: () =>
        new Promise((done) => {
          setTimeout(done, 1)
        }),
      send,
    }),
  )
  const recorded: Transport = (to_the_kernel) => {
    const realm = loaded(to_the_kernel)
    return {
      to_the_extension: (message) => {
        to_the_extension.push(message)
        realm.to_the_extension(message)
      },
      unload: realm.unload,
    }
  }
  const hosted = a_hosted_extension({
    composed: composed_from(more.manifest ?? manifest_json),
    transport: recorded,
    is_active: () => Promise.resolve(true),
    the_port_of_requests: (request) => {
      requests.push(request)
      return Promise.resolve(answering.current(request))
    },
    its_storage: storage.of('greetings'),
    the_bond_on_known: (context) => ({
      bond: String(context['bond_id']),
      peer_key: 'KEY-OF-ANNA',
      bond_name: 'Anna',
    }),
    trace: (entry) => {
      traced.push(entry)
    },
    notices: (notice) => {
      notices.push(notice)
    },
    clock,
    a_while: () =>
      new Promise((done) => {
        setTimeout(done, 5)
      }),
  })
  return { hosted, storage, traced, notices, requests, to_the_extension, answering }
}

/** Anna's gesture on her bond with Bruno, as the library's mounted port on `self` invokes it. */
const anna_greets = (operation: string): zz.MountedInvocation => ({
  leaf: 'usecase/greet_a_bond',
  version: '1.0.0',
  context: { caller: 'the_user' },
  operation: { id: zz.operation_id.parse(operation), scope: 'self/user' },
  input: { bond: 'B-BRUNO' },
})

/** Anna's request P1 at Bruno's node, as the library's mounted port on `known` invokes it below the kernel's node. */
const anna_asks_bruno = (input: unknown = { words: 'ciao' }): zz.MountedInvocation => ({
  leaf: 'usecase/greet',
  version: '1.0.0',
  context: { bond_id: 'B-ANNA', caller: { is: 'a_face', key: 'KEY-OF-ANNA' } },
  operation: { id: zz.operation_id.parse('P1'), scope: 'known/KEY-OF-ANNA' },
  input,
})

/** The greeting the events of Anna's gesture name. */
const the_greeting_of = (events: readonly unknown[]): string => {
  const id: unknown = Reflect.get(Reflect.get(Object(events[0]), 'payload') ?? {}, 'greeting_id')
  if (typeof id !== 'string') throw new Error('no greeting')
  return id
}

describe('greetings composed from its manifest.json (EXT-4, EXT-6)', () => {
  test('every JSON Schema of its surfaces read; greet’s input checked whole before the node', () => {
    const composed = composed_from(manifest_json)
    const greet = composed.surfaces.known?.majors[1]?.['usecase/greet']
    expect(greet?.input.safeParse({ words: 'ciao' }).success).toBe(true)
    expect(greet?.input.safeParse({}).success).toBe(false)
    expect(greet?.input.safeParse({ words: '' }).success).toBe(false)
    expect(greet?.input.safeParse({ words: 'c'.repeat(281) }).success).toBe(false)
    expect(greet?.input.safeParse({ words: 'ciao', more: 1 }).success).toBe(false)
    expect(
      greet?.events['greeted_back']?.safeParse({
        event: 'greeted_back',
        payload: { words: 'ciao anche a te' },
      }).success,
    ).toBe(true)
    expect(greet?.events['not_found']?.safeParse({ event: 'not_found' }).success).toBe(true)
    expect(
      composed.surfaces.self?.majors[1]?.['usecase/greet_a_bond']?.input.safeParse({
        bond: 'B-BRUNO',
      }).success,
    ).toBe(true)
  })
})

describe('greetings hosted in process (EXT-13, EXT-15)', () => {
  test('loaded over its partition, ready as its manifest; Anna greets, the port of requests called, the greeting back recorded', async () => {
    const node = a_node()
    expect(await node.hosted.load()).toEqual({ loaded: 'running' })
    const events = await all(node.hosted.invokes('self')(anna_greets('op-1')))
    const greeting_id = the_greeting_of(events)
    expect(events).toEqual([{ event: 'the_greeting_is_sent', payload: { greeting_id } }])
    await until(() =>
      JSON.stringify(node.storage.kept('greetings').get(`state/greeting/${greeting_id}`)).includes(
        'the_greeting_came_back',
      ),
    )
    expect(node.requests).toEqual([
      {
        bond: 'B-BRUNO',
        invokes: { persona: 'known', use_case: 'usecase/greet', version: '1.0.0' },
        input: { words: 'ciao' },
        effect: 'business/greetings/effect/ask_for_a_greeting_back',
        id: greeting_id,
        waits: 60,
      },
    ])
    await node.hosted.unload()
    expect(node.hosted.life()).toEqual({ life: 'unloaded' })
  })

  test('Bruno’s greet on known: the bond alone, the scope known/<bond>, no key; one event', async () => {
    const node = a_node()
    await node.hosted.load()
    expect(await all(node.hosted.invokes('known')(anna_asks_bruno()))).toEqual([
      { event: 'greeted_back', payload: { words: 'ciao anche a te' } },
    ])
    const invoked = node.to_the_extension.find((message) => message.message === 'invoke')
    expect(invoked).toMatchObject({
      persona: 'known',
      context: { bond: 'B-ANNA' },
      operation: { id: 'P1', scope: 'known/B-ANNA' },
    })
    expect(JSON.stringify(invoked)).not.toContain('KEY-OF-ANNA')
    await node.hosted.unload()
  })

  test('its ready not its manifest’s: a composition fault, it does not run', async () => {
    const node = a_node({ manifest: { ...manifest_json, version: '0.2.0' } })
    const loaded = await node.hosted.load()
    expect(loaded.loaded === 'a_composition_fault' && loaded.fault.message).toBe(
      'greetings: it said ready as greetings 0.1.0 with the boundary 1.0.0, not as its manifest (EXT-15)',
    )
    expect(node.to_the_extension.some((message) => message.message === 'start')).toBe(false)
  })

  test('its partition full: the commit refused, a fall, loaded again; a second fall leaves it stopped', async () => {
    const node = a_node({ characters: 200 })
    expect(await node.hosted.load()).toEqual({ loaded: 'running' })
    await expect(all(node.hosted.invokes('self')(anna_greets('op-1')))).rejects.toThrow(
      'greetings: it has fallen',
    )
    await until(() => node.hosted.life().life === 'running')
    await expect(all(node.hosted.invokes('self')(anna_greets('op-2')))).rejects.toThrow(
      'greetings: it has fallen',
    )
    expect(node.hosted.life()).toEqual({ life: 'stopped', why: 'it_fell_twice' })
    expect(node.traced.map((entry) => entry.why)).toEqual([
      'the_extension_has_fallen',
      'the_extension_has_fallen',
    ])
    expect([...node.storage.kept('greetings').keys()].some((key) => key.startsWith('state/'))).toBe(
      false,
    )
  })

  test('its dead letter shown with its name; the user redelivers it: delivered, released (EXT-2)', async () => {
    const node = a_node({ answering: () => ({ answer: 'the_bond_is_gone' }) })
    await node.hosted.load()
    const greeting_id = the_greeting_of(await all(node.hosted.invokes('self')(anna_greets('op-1'))))
    const letter = `business/greetings/effect/ask_for_a_greeting_back/${greeting_id}`
    await until(() => node.notices.some((notice) => notice.notice.message === 'dead_letter'))
    expect(node.notices[0]).toMatchObject({
      extension: 'greetings',
      notice: { message: 'dead_letter', letter, of: 'an_effect' },
    })
    node.answering.current = () => ({
      answer: 'responded',
      event: { event: 'greeted_back', payload: { words: 'ciao anche a te' } },
    })
    expect(node.hosted.redeliver(letter)).toBe('handed')
    await until(() => node.notices.some((notice) => notice.notice.message === 'released'))
    await node.hosted.unload()
  })
})

describe('the extensions’ partitions on the oracle (EXT-14)', () => {
  test('two extensions’ partitions never meet; a range in the order of the keys', async () => {
    const storage = partitions({ characters: 1000 })
    const greetings_storage = storage.of('greetings')
    const ping_pong = storage.of('ping_pong')
    await greetings_storage.commit([
      { write: 'set', key: 'b', value: 2 },
      { write: 'set', key: 'a', value: 1 },
      { write: 'set', key: 'c', value: 3 },
    ])
    expect(await ping_pong.read({ read: 'range' })).toEqual({ answer: 'read', entries: [] })
    expect(await greetings_storage.read({ read: 'range', from: 'a', before: 'c' })).toEqual({
      answer: 'read',
      entries: [
        { key: 'a', value: 1 },
        { key: 'b', value: 2 },
      ],
    })
    expect(await greetings_storage.read({ read: 'keys', keys: ['c', 'z', 'a'] })).toEqual({
      answer: 'read',
      entries: [
        { key: 'c', value: 3 },
        { key: 'a', value: 1 },
      ],
    })
  })

  test('a commit all or none: a full partition keeps nothing of it', async () => {
    const storage = partitions({ characters: 10 })
    const greetings_storage = storage.of('greetings')
    expect(await greetings_storage.commit([{ write: 'set', key: 'a', value: 1 }])).toEqual({
      answer: 'committed',
    })
    expect(
      await greetings_storage.commit([
        { write: 'delete', key: 'a' },
        { write: 'set', key: 'b', value: 'twelve chars' },
      ]),
    ).toEqual({ answer: 'refused', why: 'the_partition_is_full' })
    expect([...storage.kept('greetings')]).toEqual([['a', 1]])
  })
})
