// The harness of the step's checks on the oracle with two nodes (plan.md
// step 12, "Checks"; F7, F8, EXT-2, EXT-4, EXT-6, EXT-7, EXT-12, EXT-15;
// part 12.4, on the node since part 13.3). Anna's, Bruno's and Carla's
// nodes of q-'s oracle (`../node/harness.ts`): one cell each with the safe,
// the requests, the address book and the office of the extensions; one
// relay; their bonds made by tickets and introductions; greetings, the test
// extension, hosted in process over its partition. The asker's side is the
// kernel's: greetings' leaf on `self`, through its mounted port, its
// delivery calling the kernel's port of requests. The server's side is the
// kernel's entry of part 13.2 over what the node's collector reads at its
// mailboxes: the letters opened; a request routed over the office's reads
// and auth's lookup, silent with its case in the kernel's trace, or served
// by greetings' leaves mounted below q-'s node of `known`, its event the
// response, answered on the bond (PST-9); a response taken (PST-7), or
// annotated. The executors wait on real timers, and every wait of a story
// is bounded (the rule on loops, A, 20 Nov 2026).

import type * as post_value from '@q-mino/domains/post/_value.ts'
import {
  a_node as the_node_of_the_oracle,
  a_story,
  bonded_by_a_link,
  type AnExtensionOfTheApp,
  type Mailbox,
  type Story,
} from '../node/harness.ts'

export {
  ask_for_a_greeting_back,
  composed_from,
  greetings_manifest,
  ping_pong_manifest,
  until,
} from '../node/harness.ts'

/** Whether the extension the apps carry (greetings, unless the story says ping pong) is installed on a node, and whether its user activated it. */
export type Greetings = 'not_installed' | 'installed' | 'active'

/** Where a node writes to a face (BND-4): its key, and a mailbox of that face's. */
interface Whom {
  readonly key: string
  readonly mailbox: Mailbox
}

/**
 * A node of the story, as the checks of step 12 read it: the node of q-'s
 * oracle, its kernel's entry over what its collector reads (`the_entry`),
 * and its post in the words of the checks (`post`): its face's key, its
 * runs, the faults of its transport, what it carried and collected, the
 * answer it keeps, a request and a response it writes itself.
 */
export const a_node = async (
  story: Story,
  start: {
    readonly phone: number
    readonly face_id: string
    readonly name: string
    readonly greetings: Greetings
    readonly carries?: AnExtensionOfTheApp
    readonly characters?: number
  },
) => {
  const node = await the_node_of_the_oracle(story, {
    phone: start.phone,
    face_id: start.face_id,
    name: start.name,
    installed:
      start.greetings === 'not_installed' ? 'not_installed' : (start.carries ?? 'greetings'),
    ...(start.characters === undefined ? {} : { characters: start.characters }),
  })
  return {
    ...node,
    post: {
      /** The node's face's key. */
      key: node.key,
      /** The node runs until it is quiet: its post sends and waits (PST-6). */
      runs: node.runs,
      /** The next deposits of the node's transport meet these faults (TST-4). */
      will: node.will,
      /** Every deposit the node's transport carried, in order. */
      carried: node.carried,
      /** The answer the post keeps under a request's identity (PST-8). */
      the_answer_to: node.the_answer_to,
      /** The envelopes the relay keeps at the node's mailboxes. */
      collects: node.at_my_mailboxes,
      /** The post sends a request from the node's face (PST-5), outside any extension (the code is free, F2); deposited when the node runs. */
      send_a_request: (input: {
        readonly request_id: string
        readonly to: Whom
        readonly invokes: post_value.invocation
        readonly input: unknown
      }) => node.sends_a_request(input),
      /** A response written by the node's face (PST-1, PST-9) to a face, at a mailbox of its, deposited once: what the relay answered. */
      deposits_a_response: async (response: {
        readonly answers: string
        readonly to: Whom
        readonly event: unknown
      }) =>
        node.deposits(
          response.to.mailbox.deposit_address,
          await node.an_envelope_of(
            node.a_response({
              answers: response.answers,
              to: response.to.mailbox.deposit_address,
              event: response.event,
            }),
            response.to.key,
          ),
        ),
    },
    /** The kernel's entry over what the node's collector reads at its mailboxes (PER-25). */
    the_entry: node.collects,
  }
}

/** A node of the story. */
export type NodeUnderTest = Awaited<ReturnType<typeof a_node>>

/**
 * The story of two nodes (three phones): one relay; Anna's node, bonded to
 * Bruno (`B-BRUNO`) and Carla (`B-CARLA`), each bond made by her ticket in
 * a link that Bruno, Carla opens (`B-ANNA` on theirs); Carla has no bond
 * with Bruno. The apps carry greetings, or ping pong where the story says
 * (`carries`, step 14); it is installed and activated on each, unless the
 * story says otherwise, and started where active. Friday 20 November 2026,
 * 10:00 UTC.
 */
export const two_nodes = async (
  options: {
    readonly anna?: Greetings
    readonly bruno?: Greetings
    readonly carla?: Greetings
    readonly brunos_characters?: number
    readonly carries?: AnExtensionOfTheApp
  } = {},
) => {
  const story = await a_story()
  const carries = options.carries ?? 'greetings'
  const anna = await a_node(story, {
    phone: 1,
    face_id: 'F_a',
    name: 'Anna',
    greetings: options.anna ?? 'active',
    carries,
  })
  const bruno = await a_node(story, {
    phone: 2,
    face_id: 'F_b',
    name: 'Bruno',
    greetings: options.bruno ?? 'active',
    carries,
    ...(options.brunos_characters === undefined ? {} : { characters: options.brunos_characters }),
  })
  const carla = await a_node(story, {
    phone: 3,
    face_id: 'F_c',
    name: 'Carla',
    greetings: options.carla ?? 'active',
    carries,
  })
  await bonded_by_a_link(
    { node: anna, bond_id: 'B-BRUNO', name: 'Bruno' },
    { node: bruno, bond_id: 'B-ANNA', name: 'Anna' },
  )
  await bonded_by_a_link(
    { node: anna, bond_id: 'B-CARLA', name: 'Carla' },
    { node: carla, bond_id: 'B-ANNA', name: 'Anna' },
  )
  const nodes = [
    [anna, options.anna],
    [bruno, options.bruno],
    [carla, options.carla],
  ] as const
  for (const [each, greetings_on_it] of nodes) {
    if ((greetings_on_it ?? 'active') === 'active') await each.activates()
  }
  return {
    story,
    anna,
    bruno,
    carla,
    /** The nodes' clock reads this time of the day. */
    at: story.at,
    /** The nodes' clock reads this time, and the asker runs (its post's sendings again, its waits). */
    runs_at: async (asker: NodeUnderTest, time_of_day: string): Promise<void> => {
      story.at(time_of_day)
      await asker.post.runs()
    },
  }
}
