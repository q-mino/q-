import { TheRelayIsOutOfReach } from '@q-mino/adapters-common'
import { describe, expect, test } from 'vitest'
import { two_nodes, until, type NodeUnderTest } from './harness.ts'

// The checks of step 14 (plan.md, step 14, "Checks"; PNG-1..PNG-6, F7, F8,
// DOM-11, DOM-14; part 14.2), and the stories 10–14 and 16 of ping pong's README,
// each a test named after its story: on q-'s oracle with two nodes (three
// phones, `harness.ts` over the node of `../node/harness.ts`), the apps
// carrying ping pong in place of greetings. Anna pings Bruno: his kernel's
// entry opens her letter, routes it below his node of `known` to ping
// pong's leaf `ping`, and answers with its event, the pong, which her
// kernel takes as the return of her request.

/** The pong, as Bruno's leaf answers it. */
const the_pong = { event: 'pong', payload: {} }

/** How a ping stands, as ping pong keeps it. */
const closed_with = (what_came_back: string) => ({
  progress: { stage: 'closed', what_came_back },
})

/** A node pings a bond, and its post deposits the request: the ping. */
const pings = async (asker: NodeUnderTest, bond: string, requests = 1): Promise<string> => {
  const ping = await asker.pings(bond)
  await until(async () => (await asker.sent()).length >= requests, 'the request sent')
  await asker.post.runs()
  return ping
}

/** The quarters of a ping's 60 seconds at which the asker's post sends again, and its end (PST-6). */
const the_quarters = ['10:00:15', '10:00:30', '10:00:45', '10:01:00'] as const

/** The asker's post, at each quarter, sends again; the servers that are on read their mailboxes each time; the asker reads its own at the end. */
const to_the_end_of_its_time = async (
  story: Awaited<ReturnType<typeof two_nodes>>,
  asker: NodeUnderTest,
  servers: readonly NodeUnderTest[],
): Promise<void> => {
  for (const quarter of the_quarters) {
    await story.runs_at(asker, quarter)
    for (const server of servers) await server.the_entry()
  }
  await asker.the_entry()
}

describe('ping pong between two nodes, on q-’s oracle (step 14)', () => {
  test('ping pong preinstalled and off: Bruno’s ping meets silence until Anna activates it', async () => {
    const story = await two_nodes({ carries: 'ping_pong', anna: 'installed' })
    const { anna, bruno } = story
    const first = await pings(bruno, 'B-ANNA')
    await anna.the_entry()
    await to_the_end_of_its_time(story, bruno, [anna])
    await until(() => bruno.the_ping_is_closed(first), 'the first ping closed')
    expect(bruno.the_ping(first)).toMatchObject(closed_with('the_ping_had_no_response'))
    expect(new Set(anna.whys())).toEqual(new Set(['the_extension_is_not_active']))
    expect(anna.post.carried()).toEqual([])
    expect(anna.pongs()).toEqual([])
    // Anna activates it, accepting the manifest as shown; Bruno's next ping gets its pong.
    expect(await anna.activates()).toEqual({ loaded: 'running' })
    const second = await pings(bruno, 'B-ANNA', 2)
    await anna.the_entry()
    await bruno.the_entry()
    await until(() => bruno.the_ping_is_closed(second), 'the second ping closed')
    expect(bruno.the_ping(second)).toMatchObject(closed_with('the_pong_came_back'))
    expect(anna.pongs()).toMatchObject([{ bond: 'B-BRUNO' }])
  })

  test('a ping between two nodes with ping pong active gives its pong', async () => {
    const { anna, bruno } = await two_nodes({ carries: 'ping_pong' })
    const ping = await pings(anna, 'B-BRUNO')
    await bruno.the_entry()
    await anna.the_entry()
    await until(() => anna.the_ping_is_closed(ping), 'the ping closed')
    expect(anna.the_ping(ping)).toMatchObject({
      id: ping,
      bond: 'B-BRUNO',
      waits: 60,
      ...closed_with('the_pong_came_back'),
    })
    expect(anna.facts_of_ping_pong()).toEqual(['a_ping_has_been_sent', 'a_pong_has_been_received'])
    expect(bruno.facts_of_ping_pong()).toEqual(['a_ping_has_been_answered'])
    expect(bruno.pongs()).toMatchObject([{ bond: 'B-ANNA' }])
    // Through Bruno's kernel's entry, below his node of `known`: the bond, the request's identity, no key.
    const invoked = bruno.to_the_extension.find(
      (message) => message.message === 'invoke' && message.persona === 'known',
    )
    expect(invoked).toMatchObject({
      use_case: 'usecase/ping',
      context: { bond: 'B-ANNA' },
      operation: { id: anna.the_request_of(ping), scope: 'known/B-ANNA' },
      input: {},
    })
    expect(JSON.stringify(invoked)).not.toContain(anna.post.key)
    // The pong is the return of her request, the answer her post keeps.
    expect(await anna.post.the_answer_to(anna.the_request_of(ping))).toEqual([
      { id: anna.the_request_of(ping), answer: { status: 'answered', event: the_pong } },
    ])
    expect(anna.traced).toEqual([])
    expect(bruno.traced).toEqual([])
  })

  test('to a node without ping pong, or not offering it to that bond, no response: the same from outside', async () => {
    const story = await two_nodes({ carries: 'ping_pong', carla: 'not_installed' })
    const { anna, bruno, carla } = story
    await bruno.withdraws_the_offer_from('B-ANNA')
    const to_bruno = await pings(anna, 'B-BRUNO')
    const to_carla = await pings(anna, 'B-CARLA', 2)
    await to_the_end_of_its_time(story, anna, [bruno, carla])
    await until(
      () => anna.the_ping_is_closed(to_bruno) && anna.the_ping_is_closed(to_carla),
      'both pings closed',
    )
    expect(anna.the_ping(to_bruno)).toMatchObject(closed_with('the_ping_had_no_response'))
    expect(anna.the_ping(to_carla)).toMatchObject(closed_with('the_ping_had_no_response'))
    // The two alike from outside: the same answer kept, nothing collected, nothing traced.
    const [bruno_s] = await anna.post.the_answer_to(anna.the_request_of(to_bruno))
    const [carla_s] = await anna.post.the_answer_to(anna.the_request_of(to_carla))
    expect(bruno_s?.answer).toEqual({ status: 'no_response' })
    expect(carla_s?.answer).toEqual(bruno_s?.answer)
    expect(await anna.post.collects()).toEqual([])
    expect(anna.traced).toEqual([])
    // Each silence in its node's kernel's trace, with its case; no letter back.
    expect(new Set(bruno.whys())).toEqual(new Set(['the_extension_is_not_offered_to_the_bond']))
    expect(new Set(carla.whys())).toEqual(new Set(['the_extension_is_not_installed']))
    expect(bruno.post.carried()).toEqual([])
    expect(carla.post.carried()).toEqual([])
    expect(bruno.pongs()).toEqual([])
    // Bruno's own ping to Anna, after his withdrawal: refused by his port of requests, nothing sent,
    // called off, his own gesture, no dead letter (EXT-12; A, 21 Nov 2026).
    const his = await bruno.pings('B-ANNA')
    await until(() => bruno.the_ping_is_closed(his), 'his ping closed')
    expect(bruno.the_ping(his)).toMatchObject(closed_with('the_ping_was_called_off'))
    expect(bruno.dead_letters()).toEqual([])
    expect(await bruno.sent()).toEqual([])
    expect(bruno.post.carried()).toEqual([])
  })

  test('a ping redelivered gives one pong', async () => {
    const { anna, bruno } = await two_nodes({ carries: 'ping_pong' })
    const ping = await pings(anna, 'B-BRUNO')
    bruno.post.will('lost')
    // His pong lost, the relay out of reach: P1 left unseen, handed again at his next pass (MSG-14).
    await expect(bruno.the_entry()).rejects.toThrow(TheRelayIsOutOfReach)
    await anna.the_entry()
    expect(anna.the_ping_is_closed(ping)).toBe(false)
    expect(bruno.pongs()).toHaveLength(1)
    // Bruno's duplicate branch gives the recorded fact, before Anna's post sends P1 again (10:00:15).
    await bruno.the_entry()
    await anna.the_entry()
    await until(() => anna.the_ping_is_closed(ping), 'the ping closed')
    expect(anna.the_ping(ping)).toMatchObject(closed_with('the_pong_came_back'))
    expect(bruno.post.carried().map((deposit) => deposit.fault)).toEqual(['lost', 'none'])
    expect(bruno.pongs()).toHaveLength(1)
    expect(bruno.facts_of_ping_pong()).toEqual(['a_ping_has_been_answered'])
    expect(anna.facts_of_ping_pong()).toEqual(['a_ping_has_been_sent', 'a_pong_has_been_received'])
    expect(await anna.sent()).toHaveLength(1)
    const invocations = bruno.to_the_extension.flatMap((message) =>
      message.message === 'invoke' && message.persona === 'known' ? [message.operation] : [],
    )
    expect(invocations).toHaveLength(2)
    expect(new Set(invocations.map((operation) => JSON.stringify(operation)))).toEqual(
      new Set([JSON.stringify({ id: anna.the_request_of(ping), scope: 'known/B-ANNA' })]),
    )
  })

  test('Anna pings Bruno (P1, his phone off) and Carla (P2): P1 no response, P2 its pong, none behind the other', async () => {
    const { anna, carla, at } = await two_nodes({ carries: 'ping_pong' })
    const p1 = await anna.pings('B-BRUNO')
    const p2 = await anna.pings('B-CARLA')
    await until(async () => (await anna.sent()).length === 2, 'both requests sent')
    await anna.post.runs()
    await carla.the_entry()
    await anna.the_entry()
    // P2's pong received while P1 waits.
    await until(() => anna.the_ping_is_closed(p2), 'P2 closed')
    expect(anna.the_ping_is_closed(p1)).toBe(false)
    // Anna's phone closed, and started again at P1's time.
    await anna.closes()
    at('10:01:00')
    expect(await anna.starts()).toEqual({ loaded: 'running' })
    await anna.post.runs()
    await until(() => anna.the_ping_is_closed(p1), 'P1 closed')
    expect(anna.the_ping(p1)).toMatchObject(closed_with('the_ping_had_no_response'))
    expect(anna.the_ping(p2)).toMatchObject(closed_with('the_pong_came_back'))
    expect(anna.facts_of_ping_pong()).toEqual([
      'a_ping_has_been_sent',
      'a_ping_has_been_sent',
      'a_pong_has_been_received',
      'a_ping_has_had_no_response',
    ])
    expect(anna.dead_letters()).toEqual([])
    // P2 delivered again after the start reads Carla's pong from the port's kept answer: never sent again.
    const answers_of_the_port = anna.to_the_extension.filter(
      (message) => message.message === 'answer' && message.port === 'the_port_of_requests',
    )
    expect(answers_of_the_port).toHaveLength(3)
    expect(await anna.sent()).toHaveLength(2)
    expect(carla.pongs()).toHaveLength(1)
  })

  test('a ping in flight is called off at a withdrawal, and at a deactivation: sent again no more, closed as called off, no dead letter', async () => {
    const story = await two_nodes({ carries: 'ping_pong' })
    const { anna } = story
    const life = () => anna.the_hosted().life().life
    const the_answer_of = async (ping: string) =>
      (await anna.post.the_answer_to(anna.the_request_of(ping)))[0]?.answer
    const following = anna.the_extensions_follow_the_office()
    // Bruno's phone off: nobody reads Anna's requests. She withdraws ping pong from their bond while P1 waits.
    const first = await pings(anna, 'B-BRUNO')
    await anna.withdraws_the_offer_from('B-BRUNO')
    await until(() => anna.the_ping_is_closed(first), 'the first ping called off')
    expect(anna.the_ping(first)).toMatchObject(closed_with('the_ping_was_called_off'))
    expect(await the_answer_of(first)).toEqual({
      status: 'called_off',
      why: 'not_offered_to_the_bond',
    })
    // Offered again: P2; she deactivates ping pong while it waits, the kernel unloads it.
    await anna.offers_again_to('B-BRUNO')
    const second = await pings(anna, 'B-BRUNO', 2)
    await anna.the_user('usecase/deactivate_an_extension', { extension: 'ping_pong' })
    await until(() => life() === 'unloaded', 'ping pong unloaded')
    await until(
      async () => (await the_answer_of(second))?.status === 'called_off',
      'the second request called off',
    )
    expect(await the_answer_of(second)).toEqual({ status: 'called_off', why: 'not_active' })
    // Its sendings again send nothing.
    const carried = anna.post.carried().length
    await to_the_end_of_its_time(story, anna, [])
    expect(anna.post.carried()).toHaveLength(carried)
    // Active again: its delivery meets the refusal kept, and the ping closes as called off.
    await anna.the_user('usecase/activate_an_extension', { manifest: anna.shown() })
    await until(() => anna.the_ping_is_closed(second), 'the second ping closed')
    expect(anna.the_ping(second)).toMatchObject(closed_with('the_ping_was_called_off'))
    expect(anna.dead_letters()).toEqual([])
    await following.stop()
  })
})
