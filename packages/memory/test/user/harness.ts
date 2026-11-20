// The harness of `user`'s stories (USR-1..USR-8; part 15.2; the stories of
// `packages/domains/src/user/README.md`): Anna's phone on q-'s oracle, the
// node of `../node/harness.ts` with a cell for `user` beside the kernel's
// and `user`'s executor delivering `carry_out_an_activity` through the port
// toward `self` while her app is open; Bruno's and Carla's phones. Her face
// F_a, her bonds L_b with Bruno and L_c with Carla (`L_a` on theirs), made
// by her tickets in links; ping pong 0.1.0 preinstalled on the three
// phones, activated unless a story says otherwise, Anna's screens following
// for their time (the 70 seconds of `send_a_ping`). Friday 20 November
// 2026, 10:00 UTC. Every wait is bounded and turns on a real timer.

import type * as activities_value from '@q-mino/domains/user/activities/_value.ts'
import {
  a_node,
  a_story,
  bonded_by_a_link,
  until,
  type NodeUnderTest,
  type Story,
} from '../node/harness.ts'

export { composed_from, ping_pong_manifest, until } from '../node/harness.ts'

/** Whether ping pong is activated on a phone at the story's start. */
export type Activated = 'activated' | 'not_activated'

/** Anna's story: the relay, the clock, the three phones. */
export interface AnnasStory {
  readonly story: Story
  readonly anna: NodeUnderTest
  readonly bruno: NodeUnderTest
  readonly carla: NodeUnderTest
  /** The nodes' clock reads this time of the day. */
  readonly at: (time_of_day: string) => void
}

/** The nodes whose app a story opened, closed after each story (`afterEach`): no executor outlives its story. */
const opened: NodeUnderTest[] = []

/** Every app the stories opened, closed. */
export const the_apps_close = async (): Promise<void> => {
  for (const node of opened.splice(0)) await node.closes_the_app()
}

/**
 * Anna's story: three phones, two bonds of Anna's, ping pong activated on
 * each unless the story says otherwise (`anna`), Anna's app open unless it
 * says closed (`app`), so that what she asks is carried out as it comes.
 */
export const annas_story = async (
  options: { readonly anna?: Activated; readonly app?: 'open' | 'closed' } = {},
): Promise<AnnasStory> => {
  const story = await a_story()
  const anna = await a_node(story, {
    phone: 1,
    face_id: 'F_a',
    name: 'Anna',
    installed: 'ping_pong',
    screens_follow: 'for_their_time',
  })
  const bruno = await a_node(story, {
    phone: 2,
    face_id: 'F_b',
    name: 'Bruno',
    installed: 'ping_pong',
  })
  const carla = await a_node(story, {
    phone: 3,
    face_id: 'F_c',
    name: 'Carla',
    installed: 'ping_pong',
  })
  await bonded_by_a_link(
    { node: anna, bond_id: 'L_b', name: 'Bruno' },
    { node: bruno, bond_id: 'L_a', name: 'Anna' },
  )
  await bonded_by_a_link(
    { node: anna, bond_id: 'L_c', name: 'Carla' },
    { node: carla, bond_id: 'L_a', name: 'Anna' },
  )
  if ((options.anna ?? 'activated') === 'activated') await anna.activates()
  await bruno.activates()
  await carla.activates()
  if ((options.app ?? 'open') === 'open') {
    anna.opens_the_app()
    opened.push(anna)
  }
  return { story, anna, bruno, carla, at: story.at }
}

/** Her app opens on a node a story started closed: closed again after the story. */
export const opens_the_app = (node: NodeUnderTest): void => {
  node.opens_the_app()
  opened.push(node)
}

/** Anna asks for an activity, and it ends: how. */
export const asks_and_it_ends = async (
  node: NodeUnderTest,
  activity_id: string,
  what: activities_value.what_is_asked,
): Promise<activities_value.how_it_ended> => {
  await node.asks(activity_id, what)
  return node.how_it_ended(activity_id)
}

/** A ping's request deposited by the asker's post: its facts in the outbox delivered once it runs. */
export const the_request_goes = async (asker: NodeUnderTest, requests = 1): Promise<void> => {
  await until(async () => (await asker.sent()).length >= requests, 'the request sent')
  await asker.runs()
}

/** The ping on a bond: Anna's taps on "Ping" (ping pong's action `ping`, EXT-16). */
export const ping = (bond: string): activities_value.what_is_asked => ({
  activity: 'use_an_action',
  extension: 'ping_pong',
  action: 'ping',
  on: { place: 'a_bond', bond },
})
