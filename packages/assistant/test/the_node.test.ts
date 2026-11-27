import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { libsodium_primitives } from '@q-mino/adapters-common'
import {
  the_device_s_clock,
  the_ticket_in_a_link,
  the_time_that_passes,
} from '@q-mino/adapters-web'
import * as boundary from '@q-mino/boundary'
import * as zz from '@q-mino/domains/library'
import type * as activities_value from '@q-mino/domains/user/activities/_value.ts'
import { afterAll, afterEach, describe, expect, test, vi } from 'vitest'
import { z } from 'zod'
import { a_relay_served } from '../../memory/test/relay/served.ts'
import { fake_primitives } from '../../memory/test/seals/primitives.ts'
import {
  a_node_on_sqlite,
  a_node_s_file,
  over_a_node_on_sqlite,
} from '../../memory/test/sqlite/storage.ts'
import {
  a_story,
  on_the_oracle,
  send_my_introduction,
  time_zone,
  until,
  type APhoneOfTheStory,
  type AStory,
} from '../../memory/test/stack/harness.ts'
import { scripted, type ATurnAsked } from '../src/answerer/index.ts'
import { the_node_started } from '../src/node/index.ts'
import { the_register } from '../src/register/index.ts'
import type { TheStand } from '../src/stand/index.ts'
import { words } from '../src/texts/index.ts'
import { over_a_phone, the_assistant, the_numbers, the_zone } from '../src/the_assistant/index.ts'

// The assistant's node (README stories 1, 2, 4, 5, 6, 21, 22; AST-2, AST-4,
// AST-5, AST-13; AST-16). Its first start and its start again on its own
// wiring, `the_node_started`, over SQLite, against the relay served on this
// machine (WEB-7). Then the stack's story: the assistant a phone of the
// stack on SQLite, its user this package's; Bea a phone of the stack, on
// Android; she opens the link the assistant left on the stand, the bond is
// kept, the welcome waits for her Messaggi, she asks and is answered, she
// pings and is ponged; the assistant's node closed and opened again: the
// start's replay answers nothing twice.

vi.setConfig({ testTimeout: 30_000 })

const folders: string[] = []
afterAll(() => {
  for (const folder of folders.splice(0)) rmSync(folder, { recursive: true, force: true })
})
const a_folder = (): string => {
  const folder = mkdtempSync(join(tmpdir(), 'cumino-assistant-node-'))
  folders.push(folder)
  return folder
}

const app = 'https://q-mino-prova.github.io/q-/'

/** A stand of test (INV-5's contract): what the assistant left, in order. */
const a_stand_of_test = () => {
  const left: string[] = []
  const stand: TheStand = {
    leaves: (invitation) => {
      left.push(invitation.ticket)
      return Promise.resolve({ left: 'the_invitation_is_on_the_stand' })
    },
    counts: () => Promise.resolve({ counted: 'counted', takeable: left.length }),
  }
  return { stand, left }
}

describe('its node, on its own wiring', () => {
  test('the first start: the face made, messaging and ping pong active, the stand’s key drawn; started again over its storage: nothing made twice; a second one over the same file told', async () => {
    const clock = the_device_s_clock(the_zone)
    const primitives = await libsodium_primitives()
    const served = await a_relay_served(
      {
        clock,
        elapsed: the_time_that_passes,
        hash: (secret) => Promise.resolve(`hash-of-${secret}`),
        signature_holds: primitives.signature_holds,
      },
      'https://relay.q-mino.test',
    )
    const folder = a_folder()
    const lines: string[] = []
    const starts = () =>
      the_node_started({
        file: join(folder, 'node.sqlite'),
        relay: 'https://relay.q-mino.test',
        clock,
        elapsed: the_time_that_passes,
        fetch: served.fetch,
        collect_every: 100,
        journal: (line) => {
          lines.push(line)
        },
      })
    const an_assistant_over = (phone: Parameters<typeof over_a_phone>[0]) =>
      the_assistant({
        node: over_a_phone(phone, clock),
        register: the_register(join(folder, 'register.sqlite'), '2026-11-27'),
        answers: scripted(),
        the_copy: () => folder,
        notes: join(folder, 'richieste'),
        stand: a_stand_of_test().stand,
        app,
        draws_an_id: () => 'an-id',
        waits_until: async (holds) => {
          await until(holds, 'the assistant’s node')
        },
        journal: () => undefined,
      })
    const first = await starts()
    if (first.node !== 'running') throw new Error('the first start did not run')
    expect(await an_assistant_over(first.phone).first_start()).toEqual({
      made: ['the face', 'messaging', 'ping_pong'],
    })
    const side = over_a_phone(first.phone, clock)
    expect(await side.my_faces()).toEqual(['assistente'])
    expect(first.phone.the_extension('messaging')?.hosted.life().life).toBe('running')
    // While it runs, a second one over the same file is told, and composes nothing.
    expect(await starts()).toEqual({ node: 'another_connection' })
    await first.stops()
    const again = await starts()
    if (again.node !== 'running') throw new Error('the start again did not run')
    expect(await an_assistant_over(again.phone).first_start()).toEqual({ made: [] })
    expect(await over_a_phone(again.phone, clock).my_faces()).toEqual(['assistente'])
    expect(await over_a_phone(again.phone, clock).is_active('ping_pong')).toBe(true)
    await again.stops()
    await served.closes()
  })
})

/** An activity asked, and its end once it has ended. */
const asks_and_it_ends = async (
  phone: APhoneOfTheStory,
  activity_id: string,
  what: activities_value.what_is_asked,
): Promise<activities_value.how_it_ended | undefined> => {
  await phone.asks(activity_id, what)
  await until(async () => (await phone.the_end_of(activity_id)) !== undefined, activity_id)
  return phone.the_end_of(activity_id)
}

/** A context of the user on `self` (PER-23). */
const as_the_user = (phone: APhoneOfTheStory, operation: string) => {
  const now = phone.now()
  return {
    now,
    time_zone,
    caller: { is: 'the_user' as const },
    declared_at: now,
    version: zz.semver.parse('1.0.0'),
    operation: { id: zz.operation_id.parse(operation), scope: 'self/the_user' },
    correlation: zz.correlation.parse(operation),
  }
}

/** Her chat with a bond, oldest first: each message's text, whose it is and, hers, its stage (MSG-7). */
const her_chat = async (phone: APhoneOfTheStory, bond: string, operation: string) => {
  const extension = phone.node.the_extension('messaging')
  if (extension === undefined) throw new Error('no messaging')
  for await (const event of extension.on_self(as_the_user(phone, operation), {
    leaf: 'usecase/a_chat',
    input: { bond },
  }))
    return z
      .object({
        entries: z.array(
          z.object({
            text: z.string(),
            whose: z.discriminatedUnion('whose', [
              z.object({ whose: z.literal('mine'), stage: z.object({ stage: z.string() }) }),
              z.object({ whose: z.literal('theirs') }),
            ]),
          }),
        ),
      })
      .parse(event)
      .entries.map((message) =>
        message.whose.whose === 'mine'
          ? `mine (${message.whose.stage.stage}): ${message.text}`
          : `theirs: ${message.text}`,
      )
      .reverse()
  return []
}

/** She writes in her chat and taps «Invia» (MSG-2), a minute after the last gesture. */
const she_writes = async (story: AStory, phone: APhoneOfTheStory, bond: string, text: string) => {
  await story.at(new Date(Date.parse(phone.now()) + 60_000).toISOString())
  const extension = phone.node.the_extension('messaging')
  if (extension === undefined) throw new Error('no messaging')
  const events: unknown[] = []
  for await (const event of extension.on_self(as_the_user(phone, `bea-${text}`), {
    leaf: 'usecase/write_a_message',
    input: { bond, text },
  }))
    events.push(event)
  expect(events).toMatchObject([{ event: 'the_message_is_written' }])
  await story.settles()
}

describe('its node in the stack', () => {
  let stops: (() => Promise<void>) | undefined = undefined
  afterEach(async () => {
    await stops?.()
    stops = undefined
  })

  test('Bea opens the link: the bond kept, offered; the welcome meets her silence until she activates Messaggi; she asks and is answered; she pings: pong; the start’s replay answers nothing twice', async () => {
    const story = await a_story(on_the_oracle(fake_primitives), 'none')
    stops = story.stops
    const file = a_node_s_file()
    const its_node = await a_node_on_sqlite(file)
    const the_assistant_s = await story.a_phone({
      phone: 1,
      name: 'Assistente di Cumino',
      carries: ['ping_pong', 'messaging'],
      storage: over_a_node_on_sqlite(its_node),
    })
    const bea = await story.a_phone({ phone: 2, name: 'Bea', carries: ['ping_pong', 'messaging'] })
    const folder = a_folder()
    const asked: ATurnAsked[] = []
    const { stand, left } = a_stand_of_test()
    const register = the_register(join(folder, 'register.sqlite'), '2026-11-19')
    const assistant_over = (phone: APhoneOfTheStory) =>
      the_assistant({
        node: over_a_phone(phone.node, {
          now: () => zz.date_time.parse(phone.now()),
          time_zone,
        }),
        register,
        answers: scripted((turn) => {
          asked.push(turn)
          return { answer: 'replied', reply: 'Con un link o con i QR incrociati.' }
        }),
        the_copy: () => folder,
        notes: join(folder, 'richieste'),
        stand,
        app,
        draws_an_id: () => 'T1',
        waits_until: async (holds, what) => {
          for (let round = 0; round < 20; round += 1) {
            if (await holds()) return
            await story.settles()
          }
          throw new Error(`${what}: it did not come to pass`)
        },
        journal: () => undefined,
        numbers: { ...the_numbers, on_the_stand: 1 },
      })
    let assistant = assistant_over(the_assistant_s)
    await assistant.first_start()
    await story.settles()
    expect(
      await asks_and_it_ends(bea, 'first_face', {
        activity: 'make_my_first_face',
        face: 'F_bea',
        name: 'Bea',
      }),
    ).toMatchObject({ ended: 'done' })
    await story.settles()

    // The stand topped up (AST-13): one ticket for a link, left.
    expect(await assistant.the_stand_topped_up()).toBe(1)
    const link = the_ticket_in_a_link(`${app}#ticket=${left[0] ?? ''}`)
    if (link.carries !== 'a_ticket') throw new Error('the ticket left is no ticket')
    expect(link.ticket.introduced_as).toBe(words.the_face)

    // Bea opens the link (BND-10): her ticket for the bond to be, then theirs opened; the bond
    // kept at a distance, named as she introduced herself.
    expect(
      await asks_and_it_ends(bea, 'her_ticket', {
        activity: 'prepare_a_ticket',
        bond: 'B-ASSISTENTE',
        face: 'F_bea',
      }),
    ).toMatchObject({ ended: 'done' })
    await story.settles()
    expect(
      await asks_and_it_ends(bea, 'open', {
        activity: 'open_their_ticket',
        bond: 'B-ASSISTENTE',
        their_ticket: link.ticket,
        name: 'Assistente',
      }),
    ).toMatchObject({ ended: 'done' })
    const her_introduction = bea.the_kernels_request('F_bea', send_my_introduction, 'B-ASSISTENTE')
    await story.settles_through_the_quarters(
      12 * 60 * 60,
      'its_last_sending',
      async () => (await bea.the_answer_to(her_introduction))?.status === 'answered',
    )
    expect(await the_assistant_s.a_bond('T1')).toMatchObject({
      name: 'Bea',
      my_face_id: 'assistente',
    })
    expect(await the_assistant_s.offers_ping_pong_to('T1')).toBe(true)
    expect(
      await the_assistant_s.node.reads.is_offered('messaging', boundary.bond.parse('T1')),
    ).toBe(true)

    // The welcome (AST-5), once; Bea's Messaggi off: her silence (F8), the welcome on its way.
    expect(await assistant.a_look()).toEqual({ welcomes: 1, closed: 0, waiting: 0 })
    await story.settles()
    expect(await assistant.a_look()).toEqual({ welcomes: 0, closed: 0, waiting: 0 })
    expect(await her_chat(the_assistant_s, 'T1', 'a-read-1')).toEqual([
      `mine (on_its_way): ${words.the_welcome}`,
    ])
    // She activates Messaggi: what the relay keeps handed again (MSG-16), the welcome received, delivered.
    for (const extension of ['messaging', 'ping_pong'] as const)
      expect(
        await asks_and_it_ends(bea, `activate_${extension}`, {
          activity: 'activate_an_extension',
          manifest: bea.the_manifest_shown(extension),
        }),
      ).toMatchObject({ ended: 'done' })
    await story.settles()
    await story.settles()
    expect(await her_chat(bea, 'B-ASSISTENTE', 'b-read-1')).toEqual([
      `theirs: ${words.the_welcome}`,
    ])
    expect(await her_chat(the_assistant_s, 'T1', 'a-read-2')).toEqual([
      `mine (delivered): ${words.the_welcome}`,
    ])

    // She asks how the handshake works: one turn, one reply, the chat read up to her message.
    await she_writes(story, bea, 'B-ASSISTENTE', 'Come funziona la stretta di mano?')
    expect(await assistant.a_look()).toEqual({ welcomes: 0, closed: 1, waiting: 0 })
    await story.settles()
    expect(asked).toEqual([
      {
        before: [{ whose: 'mine', text: words.the_welcome }],
        covered: ['Come funziona la stretta di mano?'],
      },
    ])
    expect(await her_chat(bea, 'B-ASSISTENTE', 'b-read-2')).toEqual([
      `theirs: ${words.the_welcome}`,
      'mine (delivered): Come funziona la stretta di mano?',
      'theirs: Con un link o con i QR incrociati.',
    ])

    // She pings the assistant (PNG-3): pong; no answerer, no cap.
    await bea.asks('P1', {
      activity: 'use_an_action',
      extension: 'ping_pong',
      action: 'ping',
      on: { place: 'a_bond', bond: 'B-ASSISTENTE' },
    })
    await story.settles_through_the_quarters(
      15,
      'its_last_sending',
      async () => (await bea.the_end_of('P1')) !== undefined,
    )
    expect(await bea.the_end_of('P1')).toMatchObject({ said: { event: 'pong' } })

    // The assistant's node closed and opened again from its file: the replay of the start (K-6).
    await the_assistant_s.leaves()
    await its_node.close()
    const opened_again = await a_node_on_sqlite(file)
    const the_assistant_again = await story.a_phone({
      phone: 11,
      name: 'Assistente di Cumino',
      carries: ['ping_pong', 'messaging'],
      storage: over_a_node_on_sqlite(opened_again),
    })
    await story.settles()
    expect(the_assistant_again.collected().length).toBeGreaterThan(0)
    assistant = assistant_over(the_assistant_again)
    expect(await assistant.first_start()).toEqual({ made: [] })
    expect(await assistant.a_look()).toEqual({ welcomes: 0, closed: 0, waiting: 0 })
    expect(asked).toHaveLength(1)
    expect(await her_chat(the_assistant_again, 'T1', 'a-read-3')).toHaveLength(3)
    register.close()
  })
})
