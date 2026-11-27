import * as zz from '@q-mino/domains/library'
import type * as activities_value from '@q-mino/domains/user/activities/_value.ts'
import { the_relay_s_http_transports } from '@q-mino/adapters-web'
import { afterEach, expect, test, vi } from 'vitest'
import { z } from 'zod'
import { a_relay_served } from '../relay/served.ts'
import { fake_primitives } from '../seals/primitives.ts'
import {
  a_node_on_sqlite,
  a_node_s_file,
  on_sqlite,
  over_a_node_on_sqlite,
} from '../sqlite/storage.ts'
import {
  a_story,
  send_my_introduction,
  the_relay,
  time_zone,
  until,
  type AFactory,
  type AnExtensionCarried,
  type APhoneOfTheStory,
  type AStory,
} from './harness.ts'

// A node on SQLite closed and opened again from its file (part B2 of the
// assistant, AST-2; the README of `packages/assistant`, B2's tests): Anna's
// phone is `phone(storage, release)(world)` over a node's storage on SQLite,
// synced at each commit as the assistant's node is, the relay its
// configurator over SQLite served on a port of this machine (MBX-9, WEB-7),
// the phones' transports the relay's HTTP client (WEB-6). She makes her
// face, bonds with Bruno by his link, both activate messaging, and they
// write to each other; she reads his message, and prepares a ticket for a
// bond to be. Her node is closed and opened again from the same file as a
// new phone: her face, her bond, her chat and its read mark, her ticket and
// its wait are there, and the
// replay of the start (K-6: the collector hands again every letter the
// relay keeps) receives no message twice. Then Bruno writes again, and her
// node opened again receives it.

vi.setConfig({ testTimeout: 30_000 })

/** A time that never passes: the relay is never unheard in the story. */
const no_time = (): Promise<void> => new Promise<void>(() => undefined)

/** The factory over HTTP (TST-1), as `over_http.test.ts`: the relay served, in the story's world, and the client to it. */
const over_http: AFactory = {
  primitives: fake_primitives,
  relay: async (world) => {
    const served = await a_relay_served(world, the_relay)
    const waits = served.relay.waits()
    const transports = the_relay_s_http_transports({ fetch: served.fetch, elapsed: no_time })
    return {
      transports: () => transports,
      stops: async () => {
        await waits.stop()
        await served.closes()
      },
    }
  },
}

/** What the apps of the story carry: ping pong and messaging, preinstalled and off (PNG-1, MSG-10). */
const carries: readonly AnExtensionCarried[] = ['ping_pong', 'messaging']

/** Twelve hours, the quarter of an introduction's 48 (PST-6, BND-10). */
const an_introduction_s_quarter = 12 * 60 * 60

let running: AStory | undefined = undefined
afterEach(async () => {
  const story = running
  running = undefined
  await story?.stops()
})

/** An activity asked, and its end once it has ended. */
const asks_and_it_ends = async (
  phone: APhoneOfTheStory,
  activity_id: string,
  what: activities_value.what_is_asked,
): Promise<activities_value.how_it_ended> => {
  await phone.asks(activity_id, what)
  await until(
    async () => (await phone.the_end_of(activity_id)) !== undefined,
    `the end of ${phone.name}'s ${activity_id}`,
  )
  const ended = await phone.the_end_of(activity_id)
  if (ended === undefined) throw new Error(`${phone.name}'s ${activity_id} did not end`)
  return ended
}

/** Her first face (BND-8), made once the story settles. */
const makes_her_face = async (story: AStory, phone: APhoneOfTheStory, face: string) => {
  expect(
    await asks_and_it_ends(phone, `first_face_${face}`, {
      activity: 'make_my_first_face',
      face,
      name: phone.name,
    }),
  ).toMatchObject({ ended: 'done' })
  await story.settles()
}

/** A ticket prepared for a bond to be (BND-8), ready once the story settles. */
const prepares_a_ticket = async (
  story: AStory,
  phone: APhoneOfTheStory,
  bond: string,
  face: string,
) => {
  expect(
    await asks_and_it_ends(phone, `ticket_${bond}`, { activity: 'prepare_a_ticket', bond, face }),
  ).toMatchObject({ ended: 'done' })
  await story.settles()
}

/** Messaging activated, its manifest accepted as shown (EXT-7), loaded once the story settles (EXT-15). */
const activates_messaging = async (story: AStory, phone: APhoneOfTheStory) => {
  expect(
    await asks_and_it_ends(phone, 'activate_messaging', {
      activity: 'activate_an_extension',
      manifest: phone.the_manifest_shown('messaging'),
    }),
  ).toMatchObject({ ended: 'done', said: { event: 'the_extension_is_active' } })
  await story.settles()
}

/** A context of the user on `self` (PER-23), as her part asks messaging's leaves (MSG-7). */
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

/** Messaging's leaves on `self`, through the kernel's mounted port (EXT-11). */
const messaging_on = (phone: APhoneOfTheStory) => {
  const extension = phone.node.the_extension('messaging')
  if (extension === undefined) throw new Error(`no messaging on ${phone.name}'s phone`)
  return extension.on_self
}

/** She writes in her chat with a bond and taps «Invia» (MSG-2); the story settles. */
const writes = async (
  story: AStory,
  phone: APhoneOfTheStory,
  bond: string,
  text: string,
  operation: string,
) => {
  // A minute after the last gesture: each message at its own instant.
  await story.at(new Date(Date.parse(phone.now()) + 60_000).toISOString())
  const events: unknown[] = []
  for await (const event of messaging_on(phone)(as_the_user(phone, operation), {
    leaf: 'usecase/write_a_message',
    input: { bond, text },
  }))
    events.push(event)
  expect(events).toMatchObject([{ event: 'the_message_is_written' }])
  await story.settles()
}

/** A message of a chat, as `a_chat` gives it (MSG-7), as far as the story reads it. */
const a_message = z.object({
  message_id: z.string(),
  text: z.string(),
  whose: z.discriminatedUnion('whose', [
    z.object({ whose: z.literal('mine'), stage: z.object({ stage: z.string() }) }),
    z.object({ whose: z.literal('theirs') }),
  ]),
})

/** Her chat with a bond as it reads now: `a_chat`'s snapshot, the follow ended at once (K-4); each message by its id. */
const the_messages = async (phone: APhoneOfTheStory, bond: string, operation: string) => {
  for await (const event of messaging_on(phone)(as_the_user(phone, operation), {
    leaf: 'usecase/a_chat',
    input: { bond },
  }))
    return z
      .object({ event: z.literal('snapshot'), entries: z.array(a_message) })
      .parse(event)
      .entries.map((message) => ({
        message_id: message.message_id,
        text: message.text,
        whose: message.whose.whose === 'mine' ? `mine, ${message.whose.stage.stage}` : 'theirs',
      }))
  throw new Error(`no snapshot of ${phone.name}'s chat with ${bond}`)
}

/** Her chat with a bond as it reads now, newest first (MSG-7): each message's text and whose it is. */
const the_chat = async (phone: APhoneOfTheStory, bond: string, operation: string) =>
  (await the_messages(phone, bond, operation)).map(({ text, whose }) => ({ text, whose }))

/** How many of their messages she has not read in a chat (MSG-7, `to_read`), as her row of contacts reads it. */
const to_read = async (phone: APhoneOfTheStory, bond: string, operation: string) => {
  for await (const event of messaging_on(phone)(as_the_user(phone, operation), {
    leaf: 'usecase/a_chat_at_a_glance',
    input: { bond },
  }))
    return z
      .object({ entries: z.array(z.object({ to_read: z.number() })) })
      .parse(event)
      .entries.map((glance) => glance.to_read)
  throw new Error(`no glance of ${phone.name}'s chat with ${bond}`)
}

/** She reads her chat up to a message (MSG-7, `read_a_chat`), as her conversation marks it when shown. */
const reads_up_to = async (
  phone: APhoneOfTheStory,
  bond: string,
  up_to: string,
  operation: string,
) => {
  const events: unknown[] = []
  for await (const event of messaging_on(phone)(as_the_user(phone, operation), {
    leaf: 'usecase/read_a_chat',
    input: { bond, up_to },
  }))
    events.push(event)
  expect(events).toMatchObject([{ event: 'the_chat_is_read' }])
}

test('Anna’s node on SQLite, closed and opened again from its file: her face, her bond and her chat; nothing received twice', async () => {
  const story = await a_story(over_http, 'none')
  running = story
  const file = a_node_s_file()
  const her_node = await a_node_on_sqlite(file, 'each_commit')
  const anna = await story.a_phone({
    phone: 1,
    name: 'Anna',
    carries,
    storage: over_a_node_on_sqlite(her_node),
  })
  const bruno = await story.a_phone({
    phone: 2,
    name: 'Bruno',
    carries,
    storage: await on_sqlite(),
  })
  await makes_her_face(story, anna, 'F_a')
  await makes_her_face(story, bruno, 'F_b')

  // Bruno's link, opened by Anna: bonded at a distance (BND-10).
  await prepares_a_ticket(story, bruno, 'L_a', 'F_b')
  await prepares_a_ticket(story, anna, 'L_b', 'F_a')
  const his_ticket = await bruno.the_ticket_shown('L_a')
  if (his_ticket === undefined) throw new Error('no ticket L_a ready on Bruno’s phone')
  expect(
    await asks_and_it_ends(anna, 'open_L_b', {
      activity: 'open_their_ticket',
      bond: 'L_b',
      their_ticket: his_ticket,
      name: 'Bruno',
    }),
  ).toMatchObject({ ended: 'done' })
  const her_introduction = anna.the_kernels_request('F_a', send_my_introduction, 'L_b')
  await story.settles_through_the_quarters(
    an_introduction_s_quarter,
    'its_last_sending',
    async () => (await anna.the_answer_to(her_introduction))?.status === 'answered',
  )
  expect(await bruno.a_bond('L_a')).toMatchObject({ name: 'Anna', my_face_id: 'F_b' })

  await activates_messaging(story, anna)
  await activates_messaging(story, bruno)
  await writes(story, anna, 'L_b', 'Ciao Bruno', 'anna-write-1')
  await writes(story, bruno, 'L_a', 'Ciao Anna', 'bruno-write-1')
  // Her chat, newest first (MSG-7).
  const her_chat = [
    { text: 'Ciao Anna', whose: 'theirs' },
    { text: 'Ciao Bruno', whose: 'mine, delivered' },
  ]
  expect(await the_chat(anna, 'L_b', 'anna-read-1')).toEqual(her_chat)
  // His message read (MSG-7): nothing more to read.
  expect(await to_read(anna, 'L_b', 'anna-glance-1')).toEqual([1])
  const [his] = await the_messages(anna, 'L_b', 'anna-read-2')
  await reads_up_to(anna, 'L_b', his?.message_id ?? '', 'anna-mark-1')
  expect(await to_read(anna, 'L_b', 'anna-glance-2')).toEqual([0])
  // A ticket for a bond to be, ready, its wait of 48 hours queued (BND-8).
  await prepares_a_ticket(story, anna, 'L_x', 'F_a')
  const her_ticket = await anna.my_ticket('L_x')
  expect(her_ticket).toBeDefined()
  const her_face = await anna.my_faces()
  const her_bond = await anna.a_bond('L_b')

  // Her node closed: the phone off and out of the story, its file let go.
  await anna.leaves()
  await her_node.close()
  // While it is closed, the file is free: opened again, as the same node.
  const opened_again = await a_node_on_sqlite(file, 'each_commit')
  expect(opened_again.term).toBe(her_node.term + 1)
  const anna_again = await story.a_phone({
    phone: 11,
    name: 'Anna',
    carries,
    storage: over_a_node_on_sqlite(opened_again),
  })
  // The start's replay (K-6): every letter the relay keeps handed again, each meeting its duplicate branch.
  await story.settles()
  expect(anna_again.collected().length).toBeGreaterThan(0)
  expect(await anna_again.my_faces()).toEqual(her_face)
  expect(await anna_again.a_bond('L_b')).toEqual(her_bond)
  expect(anna_again.node.the_extension('messaging')?.hosted.life().life).toBe('running')
  expect(await the_chat(anna_again, 'L_b', 'anna-read-3')).toEqual(her_chat)
  expect(await to_read(anna_again, 'L_b', 'anna-glance-3')).toEqual([0])
  expect(await anna_again.my_ticket('L_x')).toEqual(her_ticket)
  expect(await anna_again.held_letters()).toEqual([])

  // Bruno writes again: her node opened again receives it, once.
  await writes(story, bruno, 'L_a', 'Ci sei ancora?', 'bruno-write-2')
  expect(await the_chat(anna_again, 'L_b', 'anna-read-4')).toEqual([
    { text: 'Ci sei ancora?', whose: 'theirs' },
    ...her_chat,
  ])
  expect(await to_read(anna_again, 'L_b', 'anna-glance-4')).toEqual([1])
  // The ticket's wait, queued before the node was closed, ends after 48 hours (BND-8).
  await story.at(new Date(Date.parse(anna_again.now()) + 49 * 60 * 60 * 1000).toISOString())
  expect(await anna_again.facts_of('bonds/address_book/fact/a_ticket_has_expired')).toMatchObject([
    { payload: { expired_ticket: { id: 'L_x' } } },
  ])
})
