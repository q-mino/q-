// Her node as the screens see it, over a phone of the stack (WEB-19, WEB-21;
// part 22.1): `her_node_over` wired as the phone's composition root will
// wire it (step 25), over Anna's phone of the `memory` stack, ping pong
// preinstalled and not active, her app open; Bruno's phone of the node's
// harness for a bond made at a distance, her ticket travelling in its link
// (WEB-1). Friday 20 November 2026, 10:00 UTC. Real timers; every wait
// bounded (`until`, about two seconds).
//
// The memory phone keeps its news (traces, notices, letters held) in lists
// and tells no write: the news' teller here tells nothing, and a change is
// told by the node's fact log alone.

import {
  the_manifest_to_accept,
  the_reads_of_self,
  through_a_frames_fence,
  type TheKernelsTraced,
} from '@q-mino/adapters-common'
import {
  her_node_over,
  the_ticket_in_a_link,
  type HerNode,
  the_device_s_network,
  type TheRelayMet,
} from '@q-mino/adapters-web'
import * as zz from '@q-mino/domains/library'
import type { Bytes, Primitives } from '@q-mino/domains/seals/safe/_dsl.ts'
import { what_an_extension_asks } from '@q-mino/domains/user/_dsl.ts'
import * as ui_value from '@q-mino/domains/ui/_value.ts'
import { a_manifest } from '@q-mino/domains/user/_value.ts'
import type * as activities_value from '@q-mino/domains/user/activities/_value.ts'
import { ping_pong } from '@q-mino/ping_pong'
import { afterEach, describe, expect, test } from 'vitest'
import {
  a_new_phone,
  cell,
  on_the_cell,
  phone,
  the_relay_s_transports,
  type PhoneState,
} from '../../src/index.ts'
import {
  a_node,
  a_story,
  all,
  composed_from,
  entries_of,
  ping_pong_manifest,
  quiet,
  the_hash_of_a_collect_secret,
  the_relay,
  the_scope_of_an_introduction,
  until,
  type Introduction,
  type Story,
} from '../node/harness.ts'
import { a_transport } from '../post/harness.ts'

/** The address of the phone's page, where her tickets' links point (WEB-1). */
const the_page = 'https://cumino.test/'

/** A real timer of so many milliseconds. */
const a_timer = (milliseconds: number) => (): Promise<void> =>
  new Promise<void>((done) => {
    setTimeout(done, milliseconds)
  })

/** The world's random bytes for a phone: each draw new, from the phone's number (TST-3). */
const a_world_of = (primitives: Primitives, phone_number: number): Primitives => {
  let draws = 0
  return {
    ...primitives,
    random_bytes: (length): Bytes => {
      draws += 1
      return Uint8Array.from(
        { length },
        (_, at) => (phone_number * 89 + draws * 43 + at * 13) & 255,
      )
    },
  }
}

/** What her screen asks at a gesture (UI-3): an activity, with the id it drew. */
const an_activity = (
  activity_id: string,
  what: activities_value.what_is_asked,
): ui_value.what_it_asks => ui_value.what_it_asks.parse({ asks: 'an_activity', activity_id, what })

/** The apps the stories opened, closed after each story: no executor outlives its story. */
const opened: zz.EffectExecutor[] = []

afterEach(async () => {
  for (const app of opened.splice(0)) await app.stop()
})

/**
 * Anna's phone of the stack, before her first face, ping pong preinstalled
 * (PNG-1), and her node as the screens see it, wired as the composition
 * root wires it: `user`'s ports, `self`'s reads through the port toward
 * `self`, the ticket shown, the page, the extensions the app carries, the
 * news, the fact log. The app is opened by the story (`opens_the_app`).
 */
const annas_phone = async (story: Story) => {
  const made = cell<PhoneState>({ initial: a_new_phone })
  const clock = story.clock
  const now = (): zz.RootContext => ({
    now: clock.now(),
    time_zone: clock.time_zone,
  })
  const node = await phone(on_the_cell(made), {
    the_realm_s_time: a_timer(2),
    a_while: a_timer(5),
  })({
    clock,
    elapsed: story.time.elapsed,
    primitives: a_world_of(story.primitives, 1),
    mailbox: a_transport(story.relay, story.time.now).port,
    collect: the_relay_s_transports(story.relay, {
      clock,
      hash: the_hash_of_a_collect_secret(story.primitives),
    }).collect,
    extensions: [{ manifest: ping_pong_manifest, realm: ping_pong }],
    relays: [the_relay],
  })
  let operations = 0
  const frames_traced: TheKernelsTraced[] = []
  // How the relay client last met the relay (UI-5): the story sets it, as the phone's collects would.
  let met: TheRelayMet = 'not_met_yet'
  let told_of_the_relay: readonly (() => void)[] = []
  const the_relay_meets = (now: TheRelayMet): void => {
    met = now
    for (const tell of told_of_the_relay) tell()
  }
  // The device's network (UI-5): the source, over a page the story turns off and on.
  const the_device = { navigator: { onLine: true }, listeners: new Set<() => void>() }
  const the_network_goes = (now: 'online' | 'offline'): void => {
    the_device.navigator.onLine = now === 'online'
    for (const listener of the_device.listeners) listener()
  }
  const her: HerNode = her_node_over({
    clock,
    draws_an_id: () => {
      operations += 1
      return `anna-op-${String(operations)}`
    },
    user: node.user,
    self: the_reads_of_self({
      clock,
      self: (context, request) => node.personas().self(context, request),
    }),
    the_ticket_shown: node.the_ticket_shown,
    the_page,
    the_extensions_installed: () => node.extensions().map((each) => each.name),
    the_news: {
      held: () =>
        Promise.resolve({ entries: made.held(), parts: made.held_parts(), notices: node.notices }),
      traced: () => node.traced,
      tree_traced: () => node.tree_traced,
      when_written: () => () => undefined,
    },
    the_log: node.log,
    the_frames: {
      on_self: (extension) => node.the_extension(extension)?.on_self,
      traces: (entry) => {
        frames_traced.push(entry)
      },
    },
    the_relay: {
      address: the_relay,
      as_met: {
        last: () => met,
        when_it_changes: (tell) => {
          told_of_the_relay = [...told_of_the_relay, tell]
          return () => {
            told_of_the_relay = told_of_the_relay.filter((one) => one !== tell)
          }
        },
      },
    },
    the_network: the_device_s_network({
      navigator: the_device.navigator,
      window: {
        addEventListener: (_type, listener) => the_device.listeners.add(listener),
        removeEventListener: (_type, listener) => the_device.listeners.delete(listener),
      },
    }),
  })

  /** The node runs until it is quiet (DOM-14, DOM-16): the reactions and the kernel's executors started, what is due delivered, then stopped. */
  const runs = async (): Promise<void> => {
    const running = [
      node.the_reactions['reaction/first_face'](),
      node.the_reactions['reaction/ticket'](),
      node.the_executors['seals/safe'](),
      node.the_executors['post/requests'](),
      node.the_executors['bonds/address_book'](),
      node.the_executors['extensions/activations'](),
    ]
    await quiet()
    for (const each of running) await each.stop()
  }

  /** How an activity ended, once it has, as her screens read it. */
  const how_it_ended = async (activity_id: string): Promise<activities_value.how_it_ended> => {
    const the_stage = async () => (await her.an_activity(activity_id))?.stage
    await until(async () => (await the_stage())?.stage === 'ended', `the end of ${activity_id}`)
    const stage = await the_stage()
    if (stage?.stage !== 'ended') throw new Error(`${activity_id} did not end`)
    return stage.how_it_ended
  }

  return {
    her,
    runs,
    /** The extensions follow the office (EXT-15): loaded at an activation, as the phone's composition does. */
    follows_the_office: () => node.the_extensions_follow_the_office(),
    /** The life of an extension the phone hosts (EXT-15). */
    the_life_of: (extension: string) => node.the_extension(extension)?.hosted.life().life,
    /** What the frames' fence traced, through her node (EXT-4). */
    frames_traced: (): readonly TheKernelsTraced[] => frames_traced,
    /** The relay client meets the relay, as a collect would (UI-5). */
    the_relay_meets,
    the_network_goes,

    how_it_ended,
    /** The ticket of a bond as the phone shows it (BND-9). */
    shows: node.the_ticket_shown,
    /** The app opens: `user`'s executor runs her activities as they come, until the story ends. */
    opens_the_app: (): void => {
      opened.push(node.the_app())
    },
    /** She asks for an activity from her screens, and it ends: how. */
    asks_and_it_ends: async (
      activity_id: string,
      what: activities_value.what_is_asked,
    ): Promise<activities_value.how_it_ended> => {
      await her.asks(an_activity(activity_id, what))
      const how = await how_it_ended(activity_id)
      await runs()
      return how
    },
    /** An introduction collected at her mailbox, taken by the address book as its stories take it (PER-11), the node then run. */
    receives: async (introduction: Introduction): Promise<void> => {
      const [ticket] = entries_of(
        await all(
          node.address_book.the_ticket_at_my_mailbox(now(), {
            deposit_address: introduction.at,
          }),
        ),
      )
      if (ticket === undefined) throw new Error(`no ticket of Anna's at ${introduction.at}`)
      const given = {
        bond_id: ticket.id,
        secret: introduction.secret,
        their_face: { ...introduction.their_face },
        their_mailbox: {
          deposit_address: introduction.their_mailbox.deposit_address,
          relays: [...introduction.their_mailbox.relays],
        },
        declared_at: introduction.declared_at,
      }
      operations += 1
      const id = `anna-op-${String(operations)}`
      await all(
        node.address_book.accept_their_introduction(
          {
            ...now(),
            operation: { id: zz.operation_id.parse(id), scope: the_scope_of_an_introduction },
            correlation: zz.correlation.parse(id),
            fingerprint: zz.fingerprint_of({
              path: 'bonds/address_book/usecase/accept_their_introduction',
              input: given,
            }),
          },
          given,
        ),
      )
      await runs()
    },
  }
}

/** Anna's phone with her app open and her first face, F_a "Anna", asked from her screens. */
const anna_with_her_face = async (story: Story) => {
  const anna = await annas_phone(story)
  anna.opens_the_app()
  await anna.asks_and_it_ends('A0', { activity: 'make_my_first_face', face: 'F_a', name: 'Anna' })
  return anna
}

/** Ping pong's manifest as she is shown it (EXT-7). */
const the_manifest_shown = () =>
  a_manifest.parse(the_manifest_to_accept(composed_from(ping_pong_manifest).manifest))

describe('her node, over a phone of the stack', () => {
  test('an activity asked from her screens is in progress, then ends done; her faces have the face', async () => {
    const anna = await annas_phone(await a_story())
    expect(await anna.her.her_faces()).toEqual([])
    await anna.her.asks(
      an_activity('A1', { activity: 'make_my_first_face', face: 'F_a', name: 'Anna' }),
    )
    // Asked while the app is closed: kept in progress until her app carries it out.
    expect(await anna.her.an_activity('A1')).toEqual({
      activity_id: 'A1',
      what: { activity: 'make_my_first_face', face: 'F_a', name: 'Anna' },
      asked_at: '2026-11-20T10:00:00.000Z',
      stage: { stage: 'in_progress' },
    })
    expect((await anna.her.the_activities_in_progress()).map((each) => each.activity_id)).toEqual([
      'A1',
    ])
    anna.opens_the_app()
    expect(await anna.how_it_ended('A1')).toMatchObject({
      ended: 'done',
      said: { event: 'your_face_is_being_made' },
    })
    expect(await anna.her.the_activities_in_progress()).toEqual([])
    await anna.runs()
    expect(await anna.her.her_faces()).toEqual([{ face: 'F_a', name: 'Anna' }])
  })

  test('a draft kept, read and dropped; the face she acts as, changed', async () => {
    const anna = await anna_with_her_face(await a_story())
    const purpose = { for: 'the_name_of_my_first_face' } as const
    expect(await anna.her.a_draft(purpose)).toBeUndefined()
    await anna.her.asks({ asks: 'to_keep_a_draft', for: purpose, text: 'Ann' })
    expect(await anna.her.a_draft(purpose)).toBe('Ann')
    await anna.her.asks({ asks: 'to_drop_a_draft', for: purpose })
    expect(await anna.her.a_draft(purpose)).toBeUndefined()
    expect(await anna.her.the_active_face()).toBeUndefined()
    await anna.her.asks({ asks: 'to_change_face', face: 'F_a' })
    expect(await anna.her.the_active_face()).toBe('F_a')
    // What `user` does not take is thrown, for the screens to tell: a text longer than a draft holds.
    await expect(
      anna.her.asks({ asks: 'to_keep_a_draft', for: purpose, text: 'A'.repeat(1025) }),
    ).rejects.toThrow()
  })

  test('her ticket ready, its link read back; the bond it makes, her contact, its card, its offers', async () => {
    const story = await a_story()
    const anna = await anna_with_her_face(story)
    const bruno = await a_node(story, {
      phone: 2,
      face_id: 'F_b',
      name: 'Bruno',
      installed: 'not_installed',
    })
    expect(await anna.her.her_ticket('L_b')).toBeUndefined()
    expect(
      await anna.asks_and_it_ends('A1', { activity: 'prepare_a_ticket', bond: 'L_b', face: 'F_a' }),
    ).toMatchObject({ ended: 'done' })
    const ticket = await anna.her.her_ticket('L_b')
    expect(ticket?.ready).toEqual({ bond: 'L_b', expires_at: '2026-11-22T10:00:00.000Z' })
    const in_the_link = the_ticket_in_a_link(ticket?.link ?? '')
    expect(ticket?.link.startsWith(`${the_page}#ticket=`)).toBe(true)
    expect(in_the_link).toEqual({ carries: 'a_ticket', ticket: await anna.shows('L_b') })
    if (in_the_link.carries !== 'a_ticket') throw new Error('no ticket in her link')

    // Bruno opens her link, presenting a ticket of his own; his introduction reaches her.
    await bruno.prepares_a_ticket('L_a')
    await bruno.opens_their_ticket({
      bond_id: 'L_a',
      their_ticket: in_the_link.ticket,
      name: 'Anna',
    })
    const letter = bruno.letters().at(-1)
    if (letter === undefined) throw new Error('no introduction of Bruno’s')
    await anna.receives(await bruno.carries(letter))

    expect(await anna.her.her_contacts()).toEqual([
      {
        bond: 'L_b',
        name: 'Bruno',
        introduced_as: 'Bruno',
        confirmation: { state: 'received', at: '2026-11-20T10:00:00.000Z' },
      },
    ])
    expect(await anna.her.a_contact('L_b')).toEqual({
      bond: 'L_b',
      name: 'Bruno',
      introduced_as: 'Bruno',
      confirmation: { state: 'received', at: '2026-11-20T10:00:00.000Z' },
      handshake: { way: 'at_a_distance', at: '2026-11-20T10:00:00.000Z' },
      their_relays: [the_relay],
    })
    expect(await anna.her.a_contact('L_x')).toBeUndefined()
    // Ping pong not active: her node offers Bruno nothing; once she activates it, ping pong.
    expect(await anna.her.offered_to('L_b')).toEqual([])
    expect(await anna.her.the_offers()).toEqual([])
    expect(
      await anna.asks_and_it_ends('A2', {
        activity: 'activate_an_extension',
        manifest: the_manifest_shown(),
      }),
    ).toMatchObject({ ended: 'done' })
    expect(await anna.her.offered_to('L_b')).toEqual([{ extension: 'ping_pong', majors: [1] }])
    expect(await anna.her.the_offers()).toEqual([{ extension: 'ping_pong', bonds: ['L_b'] }])
  })

  test('the extensions show ping pong not active, with what it asks; active once she activates it', async () => {
    const anna = await anna_with_her_face(await a_story())
    const manifest = the_manifest_shown()
    const [shown] = await anna.her.the_extensions()
    expect(shown).toEqual({
      extension: 'ping_pong',
      version: '0.1.0',
      is: 'not_active',
      manifest,
      what_it_asks: what_an_extension_asks(manifest),
    })
    expect(shown?.what_it_asks).toEqual(
      expect.arrayContaining([
        { asks: 'to_send_requests_on_your_bonds' },
        { asks: 'a_storage_of_its_own' },
        { asks: 'a_place_on_your_screens', point: 'action', name: 'ping', place: 'a_bond' },
        { asks: 'all_that_cumino_reaches' },
      ]),
    )
    if (shown === undefined) throw new Error('no extension shown')
    await anna.asks_and_it_ends('A1', {
      activity: 'activate_an_extension',
      manifest: shown.manifest,
    })
    expect((await anna.her.the_extensions()).map((each) => each.is)).toEqual(['active'])
    expect(await anna.her.the_held_letters()).toEqual([])
    expect(await anna.her.what_happened()).toEqual([])
  })

  test('her node tells each change once it is asked, and no more once stopped', async () => {
    const anna = await annas_phone(await a_story())
    anna.opens_the_app()
    let told = 0
    const stops = anna.her.when_it_changes(() => {
      told += 1
    })
    await quiet()
    expect(told).toBe(0)
    await anna.her.asks(
      an_activity('A1', { activity: 'make_my_first_face', face: 'F_a', name: 'Anna' }),
    )
    await until(() => told > 0, 'a change told')
    await anna.how_it_ended('A1')
    stops()
    const told_when_stopped = told
    await anna.her.asks({
      asks: 'to_keep_a_draft',
      for: { for: 'the_name_of_my_first_face' },
      text: 'Anna',
    })
    await anna.runs()
    await a_timer(20)()
    expect(told).toBe(told_when_stopped)
  })
  test('the relay, its address and how it was last met, each change told; no question asked of a bond yet (UI-5)', async () => {
    const anna = await annas_phone(await a_story())
    expect(await anna.her.the_relay()).toEqual({ address: the_relay, met: 'answered' })
    expect(await anna.her.the_extensions_in_common_with('L_b')).toEqual({ answer: 'not_asked' })
    let told = 0
    const stops = anna.her.when_it_changes(() => {
      told += 1
    })
    anna.the_relay_meets('did_not_answer')
    expect(told).toBe(1)
    expect(await anna.her.the_relay()).toEqual({ address: the_relay, met: 'did_not_answer' })
    stops()
    anna.the_relay_meets('answered')
    expect(told).toBe(1)
  })

  test('the device’s network, each change told: no network, else nothing told (UI-5)', async () => {
    const anna = await annas_phone(await a_story())
    expect(await anna.her.the_network()).toBe('not_told')
    let told = 0
    const stops = anna.her.when_it_changes(() => {
      told += 1
    })
    anna.the_network_goes('offline')
    expect(await anna.her.the_network()).toBe('offline')
    anna.the_network_goes('online')
    expect(await anna.her.the_network()).toBe('not_told')
    expect(told).toBe(2)
    stops()
    anna.the_network_goes('offline')
    expect(told).toBe(2)
  })

  test('a frame served reaches its extension’s leaves on self, a ping sent as she would; one fenced is traced', async () => {
    const anna = await anna_with_her_face(await a_story())
    const [shown] = await anna.her.the_extensions()
    if (shown === undefined) throw new Error('no extension shown')
    await anna.asks_and_it_ends('A1', {
      activity: 'activate_an_extension',
      manifest: shown.manifest,
    })
    const following = anna.follows_the_office()
    await until(() => anna.the_life_of('ping_pong') === 'running', 'ping pong loaded')
    const served = (message: unknown) => {
      const fenced = through_a_frames_fence({
        frame: { extension: 'ping_pong', shown: true },
        active: true,
        message,
        now: '2026-11-21T09:00:00.000Z',
      })
      if (fenced.fenced !== 'served') throw new Error('the fence refused it')
      return fenced
    }
    const the_first_event_of = async (message: unknown) => {
      const flow = anna.her.a_frame_asks(served(message))[Symbol.asyncIterator]()
      const first = await flow.next()
      await flow.return?.(undefined)
      return first.done === true ? undefined : first.value
    }
    expect(
      await the_first_event_of({
        message: 'invoke',
        id: 'x1',
        use_case: 'usecase/send_a_ping',
        version: '1.0.0',
        input: { bond: 'L_b' },
      }),
    ).toMatchObject({ event: 'the_ping_is_sent' })
    expect(
      await the_first_event_of({
        message: 'invoke',
        id: 'x2',
        use_case: 'usecase/no_such_leaf',
        version: '1.0.0',
        input: {},
      }),
    ).toMatchObject({ event: 'invalid_request', reason: 'not_a_leaf' })
    const refused = through_a_frames_fence({
      frame: { extension: 'ping_pong', shown: false },
      active: true,
      message: {
        message: 'invoke',
        id: 'x3',
        use_case: 'usecase/send_a_ping',
        version: '1.0.0',
        input: {},
      },
      now: '2026-11-21T09:00:00.000Z',
    })
    if (refused.fenced !== 'refused') throw new Error('the fence served a frame not shown')
    anna.her.a_frame_is_fenced(refused.traced)
    expect(anna.frames_traced()).toEqual([refused.traced])
    await following.stop()
  })
})
