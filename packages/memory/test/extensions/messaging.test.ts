import { TheExtensionIsNotRunningYet, TheRelayIsOutOfReach } from '@q-mino/adapters-common'
import { describe, expect, test } from 'vitest'
import { z } from 'zod'
import { all } from '../post/harness.ts'
import { two_nodes, until, type NodeUnderTest } from './harness.ts'

// Messaging between two nodes, on q-'s oracle (part M3; the stories 14–18 of
// `packages/extensions/messaging/README.md`, each a test named after its
// story; MSG-9, MSG-10, MSG-14, MSG-16, F7, F8, K-1, K-4, K-11, K-12): the
// apps carry messaging in place of greetings, on the node of q-'s oracle
// (`../node/harness.ts`), the harness's Friday 20 November 2026, 10:00
// UTC. Anna writes to Bruno on their bond: her message is a request on the
// bond, his kernel's entry opens it and routes it below his node of
// `known` to messaging's leaf `message`, which records it and answers in
// one event, `received`, the receipt: his response, which her kernel takes
// as the return of her request, and her message reads delivered. Her chat
// is read as her part will read it, through the kernel: `a_chat` followed
// on `self` below the kernel's node (the library's mounted port, the
// hosting, the boundary), its snapshot, then each change, until it is no
// longer followed (K-4).

/** The effect whose deliveries are messaging's requests (MSG-2). */
const deliver_a_message = 'business/chats/effect/deliver_a_message'

/** A message of a chat, as `a_chat` gives it (MSG-7), as far as a story reads it. */
const a_message = z.object({
  message_id: z.string(),
  text: z.string(),
  at: z.string(),
  whose: z.discriminatedUnion('whose', [
    z.object({
      whose: z.literal('mine'),
      stage: z.object({ stage: z.string(), at: z.string().optional() }),
    }),
    z.object({ whose: z.literal('theirs'), declared_at: z.string() }),
  ]),
})
type AMessage = z.output<typeof a_message>

/** A record's field, read where the shape is the boundary's JSON. */
const field = (value: unknown, name: string): unknown =>
  typeof value === 'object' && value !== null ? Reflect.get(value, name) : undefined

/** A chat, as the events of `a_chat` rebuild it: its snapshot, then each entry that came in, changed or left, by its identity (DOM-2). */
const applied = (
  chat: ReadonlyMap<string, AMessage>,
  event: unknown,
): ReadonlyMap<string, AMessage> => {
  switch (field(event, 'event')) {
    case 'snapshot': {
      const entries = z.array(a_message).parse(field(event, 'entries'))
      return new Map(entries.map((each) => [each.message_id, each]))
    }
    case 'fact':
    case 'entered': {
      const entry = a_message.parse(field(event, 'entry'))
      return new Map([...chat, [entry.message_id, entry]])
    }
    case 'left': {
      const left = new Map(chat)
      left.delete(String(field(event, 'identity')))
      return left
    }
    default:
      return chat
  }
}

/**
 * A node follows a chat as its part will (MSG-7): `a_chat` on `self`,
 * through the kernel's mounted port, until what it reads holds; then it
 * stops following, which ends the follow in messaging (K-4). Every event
 * kept, in order.
 */
const follows = (node: NodeUnderTest, bond: string) => {
  const events: unknown[] = []
  let chat: ReadonlyMap<string, AMessage> = new Map()
  const until_it_reads = async (
    holds: (chat: ReadonlyMap<string, AMessage>) => boolean,
  ): Promise<ReadonlyMap<string, AMessage>> => {
    for await (const event of node.on_self()(node.as_the_user('1.0.0'), {
      leaf: 'usecase/a_chat',
      input: { bond },
    })) {
      events.push(event)
      chat = applied(chat, event)
      if (holds(chat)) return chat
    }
    throw new Error(`the follow of ${bond}'s chat ended before it read what it waited for`)
  }
  return { events, until_it_reads }
}

/** A chat as it reads now: its snapshot, the follow ended at once. */
const the_chat = async (
  node: NodeUnderTest,
  bond: string,
): Promise<ReadonlyMap<string, AMessage>> => follows(node, bond).until_it_reads(() => true)

/** Where a message of mine stands in a chat, as the chat reads now. */
const the_stage_of = async (node: NodeUnderTest, bond: string, message_id: string) => {
  const whose = (await the_chat(node, bond)).get(message_id)?.whose
  return whose?.whose === 'mine' ? whose.stage : undefined
}

/**
 * A node writes in its chat with a bond and taps «Invia» (MSG-2): messaging's
 * leaf on `self`, through its mounted port; the message its event names.
 * Then its post deposits the request, the message (F4, F7).
 */
const writes = async (
  node: NodeUnderTest,
  bond: string,
  text: string,
  requests = 1,
): Promise<string> => {
  const events = await all(
    node.on_self()(node.as_the_user('1.0.0'), {
      leaf: 'usecase/write_a_message',
      input: { bond, text },
    }),
  )
  const message_id = field(field(events[0], 'payload'), 'message_id')
  if (typeof message_id !== 'string') throw new Error(`no message: ${JSON.stringify(events)}`)
  await until(async () => (await node.sent()).length >= requests, 'the request sent')
  await node.post.runs()
  return message_id
}

/** Waits until a message of mine stands at a stage. */
const until_it_stands = async (
  node: NodeUnderTest,
  bond: string,
  message_id: string,
  stage: string,
): Promise<void> => {
  await until(
    async () => (await the_stage_of(node, bond, message_id))?.stage === stage,
    `${message_id} ${stage}`,
  )
}

/** The messages a node received in a chat, as its chat reads them: their texts. */
const theirs = async (node: NodeUnderTest, bond: string): Promise<readonly string[]> =>
  [...(await the_chat(node, bond)).values()]
    .filter((message) => message.whose.whose === 'theirs')
    .map((message) => message.text)

/** The facts messaging recorded in a node's partition, in order, by name. */
const facts_of_messaging = (node: NodeUnderTest): readonly string[] =>
  [...node.storage.kept('messaging')]
    .filter(([at]) => at.startsWith('fact/'))
    .toSorted(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .flatMap(([, value]) => {
      const parts = field(value, 'parts')
      return Array.isArray(parts)
        ? parts.map((part) => String(field(part, 'path')).split('/').at(-1) ?? '')
        : []
    })

describe('messaging between two nodes, on q-’s oracle (part M3)', () => {
  test('messaging preinstalled and off: Bruno’s message meets silence until Anna activates it', async () => {
    const story = await two_nodes({ carries: 'messaging', anna: 'installed' })
    const { anna, bruno } = story
    const m1 = await writes(bruno, 'B-ANNA', 'Ciao Anna')
    await anna.the_entry()
    expect(new Set(anna.whys())).toEqual(new Set(['the_extension_is_not_active']))
    expect(anna.post.carried()).toEqual([])
    expect(anna.the_hosted().life()).toEqual({ life: 'unloaded' })
    expect(await the_stage_of(bruno, 'B-ANNA', m1)).toEqual({ stage: 'on_its_way' })
    // What she accepts, as she is shown it (EXT-7, MSG-10): its leaf on known faces, the time
    // they declare, requests on her bonds, a storage of its own, its slot on a bond's screen.
    expect(anna.shown()).toMatchObject({
      name: 'messaging',
      sees: { known: ['the_declared_time'] },
      touches: ['the_port_of_requests', 'its_storage'],
    })
    expect(await anna.activates()).toEqual({ loaded: 'running' })
    // Activated, her next pass reaches messaging: Bruno's next message is received.
    const m2 = await writes(bruno, 'B-ANNA', 'Ci sei?', 2)
    await anna.the_entry()
    await bruno.the_entry()
    await until_it_stands(bruno, 'B-ANNA', m2, 'delivered')
    expect(await theirs(anna, 'B-BRUNO')).toContain('Ci sei?')
  })

  test('Bruno’s message, silenced while Anna’s messaging was off, is received once she activates it', async () => {
    const story = await two_nodes({ carries: 'messaging', anna: 'installed' })
    const { anna, bruno, at } = story
    const m1 = await writes(bruno, 'B-ANNA', 'Ciao Anna')
    await anna.the_entry()
    expect(anna.whys()).toEqual(['the_extension_is_not_active'])
    // At 12:00 she activates messaging: her collector forgets what it saw (MSG-16, K-12), and
    // its next pass hands again what the relay keeps, R1 included.
    at('12:00:00')
    expect(await anna.activates()).toEqual({ loaded: 'running' })
    await anna.the_entry()
    expect(await theirs(anna, 'B-BRUNO')).toEqual(['Ciao Anna'])
    await bruno.the_entry()
    await until_it_stands(bruno, 'B-ANNA', m1, 'delivered')
    // Delivered at 12:00, the instant his node learned it, not at his next sending (42 hours on).
    expect(await the_stage_of(bruno, 'B-ANNA', m1)).toEqual({
      stage: 'delivered',
      at: '2026-11-20T12:00:00.000Z',
    })
    expect(await bruno.sent()).toHaveLength(1)
    expect(facts_of_messaging(anna)).toEqual(['a_message_has_been_received'])
  })

  test('Anna writes, Bruno’s node stopped; started, it collects and answers; Anna’s message delivered', async () => {
    const story = await two_nodes({ carries: 'messaging' })
    const { anna, bruno, at } = story
    // Bruno's phone off from 10:00 to 18:00: messaging stopped, his collector not passing.
    await bruno.closes()
    const m1 = await writes(anna, 'B-BRUNO', 'Ciao Bruno')
    // Anna's part follows the chat through the kernel (G-1, K-4): its snapshot, M1 on its way.
    const her_chat = follows(anna, 'B-BRUNO')
    const delivered = her_chat.until_it_reads((chat) => {
      const whose = chat.get(m1)?.whose
      return whose?.whose === 'mine' && whose.stage.stage === 'delivered'
    })
    await until(() => her_chat.events.length > 0, 'the chat’s snapshot')
    expect(her_chat.events[0]).toMatchObject({
      event: 'snapshot',
      entries: [{ message_id: m1, text: 'Ciao Bruno', whose: { stage: { stage: 'on_its_way' } } }],
    })
    at('18:00:00')
    expect(await bruno.starts()).toEqual({ loaded: 'running' })
    await bruno.the_entry()
    expect(await theirs(bruno, 'B-ANNA')).toEqual(['Ciao Bruno'])
    at('20:00:00')
    await anna.the_entry()
    // The change came to her part as it followed: M1 delivered at 20:00, her node's instant.
    expect((await delivered).get(m1)?.whose).toEqual({
      whose: 'mine',
      stage: { stage: 'delivered', at: '2026-11-20T20:00:00.000Z' },
    })
    expect(her_chat.events.slice(1)).toContainEqual(
      expect.objectContaining({ event: 'fact', identity: m1 }),
    )
    // Her part no longer follows: the kernel ended the follow in messaging (K-4), nothing traced.
    await until(
      () => anna.to_the_extension.some((message) => message.message === 'end'),
      'the follow ended',
    )
    expect(anna.traced).toEqual([])
    expect(facts_of_messaging(anna)).toEqual([
      'a_message_has_been_written',
      'a_message_has_been_delivered',
    ])
    expect(facts_of_messaging(bruno)).toEqual(['a_message_has_been_received'])
  })

  test('a request collected while messaging loads waits for it: received at the next pass, not at the next sending', async () => {
    const story = await two_nodes({ carries: 'messaging' })
    const { anna, bruno, at } = story
    await bruno.closes()
    const m1 = await writes(anna, 'B-BRUNO', 'Ciao Bruno')
    // Bruno's node starts at 18:00, messaging loading (its storage slow to answer), and its
    // first collect takes R1 before messaging runs: held (MSG-9, K-1), left unseen.
    at('18:00:00')
    const its_storage_answers = bruno.its_reads_wait()
    const loading = bruno.starts()
    await until(() => bruno.the_hosted().life().life === 'loading', 'messaging loading')
    await expect(bruno.the_entry()).rejects.toThrow(TheExtensionIsNotRunningYet)
    expect(bruno.whys()).toEqual([])
    its_storage_answers()
    expect(await loading).toEqual({ loaded: 'running' })
    // His collector's next pass, five seconds on.
    at('18:00:05')
    await bruno.the_entry()
    expect(await theirs(bruno, 'B-ANNA')).toEqual(['Ciao Bruno'])
    await anna.the_entry()
    await until_it_stands(anna, 'B-BRUNO', m1, 'delivered')
    expect(await anna.sent()).toHaveLength(1)
  })

  test('Bruno’s receipt not deposited, the relay unreachable: handed again at the next pass, delivered', async () => {
    const { anna, bruno } = await two_nodes({ carries: 'messaging' })
    const m1 = await writes(anna, 'B-BRUNO', 'Ciao Bruno')
    bruno.post.will('lost')
    // His receipt finds the relay out of reach: R1 left unseen (MSG-14, K-11), nothing traced.
    await expect(bruno.the_entry()).rejects.toThrow(TheRelayIsOutOfReach)
    expect(bruno.traced).toEqual([])
    await anna.the_entry()
    expect(await the_stage_of(anna, 'B-BRUNO', m1)).toEqual({ stage: 'on_its_way' })
    // His next pass: the duplicate branch gives `received` again, deposited; one message.
    await bruno.the_entry()
    await anna.the_entry()
    await until_it_stands(anna, 'B-BRUNO', m1, 'delivered')
    expect(bruno.post.carried().map((deposit) => deposit.fault)).toEqual(['lost', 'none'])
    expect(await theirs(bruno, 'B-ANNA')).toEqual(['Ciao Bruno'])
    expect(facts_of_messaging(bruno)).toEqual(['a_message_has_been_received'])
    expect(await anna.sent()).toHaveLength(1)
    // R1 reached his leaf twice, under one operation: the request's identity (F7, DOM-11).
    const operations = bruno.to_the_extension.flatMap((message) =>
      message.message === 'invoke' && message.persona === 'known' ? [message.operation] : [],
    )
    expect(operations).toEqual([
      { id: anna.the_request_of(m1, deliver_a_message), scope: 'known/B-ANNA' },
      { id: anna.the_request_of(m1, deliver_a_message), scope: 'known/B-ANNA' },
    ])
  })
})
