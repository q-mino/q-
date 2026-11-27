import * as boundary from '@q-mino/boundary'
import { describe, expect, test } from 'vitest'
import package_json from '../package.json' with { type: 'json' }
import {
  a_clock,
  a_node,
  a_partition,
  a_peer_writes,
  anna_writes,
  her_part_follows,
  she_reads,
  the_facts,
  the_message,
  the_messages,
  type Answering,
} from './kernel.ts'

// The stories of messaging through the boundary (README.md, § Stories,
// 1–13; MSG-1..MSG-13; part M2), on a fake kernel that hosts it through the
// boundary's messages: Anna writes to Bruno on their bond; Bruno's node
// receives the message and answers with its receipt; Anna's node records
// what came back, and her chat tells it.

/** Bruno's node answers Anna's request with its receipt. */
const received: Answering = () => ({
  answer: 'responded',
  event: { event: 'received', payload: {} },
})

/** The effect whose deliveries are messaging's requests. */
const deliver_a_message = 'business/chats/effect/deliver_a_message'

/** A record's field, or none. */
const field = (value: unknown, name: string): unknown =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? Reflect.get(value, name)
    : undefined

/** The message the first event of a write names. */
const message_of = (events: readonly unknown[]): string => {
  const [first] = events
  const id = field(field(boundary.an_event.parse(first), 'payload'), 'message_id')
  if (typeof id !== 'string') throw new Error(`no message: ${JSON.stringify(events)}`)
  return id
}

/**
 * The entries a followed read gives now, from its events (D72.5): its
 * snapshot, then each entry as a fact or an entry left it, by identity; the
 * order the snapshot's, each entry new after them.
 */
const now_of = (events: readonly unknown[]): readonly unknown[] => {
  const entries = new Map<unknown, unknown>()
  for (const event of events) {
    const name = field(event, 'event')
    if (name === 'snapshot') {
      entries.clear()
      const snapshot = field(event, 'entries')
      for (const entry of Array.isArray(snapshot) ? snapshot : []) {
        entries.set(field(entry, 'message_id') ?? field(entry, 'bond'), entry)
      }
    }
    if (name === 'fact' || name === 'entered')
      entries.set(field(event, 'identity'), field(event, 'entry'))
    if (name === 'left') entries.delete(field(event, 'identity'))
  }
  return [...entries.values()]
}

/** The texts of a chat, the newest first, as its read gives it now. */
const the_texts = (events: readonly unknown[]): readonly unknown[] =>
  now_of(events)
    .toSorted((a, b) => Number(field(b, 'place')) - Number(field(a, 'place')))
    .map((entry) => field(entry, 'text'))

/** Anna's node, started. */
const annas_node = async (answering: Answering, partition = a_partition()) => {
  const clock = a_clock()
  const anna = await a_node({ partition, answering, clock })
  await anna.start()
  return { partition, anna, clock }
}

/** Anna's chat on a bond, read once: its snapshot's entries. */
const her_chat = async (
  anna: Awaited<ReturnType<typeof a_node>>,
  bond = 'B-BRUNO',
): Promise<readonly unknown[]> => {
  const events = anna.follow(her_part_follows('usecase/a_chat', bond))
  await anna.until(() => events().some((event) => field(event, 'event') === 'snapshot'))
  return now_of(events())
}

describe('the stories of messaging, through the boundary', () => {
  test('written and delivered: the receipt is Bruno’s response', async () => {
    // His receipt comes three seconds after her «Invia»: delivered at the instant her node learned it, not when she wrote it.
    const partition = a_partition()
    const clock = a_clock()
    const anna = await a_node({
      partition,
      answering: (request) => {
        clock.the_clock_reads('2026-11-26T09:00:03.000Z')
        return received(request)
      },
      clock,
    })
    await anna.start()
    const events = await anna.invoke(anna_writes('B-BRUNO', 'Ciao Bruno', 'op-1'))
    const m1 = message_of(events)
    expect(events).toEqual([{ event: 'the_message_is_written', payload: { message_id: m1 } }])
    await anna.until(() => the_facts(partition).includes('a_message_has_been_delivered'))
    expect(anna.requests).toEqual([
      {
        bond: 'B-BRUNO',
        invokes: { persona: 'known', use_case: 'usecase/message', version: '1.0.0' },
        input: { text: 'Ciao Bruno' },
        effect: deliver_a_message,
        id: m1,
        waits: 604_800,
      },
    ])
    expect(the_facts(partition)).toEqual([
      'a_message_has_been_written',
      'a_message_has_been_delivered',
    ])
    expect(await her_chat(anna)).toEqual([
      {
        message_id: m1,
        place: 1,
        text: 'Ciao Bruno',
        at: '2026-11-26T09:00:00.000Z',
        whose: { whose: 'mine', stage: { stage: 'delivered', at: '2026-11-26T09:00:03.000Z' } },
      },
    ])
    await anna.stop()
  })

  test('Bruno’s phone off for eight hours: the message waits on its way, delivered when his app collects it', async () => {
    const partition = a_partition()
    const before = await annas_node(() => new Promise(() => undefined), partition)
    const m1 = message_of(await before.anna.invoke(anna_writes('B-BRUNO', 'Ciao Bruno', 'op-1')))
    await before.anna.until(() => before.anna.requests.length === 1)
    expect(await her_chat(before.anna)).toMatchObject([
      { message_id: m1, whose: { whose: 'mine', stage: { stage: 'on_its_way' } } },
    ])
    // Anna closes her app at 12:00, its request still on its way; she opens it at 20:00.
    await before.anna.stop()
    const clock = a_clock()
    clock.the_clock_reads('2026-11-26T19:00:00.000Z')
    const anna = await a_node({ partition, answering: received, clock })
    await anna.start()
    await anna.until(() => the_facts(partition).includes('a_message_has_been_delivered'))
    expect(anna.requests).toMatchObject([{ id: m1, input: { text: 'Ciao Bruno' } }])
    expect(the_message(partition, 'B-BRUNO', m1)).toMatchObject({
      progress: {
        stage: 'closed',
        what_came_back: 'the_message_was_received',
        at: '2026-11-26T19:00:00.000Z',
      },
    })
    expect(await her_chat(anna)).toMatchObject([
      { whose: { stage: { stage: 'delivered', at: '2026-11-26T19:00:00.000Z' } } },
    ])
    await anna.stop()
  })

  test('no receipt in seven days: the message closed as such, and written again', async () => {
    const clock = a_clock()
    const partition = a_partition()
    let gives_up: (answer: boundary.an_answer_to_a_request) => void = () => undefined
    const anna = await a_node({
      partition,
      clock,
      answering: (request) =>
        request.id === anna.requests[0]?.id
          ? new Promise((answers) => {
              gives_up = answers
            })
          : new Promise(() => undefined),
    })
    await anna.start()
    const m1 = message_of(await anna.invoke(anna_writes('B-BRUNO', 'Ciao Bruno', 'op-1')))
    await anna.until(() => anna.requests.length === 1)
    clock.the_clock_reads('2026-12-03T09:00:00.000Z')
    gives_up({ answer: 'no_response' })
    await anna.until(() => the_facts(partition).includes('a_message_has_had_no_receipt'))
    expect(await her_chat(anna)).toMatchObject([
      { message_id: m1, whose: { stage: { stage: 'no_receipt', at: '2026-12-03T09:00:00.000Z' } } },
    ])
    // «Invia di nuovo»: the same text, a message of its own (MSG-13).
    const m3 = message_of(await anna.invoke(anna_writes('B-BRUNO', 'Ciao Bruno', 'op-2')))
    expect(m3).not.toBe(m1)
    await anna.until(() => anna.requests.length === 2)
    expect(anna.requests[1]).toMatchObject({ id: m3, input: { text: 'Ciao Bruno' } })
    expect(await her_chat(anna)).toMatchObject([
      { message_id: m3, place: 2, whose: { stage: { stage: 'on_its_way' } } },
      { message_id: m1, place: 1, whose: { stage: { stage: 'no_receipt' } } },
    ])
    await anna.stop()
  })

  // Anna's side: whichever of the two silences Carla's node keeps, her kernel's port answers
  // `no_response` at the end of its time (F8); Carla's side, each silence with its case, is
  // proven on the oracle (`memory/test/extensions/messaging.test.ts`, part M7).
  test('Carla without messaging, or not offering it to Anna: no receipt, the same from outside', async () => {
    const { partition, anna } = await annas_node(() => ({ answer: 'no_response' }))
    const m2 = message_of(await anna.invoke(anna_writes('B-CARLA', 'Ciao Carla', 'op-1')))
    await anna.until(() => the_facts(partition).includes('a_message_has_had_no_receipt'))
    expect(await her_chat(anna, 'B-CARLA')).toMatchObject([
      { message_id: m2, whose: { stage: { stage: 'no_receipt' } } },
    ])
    expect(anna.sent.filter((message) => message.message === 'dead_letter')).toEqual([])
    await anna.stop()
  })

  test.each([
    { answer: 'refused', why: 'not_offered_to_the_bond' } as const,
    { answer: 'refused', why: 'not_active' } as const,
  ])(
    'called off by Anna’s own withdrawal or deactivation: closed as called off, no dead letter ($why)',
    async (answer) => {
      const { partition, anna } = await annas_node(() => answer)
      const m2 = message_of(await anna.invoke(anna_writes('B-CARLA', 'Ciao Carla', 'op-1')))
      await anna.until(() => the_facts(partition).includes('a_message_has_been_called_off'))
      expect(await her_chat(anna, 'B-CARLA')).toMatchObject([
        { message_id: m2, whose: { stage: { stage: 'called_off' } } },
      ])
      expect(anna.sent.filter((message) => message.message === 'dead_letter')).toEqual([])
      await anna.stop()
    },
  )

  test.each([
    { event: 'not_found' },
    { event: 'version_not_supported', current: '2.0.0', oldest: 2 },
    { event: 'invalid_request', reason: 'input_not_in_schema' },
    { event: 'not_received', payload: {} },
  ])('the peer cannot receive it: could not be delivered ($event)', async (event) => {
    const { partition, anna } = await annas_node(() => ({ answer: 'responded', event }))
    const m1 = message_of(await anna.invoke(anna_writes('B-BRUNO', 'Ciao Bruno', 'op-1')))
    await anna.until(() => the_facts(partition).includes('a_message_could_not_be_delivered'))
    expect(await her_chat(anna)).toMatchObject([
      { message_id: m1, whose: { stage: { stage: 'could_not_be_delivered' } } },
    ])
    await anna.stop()
  })

  test('Bruno receives M1 with what his node can tell of it', async () => {
    const clock = a_clock()
    clock.the_clock_reads('2026-11-26T17:00:04.000Z')
    const partition = a_partition()
    const bruno = await a_node({ partition, answering: received, clock })
    expect(await bruno.invoke(a_peer_writes('B-ANNA', 'R1', { text: 'Ciao Bruno' }))).toEqual([
      { event: 'received', payload: {} },
    ])
    expect(the_facts(partition)).toEqual(['a_message_has_been_received'])
    // What the office keeps of it: the bond, the text, the declared time, the instant received.
    expect(the_messages(partition, 'B-ANNA')).toMatchObject([
      {
        whose: 'theirs',
        place: 1,
        message: {
          bond: 'B-ANNA',
          text: 'Ciao Bruno',
          declared_at: '2026-11-26T09:00:00.120Z',
          received_at: '2026-11-26T17:00:04.000Z',
        },
      },
    ])
    const [m1] = await her_chat(bruno, 'B-ANNA')
    const [message_id] = the_messages(partition, 'B-ANNA').map((each) =>
      field(field(each, 'message'), 'id'),
    )
    // Signature valid and bond known: the persona `known` itself; the
    // mailbox, the bond's; the declared time, a claim; the time received,
    // his node's. The relay's time is missing (K-5): no field tells it.
    expect(m1).toEqual({
      message_id,
      place: 1,
      text: 'Ciao Bruno',
      at: '2026-11-26T17:00:04.000Z',
      whose: { whose: 'theirs', declared_at: '2026-11-26T09:00:00.120Z' },
    })
    await bruno.stop()
  })

  test('R1 sent again: one message in Bruno’s chat, one receipt', async () => {
    const partition = a_partition()
    const bruno = await a_node({ partition, answering: received })
    const answered = [{ event: 'received', payload: {} }]
    expect(await bruno.invoke(a_peer_writes('B-ANNA', 'R1', { text: 'Ciao Bruno' }))).toEqual(
      answered,
    )
    expect(await bruno.invoke(a_peer_writes('B-ANNA', 'R1', { text: 'Ciao Bruno' }))).toEqual(
      answered,
    )
    expect(the_facts(partition)).toEqual(['a_message_has_been_received'])
    expect(the_messages(partition, 'B-ANNA')).toHaveLength(1)
    expect(await bruno.invoke(a_peer_writes('B-ANNA', 'R2', { text: '' }))).toEqual([
      { event: 'invalid_request', reason: 'input_not_in_schema' },
    ])
    expect(await bruno.invoke(a_peer_writes('B-ANNA', 'R3', { text: 'x'.repeat(4_001) }))).toEqual([
      { event: 'invalid_request', reason: 'input_not_in_schema' },
    ])
    expect(
      await bruno.invoke({
        ...a_peer_writes('B-ANNA', 'R4', { text: 'ciao' }),
        use_case: 'usecase/ping',
      }),
    ).toEqual([{ event: 'invalid_request', reason: 'not_a_leaf' }])
    expect(the_messages(partition, 'B-ANNA')).toHaveLength(1)
    await bruno.stop()
  })

  test('a chat in the order her node recorded it, the declared time beside', async () => {
    const { anna, clock } = await annas_node(() => new Promise(() => undefined))
    await anna.invoke(anna_writes('B-BRUNO', 'dove sei?', 'op-1'))
    clock.the_clock_reads('2026-11-26T09:15:00.000Z')
    await anna.invoke(
      a_peer_writes('B-BRUNO', 'R1', { text: 'arrivo' }, '2026-11-26T08:30:00.000Z'),
    )
    clock.the_clock_reads('2026-11-26T09:16:00.000Z')
    await anna.invoke(
      a_peer_writes('B-BRUNO', 'R2', { text: 'scusa il ritardo' }, '2020-01-01T00:00:00.000Z'),
    )
    const chat = await her_chat(anna)
    expect(chat.map((entry) => field(entry, 'text'))).toEqual([
      'scusa il ritardo',
      'arrivo',
      'dove sei?',
    ])
    expect(chat).toMatchObject([
      {
        place: 3,
        at: '2026-11-26T09:16:00.000Z',
        whose: { declared_at: '2020-01-01T00:00:00.000Z' },
      },
      {
        place: 2,
        at: '2026-11-26T09:15:00.000Z',
        whose: { declared_at: '2026-11-26T08:30:00.000Z' },
      },
      { place: 1, at: '2026-11-26T09:00:00.000Z', whose: { whose: 'mine' } },
    ])
    await anna.stop()
  })

  test('a receipt that does not parse: held, told on the message; put aside; written again', async () => {
    const { partition, anna } = await annas_node((request) =>
      request.bond === 'B-BRUNO'
        ? { answer: 'responded', event: { event: 'pong', payload: {} } }
        : received(request),
    )
    const m1 = message_of(await anna.invoke(anna_writes('B-BRUNO', 'Ciao Bruno', 'op-1')))
    await anna.until(() => anna.sent.some((message) => message.message === 'dead_letter'))
    const letter = `${deliver_a_message}/${m1}`
    expect(anna.sent.filter((message) => message.message === 'dead_letter')).toMatchObject([
      {
        letter,
        cause: {
          cause: 'exhausted',
          reason: 'the peer\'s response is no event of message: {"event":"pong","payload":{}}',
        },
      },
    ])
    // Holding nothing behind it: her message to Carla goes on (`order: 'any'`).
    const to_carla = message_of(await anna.invoke(anna_writes('B-CARLA', 'Ciao Carla', 'op-2')))
    await anna.until(() => the_facts(partition).includes('a_message_has_been_delivered'))
    expect(await her_chat(anna, 'B-CARLA')).toMatchObject([
      { message_id: to_carla, whose: { stage: { stage: 'delivered' } } },
    ])
    expect(await her_chat(anna)).toMatchObject([
      { message_id: m1, whose: { stage: { stage: 'held' } } },
    ])
    // Sent again from «Cosa è successo»: the port gives the same answer, held again.
    await anna.redeliver(letter)
    await anna.until(() => anna.requests.filter((request) => request.id === m1).length === 2)
    await anna.until(
      () => anna.sent.filter((message) => message.message === 'dead_letter').length === 2,
    )
    expect(await her_chat(anna)).toMatchObject([{ whose: { stage: { stage: 'held' } } }])
    // Put aside.
    await anna.discard(letter)
    await anna.until(() => anna.sent.some((message) => message.message === 'released'))
    expect(await her_chat(anna)).toMatchObject([
      { message_id: m1, whose: { stage: { stage: 'put_aside' } } },
    ])
    // «Invia di nuovo»: M4, the same text, a request of its own.
    const m4 = message_of(await anna.invoke(anna_writes('B-BRUNO', 'Ciao Bruno', 'op-3')))
    await anna.until(() => anna.requests.some((request) => request.id === m4))
    expect(m4).not.toBe(m1)
    expect(anna.requests.find((request) => request.id === m4)).toMatchObject({
      bond: 'B-BRUNO',
      input: { text: 'Ciao Bruno' },
    })
    expect(the_message(partition, 'B-BRUNO', m4)).toMatchObject({ place: 2 })
    await anna.stop()
  })

  test('the bond removed while M1 waits: held too', async () => {
    const { anna } = await annas_node(() => ({ answer: 'the_bond_is_gone' }))
    const m1 = message_of(await anna.invoke(anna_writes('B-BRUNO', 'Ciao Bruno', 'op-1')))
    await anna.until(() => anna.sent.some((message) => message.message === 'dead_letter'))
    expect(anna.sent.filter((message) => message.message === 'dead_letter')).toMatchObject([
      { cause: { cause: 'exhausted', reason: 'the bond is gone' } },
    ])
    expect(await her_chat(anna)).toMatchObject([
      { message_id: m1, whose: { stage: { stage: 'held' } } },
    ])
    await anna.stop()
  })

  test('the chat followed: its snapshot, then each change', async () => {
    let bruno_answers: (answer: boundary.an_answer_to_a_request) => void = () => undefined
    const { anna } = await annas_node(
      () =>
        new Promise((answers) => {
          bruno_answers = answers
        }),
    )
    await anna.invoke(anna_writes('B-BRUNO', 'uno', 'op-1'))
    const events = anna.follow(her_part_follows('usecase/a_chat', 'B-BRUNO'))
    await anna.until(() => the_texts(events()).length === 1)
    expect(events()[0]).toMatchObject({ event: 'snapshot', total: 1 })
    const m2 = message_of(await anna.invoke(anna_writes('B-BRUNO', 'due', 'op-2')))
    await anna.until(() => the_texts(events()).length === 2)
    expect(the_texts(events())).toEqual(['due', 'uno'])
    expect(events().at(-1)).toMatchObject({
      event: 'fact',
      identity: m2,
      entry: { text: 'due', whose: { stage: { stage: 'on_its_way' } } },
    })
    await anna.until(() => anna.requests.length === 2)
    bruno_answers({ answer: 'responded', event: { event: 'received', payload: {} } })
    await anna.until(() =>
      now_of(events()).some((entry) => JSON.stringify(field(entry, 'whose')).includes('delivered')),
    )
    await anna.invoke(a_peer_writes('B-BRUNO', 'R1', { text: 'tre' }))
    await anna.until(() => the_texts(events()).length === 3)
    expect(the_texts(events())).toEqual(['tre', 'due', 'uno'])
    expect(events().filter((event) => field(event, 'event') === 'snapshot')).toHaveLength(1)
    await anna.stop()
  })

  test('the row of Bruno’s contact: the last message and two to read; read in the conversation, none', async () => {
    const { anna } = await annas_node(received)
    const row = anna.follow(her_part_follows('usecase/a_chat_at_a_glance', 'B-BRUNO'))
    await anna.until(() => row().some((event) => field(event, 'event') === 'snapshot'))
    expect(now_of(row())).toEqual([])
    await anna.invoke(a_peer_writes('B-BRUNO', 'R1', { text: 'ci sei?' }))
    await anna.invoke(a_peer_writes('B-BRUNO', 'R2', { text: 'stasera cinema' }))
    await anna.until(() => field(now_of(row())[0], 'to_read') === 2)
    expect(now_of(row())).toMatchObject([
      {
        bond: 'B-BRUNO',
        the_last_message: { text: 'stasera cinema', place: 2, whose: { whose: 'theirs' } },
        to_read: 2,
      },
    ])
    const chat = await her_chat(anna)
    const last = field(chat[0], 'message_id')
    if (typeof last !== 'string') throw new Error('no message')
    expect(await anna.invoke(she_reads('B-BRUNO', last, 'op-r1'))).toEqual([
      { event: 'the_chat_is_read', payload: {} },
    ])
    await anna.until(() => field(now_of(row())[0], 'to_read') === 0)
    // Up to the same again, or one before: read again, nothing changes.
    const first = field(chat[1], 'message_id')
    if (typeof first !== 'string') throw new Error('no message')
    expect(await anna.invoke(she_reads('B-BRUNO', first, 'op-r2'))).toEqual([
      { event: 'the_chat_is_read', payload: {} },
    ])
    expect(await anna.invoke(she_reads('B-CARLA', last, 'op-r3'))).toEqual([
      { event: 'the_chat_cannot_be_read', payload: {} },
    ])
    // Her own message after it: the row reads it as the last, none to read.
    await anna.invoke(anna_writes('B-BRUNO', 'sì!', 'op-1'))
    await anna.until(() => field(field(now_of(row())[0], 'the_last_message'), 'text') === 'sì!')
    expect(now_of(row())).toMatchObject([
      { to_read: 0, the_last_message: { whose: { whose: 'mine' } } },
    ])
    await anna.stop()
  })

  test('a new configurator over the same partition reads the chat whole, and delivers what was on its way once', async () => {
    const partition = a_partition()
    const before = await a_node({ partition, answering: received })
    await before.invoke(a_peer_writes('B-BRUNO', 'R1', { text: 'ciao Anna' }))
    const [theirs] = the_messages(partition, 'B-BRUNO')
    const m0 = field(field(theirs, 'message'), 'id')
    if (typeof m0 !== 'string') throw new Error('no message')
    await before.invoke(she_reads('B-BRUNO', m0, 'op-r'))
    const m1 = message_of(await before.invoke(anna_writes('B-BRUNO', 'Ciao Bruno', 'op-1')))
    expect(before.requests).toEqual([])
    await before.stop()
    const after = await a_node({ partition, answering: received })
    const row = after.follow(her_part_follows('usecase/a_chat_at_a_glance', 'B-BRUNO'))
    expect(await her_chat(after)).toMatchObject([
      { message_id: m1, whose: { stage: { stage: 'on_its_way' } } },
      { message_id: m0, whose: { whose: 'theirs' } },
    ])
    await after.until(() => now_of(row()).length === 1)
    expect(now_of(row())).toMatchObject([{ to_read: 0, the_last_message: { message_id: m1 } }])
    await after.start()
    await after.until(() => the_facts(partition).includes('a_message_has_been_delivered'))
    await after.stop()
    // Once: counted after the node stopped, so that no later delivery could hide.
    expect(after.requests).toHaveLength(1)
    expect(the_facts(partition)).toEqual([
      'a_message_has_been_received',
      'a_chat_has_been_read',
      'a_message_has_been_written',
      'a_message_has_been_delivered',
    ])
  })

  test('ready carries messaging, the package’s version and the boundary’s', async () => {
    const anna = await a_node({ partition: a_partition(), answering: received })
    expect(anna.sent.filter((message) => message.message === 'ready')).toEqual([
      {
        message: 'ready',
        name: 'messaging',
        version: package_json.version,
        boundary_version: boundary.version,
      },
    ])
  })
})
