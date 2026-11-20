import * as boundary from '@q-mino/boundary'
import { describe, expect, test } from 'vitest'
import package_json from '../package.json' with { type: 'json' }
import {
  a_node,
  a_partition,
  a_peer_greets,
  anna_greets,
  the_greeting,
  type Answering,
} from './kernel.ts'

// The stories of the test extension (README.md, part 12.4), on a fake
// kernel that hosts it through the boundary's messages: Anna greets her
// bond with Bruno; Bruno's node answers with a greeting back; Anna's node
// records what came back, or that nothing came within its time.

/** Bruno's node answers Anna's request with his greeting back. */
const greeted_back: Answering = () => ({
  answer: 'responded',
  event: { event: 'greeted_back', payload: { words: 'ciao anche a te' } },
})

/** Anna greets on a bond, and her node runs until the request has been answered and its return recorded. */
const anna_greets_and_waits = async (answering: Answering, bond = 'B-BRUNO') => {
  const partition = a_partition()
  const anna = await a_node({ partition, answering })
  const events = await anna.invoke(anna_greets(bond, 'op-1'))
  await anna.start()
  return { partition, anna, events }
}

/** The greeting the events of Anna's leaf name. */
const greeting_of = (events: readonly unknown[]): string => {
  const [first] = events
  const parsed = boundary.an_event.parse(first)
  const payload = parsed['payload']
  const id: unknown =
    typeof payload === 'object' && payload !== null && !Array.isArray(payload)
      ? Reflect.get(payload, 'greeting_id')
      : undefined
  if (typeof id !== 'string') throw new Error('no greeting')
  return id
}

describe('the stories of greetings', () => {
  test('a greeting and its greeting back recorded', async () => {
    const { partition, anna, events } = await anna_greets_and_waits(greeted_back)
    const greeting_id = greeting_of(events)
    expect(events).toEqual([{ event: 'the_greeting_is_sent', payload: { greeting_id } }])
    await anna.until(() => anna.requests.length === 1)
    expect(anna.requests).toEqual([
      {
        bond: 'B-BRUNO',
        invokes: { persona: 'known', use_case: 'usecase/greet', version: '1.0.0' },
        input: { words: 'ciao' },
        effect: 'business/greetings/effect/ask_for_a_greeting_back',
        id: greeting_id,
        waits: 60,
      },
    ])
    await anna.until(() =>
      JSON.stringify(the_greeting(partition, greeting_id)).includes('the_greeting_came_back'),
    )
    expect(the_greeting(partition, greeting_id)).toEqual({
      id: greeting_id,
      bond: 'B-BRUNO',
      words: 'ciao',
      progress: {
        stage: 'closed',
        outcome: { outcome: 'the_greeting_came_back', words: 'ciao anche a te' },
      },
    })
    await anna.stop()
  })

  test('no response within its time', async () => {
    const { partition, anna, events } = await anna_greets_and_waits(() => ({
      answer: 'no_response',
    }))
    const greeting_id = greeting_of(events)
    await anna.until(() => JSON.stringify(the_greeting(partition, greeting_id)).includes('closed'))
    expect(the_greeting(partition, greeting_id)).toMatchObject({
      progress: { stage: 'closed', outcome: { outcome: 'the_greeting_had_no_response' } },
    })
    await anna.stop()
  })

  test.each([
    { event: 'not_found' },
    { event: 'version_not_supported', current: '2.0.0', oldest: 2 },
    { event: 'invalid_request', reason: 'input_not_in_schema' },
    { event: 'not_greeted_back', payload: {} },
  ])('the peer cannot answer: $event', async (event) => {
    const { partition, anna, events } = await anna_greets_and_waits(() => ({
      answer: 'responded',
      event,
    }))
    const greeting_id = greeting_of(events)
    await anna.until(() => JSON.stringify(the_greeting(partition, greeting_id)).includes('closed'))
    expect(the_greeting(partition, greeting_id)).toMatchObject({
      progress: { stage: 'closed', outcome: { outcome: 'the_peer_cannot_answer' } },
    })
    await anna.stop()
  })

  test.each([
    {
      answer: { answer: 'refused', why: 'not_offered_to_the_bond' } as const,
      reason: 'the port of requests refused it: not_offered_to_the_bond',
    },
    { answer: { answer: 'the_bond_is_gone' } as const, reason: 'the bond is gone' },
  ])('$reason: a dead letter, shown', async ({ answer, reason }) => {
    const { partition, anna, events } = await anna_greets_and_waits(() => answer)
    const greeting_id = greeting_of(events)
    await anna.until(() => anna.sent.some((message) => message.message === 'dead_letter'))
    const dead = anna.sent.filter((message) => message.message === 'dead_letter')
    expect(dead).toHaveLength(1)
    expect(dead).toMatchObject([
      {
        message: 'dead_letter',
        letter: `business/greetings/effect/ask_for_a_greeting_back/${greeting_id}`,
        of: 'an_effect',
        path: 'business/greetings/effect/ask_for_a_greeting_back',
        entry: { id: greeting_id },
        cause: { cause: 'exhausted', reason },
      },
    ])
    expect(the_greeting(partition, greeting_id)).toMatchObject({ progress: { stage: 'waiting' } })
    await anna.stop()
  })

  test('a response that does not parse is a dead letter, and the effect goes on toward another bond', async () => {
    const partition = a_partition()
    const anna = await a_node({
      partition,
      answering: (request) =>
        request.bond === 'B-BRUNO'
          ? { answer: 'responded', event: { event: 'pong', payload: {} } }
          : greeted_back(request),
    })
    const to_bruno = greeting_of(await anna.invoke(anna_greets('B-BRUNO', 'op-1')))
    const to_carla = greeting_of(await anna.invoke(anna_greets('B-CARLA', 'op-2')))
    await anna.start()
    await anna.until(() => JSON.stringify(the_greeting(partition, to_carla)).includes('closed'))
    await anna.until(() => anna.sent.some((message) => message.message === 'dead_letter'))
    expect(anna.sent.filter((message) => message.message === 'dead_letter')).toMatchObject([
      {
        letter: `business/greetings/effect/ask_for_a_greeting_back/${to_bruno}`,
        cause: {
          cause: 'exhausted',
          reason: 'the peer\'s response is no event of greet: {"event":"pong","payload":{}}',
        },
      },
    ])
    expect(the_greeting(partition, to_carla)).toMatchObject({
      progress: { stage: 'closed', outcome: { outcome: 'the_greeting_came_back' } },
    })
    await anna.stop()
  })

  test('the user redelivers a dead letter: delivered, let go', async () => {
    const partition = a_partition()
    let answering: Answering = () => ({ answer: 'the_bond_is_gone' })
    const anna = await a_node({ partition, answering: (request) => answering(request) })
    const greeting_id = greeting_of(await anna.invoke(anna_greets('B-BRUNO', 'op-1')))
    await anna.start()
    await anna.until(() => anna.sent.some((message) => message.message === 'dead_letter'))
    answering = greeted_back
    const letter = `business/greetings/effect/ask_for_a_greeting_back/${greeting_id}`
    await anna.redeliver(letter)
    await anna.until(() => anna.sent.some((message) => message.message === 'released'))
    expect(anna.sent.filter((message) => message.message === 'released')).toEqual([
      { message: 'released', letter },
    ])
    expect(the_greeting(partition, greeting_id)).toMatchObject({
      progress: { stage: 'closed', outcome: { outcome: 'the_greeting_came_back' } },
    })
    await anna.stop()
  })

  test('Bruno’s leaf greet answers greeted_back in one event; the request again, the same; malformed, invalid', async () => {
    const partition = a_partition()
    const bruno = await a_node({ partition, answering: greeted_back })
    const greeted = [{ event: 'greeted_back', payload: { words: 'ciao anche a te' } }]
    expect(await bruno.invoke(a_peer_greets('B-ANNA', 'P1'))).toEqual(greeted)
    expect(await bruno.invoke(a_peer_greets('B-ANNA', 'P1'))).toEqual(greeted)
    const kept = [...partition.kept].filter(([key]) => key.startsWith('state/greeting_back/'))
    expect(kept).toHaveLength(1)
    expect(kept.map(([, value]) => value)).toMatchObject([
      {
        bond: 'B-ANNA',
        their_words: 'ciao',
        words: 'ciao anche a te',
      },
    ])
    expect(await bruno.invoke(a_peer_greets('B-ANNA', 'P2', { words: '' }))).toEqual([
      { event: 'invalid_request', reason: 'input_not_in_schema' },
    ])
    expect(
      await bruno.invoke({ ...a_peer_greets('B-ANNA', 'P3'), use_case: 'usecase/ping' }),
    ).toEqual([{ event: 'invalid_request', reason: 'not_a_leaf' }])
  })

  test('the state survives a stop and a new configurator over the same partition', async () => {
    const partition = a_partition()
    const before = await a_node({ partition, answering: greeted_back })
    const greeting_id = greeting_of(await before.invoke(anna_greets('B-BRUNO', 'op-1')))
    await before.stop()
    expect(before.requests).toEqual([])
    const after = await a_node({ partition, answering: greeted_back })
    expect(await after.invoke(anna_greets('B-BRUNO', 'op-1'))).toEqual([
      { event: 'the_greeting_is_sent', payload: { greeting_id } },
    ])
    await after.start()
    await after.until(() => JSON.stringify(the_greeting(partition, greeting_id)).includes('closed'))
    expect(after.requests).toHaveLength(1)
    await after.stop()
  })

  test('a commit is all or none: a full partition keeps nothing of the greeting', async () => {
    const partition = a_partition()
    const anna = await a_node({ partition, answering: greeted_back })
    const kept = new Map(partition.kept)
    partition.fill(true)
    await anna.invoke(anna_greets('B-BRUNO', 'op-1'))
    expect(anna.sent.filter((message) => message.message === 'fallen')).toEqual([
      { message: 'fallen', why: 'its storage refused a commit: the_partition_is_full' },
    ])
    expect(partition.kept).toEqual(kept)
  })

  test('ready carries the manifest’s name, the package’s version and the boundary’s', async () => {
    const anna = await a_node({ partition: a_partition(), answering: greeted_back })
    expect(anna.sent.filter((message) => message.message === 'ready')).toEqual([
      {
        message: 'ready',
        name: 'greetings',
        version: package_json.version,
        boundary_version: boundary.version,
      },
    ])
  })
})
