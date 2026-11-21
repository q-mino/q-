import * as boundary from '@q-mino/boundary'
import { describe, expect, test } from 'vitest'
import package_json from '../package.json' with { type: 'json' }
import {
  a_node,
  a_partition,
  a_peer_pings,
  anna_pings,
  the_facts,
  the_ping,
  the_pongs,
  type Answering,
} from './kernel.ts'

// The stories of ping pong through the boundary (README.md, § Stories,
// 1–9; PNG-1..PNG-6; part 14.2), on a fake kernel that hosts it through the
// boundary's messages: Anna pings her bond with Bruno; Bruno's node answers
// with a pong; Anna's node records what came back, and her screen follows
// the ping to it.

/** Bruno's node answers Anna's request with his pong. */
const pong: Answering = () => ({ answer: 'responded', event: { event: 'pong', payload: {} } })

/** The effect whose deliveries are ping pong's requests. */
const ask_for_a_pong = 'business/pings/effect/ask_for_a_pong'

/** The ping the first event of Anna's screen names. */
const ping_of = (events: readonly unknown[]): string => {
  const [first] = events
  const parsed = boundary.an_event.parse(first)
  const payload = parsed['payload']
  const id: unknown =
    typeof payload === 'object' && payload !== null && !Array.isArray(payload)
      ? Reflect.get(payload, 'ping_id')
      : undefined
  if (typeof id !== 'string') throw new Error(`no ping: ${JSON.stringify(events)}`)
  return id
}

/** Anna's node started, then her tap: what her screen read once it stopped following. */
const anna_pings_bruno = async (answering: Answering, bond = 'B-BRUNO') => {
  const partition = a_partition()
  const anna = await a_node({ partition, answering })
  await anna.start()
  const events = await anna.invoke(anna_pings(bond, 'op-1'))
  return { partition, anna, events }
}

/** How a ping stands, as ping pong keeps it. */
const closed_with = (what_came_back: string) => ({
  progress: { stage: 'closed', what_came_back },
})

describe('the stories of ping pong, through the boundary', () => {
  test('a ping and its pong: the pong received, Anna’s screen follows it', async () => {
    const { partition, anna, events } = await anna_pings_bruno(pong)
    const ping_id = ping_of(events)
    expect(events).toEqual([
      { event: 'the_ping_is_sent', payload: { ping_id } },
      { event: 'pong', payload: { ping_id } },
    ])
    expect(anna.requests).toEqual([
      {
        bond: 'B-BRUNO',
        invokes: { persona: 'known', use_case: 'usecase/ping', version: '1.0.0' },
        input: {},
        effect: ask_for_a_pong,
        id: ping_id,
        waits: 60,
      },
    ])
    expect(the_ping(partition, ping_id)).toEqual({
      id: ping_id,
      bond: 'B-BRUNO',
      sent_at: '2026-11-20T10:00:00+01:00',
      waits: 60,
      progress: {
        stage: 'closed',
        what_came_back: 'the_pong_came_back',
        at: '2026-11-20T10:00:00+01:00',
      },
    })
    expect(the_facts(partition)).toEqual(['a_ping_has_been_sent', 'a_pong_has_been_received'])
    await anna.stop()
  })

  test('no response within its time: the ping had none, and the screen reads it', async () => {
    const { partition, anna, events } = await anna_pings_bruno(() => ({ answer: 'no_response' }))
    const ping_id = ping_of(events)
    expect(events.at(-1)).toEqual({ event: 'no_response', payload: { ping_id } })
    expect(the_ping(partition, ping_id)).toMatchObject(closed_with('the_ping_had_no_response'))
    expect(the_facts(partition)).toEqual(['a_ping_has_been_sent', 'a_ping_has_had_no_response'])
    await anna.stop()
  })

  test.each([
    { event: 'not_found' },
    { event: 'version_not_supported', current: '2.0.0', oldest: 2 },
    { event: 'invalid_request', reason: 'input_not_in_schema' },
    { event: 'no_pong', payload: {} },
  ])(
    'the peer cannot answer: not_found, version_not_supported, invalid_request, no_pong ($event)',
    async (event) => {
      const { partition, anna, events } = await anna_pings_bruno(() => ({
        answer: 'responded',
        event,
      }))
      const ping_id = ping_of(events)
      expect(events.at(-1)).toEqual({ event: 'the_peer_cannot_answer', payload: { ping_id } })
      expect(the_ping(partition, ping_id)).toMatchObject(closed_with('the_peer_cannot_answer'))
      expect(the_facts(partition)).toEqual(['a_ping_has_been_sent', 'a_ping_could_not_be_answered'])
      await anna.stop()
    },
  )

  test.each([
    { answer: 'refused', why: 'not_offered_to_the_bond' } as const,
    { answer: 'refused', why: 'not_active' } as const,
  ])(
    'called off, by a withdrawal or a deactivation: the ping called off, the screen reads it, no dead letter ($why)',
    async (answer) => {
      const { partition, anna, events } = await anna_pings_bruno(() => answer)
      const ping_id = ping_of(events)
      expect(events.at(-1)).toEqual({ event: 'called_off', payload: { ping_id } })
      expect(the_ping(partition, ping_id)).toMatchObject(closed_with('the_ping_was_called_off'))
      expect(the_facts(partition)).toEqual(['a_ping_has_been_sent', 'a_ping_has_been_called_off'])
      expect(anna.sent.filter((message) => message.message === 'dead_letter')).toEqual([])
      await anna.stop()
    },
  )

  test.each([
    {
      answer: { answer: 'refused', why: 'not_declared' } as const,
      reason: 'the port of requests refused it: not_declared',
    },
    {
      answer: { answer: 'refused', why: 'too_large_for_a_letter' } as const,
      reason: 'the port of requests refused it: too_large_for_a_letter',
    },
    { answer: { answer: 'the_bond_is_gone' } as const, reason: 'the bond is gone' },
  ])(
    'a fault, refused or the bond gone: a dead letter, shown, the ping still waiting ($reason)',
    async ({ answer, reason }) => {
      const partition = a_partition()
      const anna = await a_node({ partition, answering: () => answer })
      await anna.start()
      const screen = anna.invoke(anna_pings('B-BRUNO', 'op-1'))
      await anna.until(() => anna.sent.some((message) => message.message === 'dead_letter'))
      const ping_id = ping_of(anna.so_far(1))
      const dead = anna.sent.filter((message) => message.message === 'dead_letter')
      expect(dead).toMatchObject([
        {
          message: 'dead_letter',
          letter: `${ask_for_a_pong}/${ping_id}`,
          of: 'an_effect',
          path: ask_for_a_pong,
          entry: { id: ping_id },
          cause: { cause: 'exhausted', reason },
        },
      ])
      expect(the_ping(partition, ping_id)).toMatchObject({ progress: { stage: 'waiting' } })
      await anna.until(() => anna.long_waits() > 0)
      anna.the_time_passes()
      const events = await screen
      expect(events).toMatchObject([
        { event: 'the_ping_is_sent', payload: { ping_id } },
        { event: 'the_wait_is_over' },
      ])
      expect(the_ping(partition, ping_id)).toMatchObject({ progress: { stage: 'waiting' } })
      await anna.stop()
    },
  )

  test('a response that does not parse is a dead letter, and Carla’s pong is not held behind it', async () => {
    const partition = a_partition()
    let bruno_answers: (answer: boundary.an_answer_to_a_request) => void = () => undefined
    const anna = await a_node({
      partition,
      answering: (request) =>
        request.bond === 'B-BRUNO'
          ? new Promise((answers) => {
              bruno_answers = answers
            })
          : pong(request),
    })
    await anna.start()
    const to_bruno = anna.invoke(anna_pings('B-BRUNO', 'op-1'))
    const to_carla = await anna.invoke(anna_pings('B-CARLA', 'op-2'))
    const carla_s = ping_of(to_carla)
    // Carla's pong received while Bruno's request is still in flight (`order: 'any'`).
    expect(to_carla.at(-1)).toEqual({ event: 'pong', payload: { ping_id: carla_s } })
    expect(the_ping(partition, carla_s)).toMatchObject(closed_with('the_pong_came_back'))
    const bruno_s = ping_of(anna.so_far(1))
    expect(the_ping(partition, bruno_s)).toMatchObject({ progress: { stage: 'waiting' } })
    bruno_answers({
      answer: 'responded',
      event: { event: 'greeted_back', payload: { words: 'ciao anche a te' } },
    })
    await anna.until(() => anna.sent.some((message) => message.message === 'dead_letter'))
    expect(anna.sent.filter((message) => message.message === 'dead_letter')).toMatchObject([
      {
        letter: `${ask_for_a_pong}/${bruno_s}`,
        cause: {
          cause: 'exhausted',
          reason:
            'the peer\'s response is no event of ping: {"event":"greeted_back","payload":{"words":"ciao anche a te"}}',
        },
      },
    ])
    await anna.until(() => anna.long_waits() > 0)
    anna.the_time_passes()
    expect((await to_bruno).at(-1)).toMatchObject({ event: 'the_wait_is_over' })
    await anna.stop()
  })

  test('the screen’s wait is over at 70 seconds and records nothing; the ping closes after', async () => {
    const partition = a_partition()
    let bruno_answers: (answer: boundary.an_answer_to_a_request) => void = () => undefined
    const anna = await a_node({
      partition,
      answering: () =>
        new Promise((answers) => {
          bruno_answers = answers
        }),
    })
    await anna.start()
    const screen = anna.invoke(anna_pings('B-BRUNO', 'op-1'))
    await anna.until(() => anna.requests.length === 1 && anna.long_waits() > 0)
    const facts_before = the_facts(partition)
    anna.the_time_passes()
    const events = await screen
    const ping_id = ping_of(events)
    expect(events).toMatchObject([
      { event: 'the_ping_is_sent', payload: { ping_id } },
      { event: 'the_wait_is_over' },
    ])
    expect(the_facts(partition)).toEqual(facts_before)
    expect(the_ping(partition, ping_id)).toMatchObject({ progress: { stage: 'waiting' } })
    bruno_answers({ answer: 'responded', event: { event: 'pong', payload: {} } })
    await anna.until(() =>
      JSON.stringify(the_ping(partition, ping_id)).includes('the_pong_came_back'),
    )
    expect(the_facts(partition)).toEqual(['a_ping_has_been_sent', 'a_pong_has_been_received'])
    await anna.stop()
  })

  test('Bruno’s leaf ping answers pong in one event; the request again, one pong; malformed, invalid', async () => {
    const partition = a_partition()
    const bruno = await a_node({ partition, answering: pong })
    const answered = [{ event: 'pong', payload: {} }]
    expect(await bruno.invoke(a_peer_pings('B-ANNA', 'P1'))).toEqual(answered)
    expect(await bruno.invoke(a_peer_pings('B-ANNA', 'P1'))).toEqual(answered)
    expect(the_pongs(partition)).toMatchObject([{ bond: 'B-ANNA' }])
    expect(the_facts(partition)).toEqual(['a_ping_has_been_answered'])
    expect(await bruno.invoke(a_peer_pings('B-ANNA', 'P2', { words: 'ciao' }))).toEqual([
      { event: 'invalid_request', reason: 'input_not_in_schema' },
    ])
    expect(
      await bruno.invoke({ ...a_peer_pings('B-ANNA', 'P3'), use_case: 'usecase/greet' }),
    ).toEqual([{ event: 'invalid_request', reason: 'not_a_leaf' }])
    expect(the_pongs(partition)).toHaveLength(1)
  })

  test('a ping survives a stop: a new configurator over the same partition delivers it once', async () => {
    const partition = a_partition()
    const before = await a_node({ partition, answering: pong })
    const screen = before.invoke(anna_pings('B-BRUNO', 'op-1'))
    await before.until(() => before.long_waits() > 0)
    await before.stop()
    before.the_time_passes()
    const ping_id = ping_of(await screen)
    expect(before.requests).toEqual([])
    const after = await a_node({ partition, answering: pong })
    await after.start()
    expect(await after.invoke(anna_pings('B-BRUNO', 'op-1'))).toEqual([
      { event: 'the_ping_is_sent', payload: { ping_id } },
      { event: 'pong', payload: { ping_id } },
    ])
    expect(after.requests).toHaveLength(1)
    expect(the_facts(partition)).toEqual(['a_ping_has_been_sent', 'a_pong_has_been_received'])
    await after.stop()
  })

  test('ready carries ping_pong, the package’s version and the boundary’s', async () => {
    const anna = await a_node({ partition: a_partition(), answering: pong })
    expect(anna.sent.filter((message) => message.message === 'ready')).toEqual([
      {
        message: 'ready',
        name: 'ping_pong',
        version: package_json.version,
        boundary_version: boundary.version,
      },
    ])
  })
})
