// The harness of `user`'s stories (USR-1..USR-8; parts 15.2, 21.2; the
// stories of `packages/domains/src/user/README.md`): Anna's phone, the
// phone of the `memory` stack (`phone(storage, release)(world)`, `src/phone/`)
// over a storage a factory gives (TST-1: a cell of q-'s oracle unless
// another, `on_a_cell`), so that an adapter of `user` runs the same stories
// (`stories.ts`) as its conformance suite; `user`'s executor delivering
// `carry_out_an_activity` through the port toward `self` while her app is
// open; Bruno's and Carla's phones, kept by the same factory. Her face F_a,
// her bonds L_b with Bruno and L_c with Carla (`L_a` on theirs), made by
// her tickets in links; ping pong 0.1.0 preinstalled on the three phones,
// activated unless a story says otherwise, Anna's screens following for
// their time (the 70 seconds of `send_a_ping`). Friday 20 November 2026,
// 10:00 UTC. Every wait is bounded and turns on a real timer.
//
// A node here is the node of `../node/harness.ts` (its world, its release,
// the user's gestures), with only what `user`'s stories use, over the
// factory's storage: that harness keeps the oracle's cell alone. A story
// observes what the ports give (TST-3): the activities, the reads of the
// address book, the facts of the log, the entries the outbox gives for an
// effect, the entries and parts held, the extension's partition as the
// phone's port reads it, the kernel's trace, the messages to the realm.

import {
  the_held_letters,
  the_manifest_to_accept,
  what_happened_in_a_tree,
  what_happened_in_the_kernel,
  type ACollect,
  type Hosted,
  type Loaded,
} from '@q-mino/adapters-common'
import type * as boundary from '@q-mino/boundary'
import * as zz from '@q-mino/domains/library'
import type { Bytes, Primitives } from '@q-mino/domains/seals/safe/_dsl.ts'
import type * as activities_value from '@q-mino/domains/user/activities/_value.ts'
import type * as drafts_value from '@q-mino/domains/user/drafts/_value.ts'
import { a_manifest } from '@q-mino/domains/user/_value.ts'
import type * as user_value from '@q-mino/domains/user/_value.ts'
import { ping_pong } from '@q-mino/ping_pong'
import { z } from 'zod'
import { phone, the_relay_s_transports } from '../../src/index.ts'
import {
  a_story,
  all,
  composed_from,
  entries_of,
  ping_pong_manifest,
  the_hash_of_a_collect_secret,
  the_relay,
  the_scope_of_an_introduction,
  the_scope_of_the_user,
  until,
  type Introduction,
  type Letter,
  type Shown,
  type Story,
} from '../node/harness.ts'
import { a_transport } from '../post/harness.ts'
import type { AStorageUnderTest } from '../stack/harness.ts'

export { composed_from, ping_pong_manifest, until } from '../node/harness.ts'
export { on_a_cell } from '../stack/harness.ts'

/** How the phones of a story are kept (TST-1): each a new storage, the oracle's cell unless another. */
export type AFactory = () => Promise<AStorageUnderTest>

/** Ping pong's manifest as she is shown it (EXT-7): the office's words. */
export const the_manifest_shown = (): user_value.a_manifest =>
  a_manifest.parse(the_manifest_to_accept(composed_from(ping_pong_manifest).manifest))

/** A real timer of so many milliseconds. */
const a_timer = (milliseconds: number) => (): Promise<void> =>
  new Promise<void>((done) => {
    setTimeout(done, milliseconds)
  })

/**
 * The world's random bytes for a node: each draw new, of the length asked,
 * from a number the story gives each node, so that two nodes never draw
 * the same seed nor the same R (TST-3).
 */
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

/** A fact as an extension's partition keeps it, as far as a story reads it: its parts' paths. */
const a_fact_kept = z.object({ parts: z.array(z.object({ path: z.string() })) })

/** How a node starts: its number for the world's draws, its face's id and name, how long its screens follow. */
interface Start {
  readonly phone: number
  readonly face_id: string
  readonly name: string
  /**
   * How long a screen of ping pong's follows (DOM-3): at once over, its
   * realm's 2 ms; or for its time, a wait of a minute or more over once the
   * story's clock has moved past it, a shorter one a real timer of 2 ms.
   */
  readonly screens_follow?: 'at_once' | 'for_their_time'
}

/**
 * A node of the story over a storage of the factory's: the phone of the
 * `memory` stack, its first start made (its face, from the app), ping pong
 * installed and not active until its user activates it (`activates`). The
 * introductions the address book hands to `post` are kept for the story to
 * carry (`letters`, `carries`, `receives`); the partition's next commits
 * are the story's (`its_partition_will`); the messages to the extension's
 * realm are watched (`to_the_extension`).
 */
const a_node = async (story: Story, start: Start, factory: AFactory) => {
  const kept = await factory()
  const world = a_world_of(story.primitives, start.phone)
  const clock = story.clock
  const when = (): zz.RootContext => ({
    now: clock.now(),
    time_zone: clock.time_zone,
  })
  const transport = a_transport(story.relay, story.time.now)
  // The collect port over the relay's oracle (MBX-6), its R hashed as the relay's desk hashes it.
  const collect: ACollect = the_relay_s_transports(story.relay, {
    clock,
    hash: the_hash_of_a_collect_secret(story.primitives),
  }).collect

  // What the story keeps or scripts, through the phone's release.
  const letters: Letter[] = []
  // Each with the instant `post` would declare it at, the phone's clock then (PER-13).
  const declared = new Map<Letter, string>()
  const to_the_extension: boundary.a_message_to_an_extension[] = []
  // The partition's next commits as a story scripts them (TST-4): each
  // committed, or refused as a full partition refuses it, so that the
  // extension falls there (EXT-15); then as the partition answers.
  const commits: ('committed' | 'refused')[] = []
  // The node's real timers running: the realm's short waits and the release's pauses.
  let timers = 0
  /** A real timer of the node's, counted while it runs: the node is not quiet before it rings. */
  const a_timer_of_the_node = (milliseconds: number) => async (): Promise<void> => {
    timers += 1
    try {
      await a_timer(milliseconds)()
    } finally {
      timers -= 1
    }
  }
  /**
   * The node is quiet (DOM-14, DOM-16): everything set going has run its
   * course up to its next wait, on the log's bell, the story's clock or a
   * stop. Seen from a turn of the event loop, when every promise settled:
   * no transaction of its storage in flight and no timer of its own running.
   * A condition, not a count of turns (TST-11): how much of IndexedDB's
   * work fits in a turn depends on the machine's load.
   */
  const quiet = (): Promise<void> =>
    until(async () => {
      await a_timer(0)()
      return !kept.at_work() && timers === 0
    }, `${start.name}'s node quiet`)
  /** The time that passes in the extension's realm (DOM-3): at once over, or for a screen's time. */
  const the_screens_wait: zz.Elapsed =
    start.screens_follow === 'for_their_time'
      ? async (milliseconds) => {
          if (milliseconds < 60_000) return a_timer_of_the_node(2)()
          const from = Date.parse(clock.now())
          while (Date.parse(clock.now()) - from < milliseconds) await story.time.elapsed()
        }
      : a_timer_of_the_node(2)

  const node = await phone(kept.storage, {
    send_my_introduction: (entry: { readonly payload: Letter }) => {
      letters.push(entry.payload)
      declared.set(entry.payload, zz.date_time.parse(clock.now()))
      return Promise.resolve({ outcome: 'delivered' as const })
    },
    the_realm_s_time: the_screens_wait,
    a_while: a_timer_of_the_node(5),
    characters: 1_000_000,
    the_partition: (_, partition) => ({
      read: partition.read,
      commit: (writes) =>
        commits.shift() === 'refused'
          ? Promise.resolve({ answer: 'refused', why: 'the_partition_is_full' })
          : partition.commit(writes),
    }),
    // Each message to the extension's realm kept for the story.
    the_transport: (in_its_realm) => (to_the_kernel) => {
      const realm = in_its_realm(to_the_kernel)
      return {
        to_the_extension: (message) => {
          to_the_extension.push(message)
          realm.to_the_extension(message)
        },
        unload: realm.unload,
      }
    },
  })({
    clock,
    elapsed: story.time.elapsed,
    primitives: world,
    mailbox: transport.port,
    collect,
    extensions: [{ manifest: ping_pong_manifest, realm: ping_pong }],
    relays: [the_relay],
  })
  const { address_book, user } = node

  // The address book's reads, at the clock's instant.
  const my_faces = async () => entries_of(await all(address_book.my_faces(when(), {})))
  const a_bond = async (bond_id: string) =>
    entries_of(await all(address_book.a_bond(when(), { bond_id })))[0]
  const the_bond_at = async (deposit_address: string) =>
    entries_of(await all(address_book.the_bond_at_my_mailbox(when(), { deposit_address })))[0]
  const the_ticket_at = async (deposit_address: string) =>
    entries_of(await all(address_book.the_ticket_at_my_mailbox(when(), { deposit_address })))[0]

  /**
   * The node runs until it is quiet (DOM-14, DOM-16): the reactions and the
   * four kernel's executors started, what is due delivered, then stopped,
   * as a phone closed.
   */
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

  let operations = 0
  /** The context the user's entry gives `self` (step 15): the root's, the `Caller` the user, the version, the operation. */
  const as_the_user = (version: string, operation?: string) => {
    operations += 1
    const id = operation ?? `${start.face_id}-op-${String(operations)}`
    const at = when()
    return {
      ...at,
      caller: { is: 'the_user' as const },
      declared_at: at.now,
      version: zz.semver.parse(version),
      operation: { id: zz.operation_id.parse(id), scope: the_scope_of_the_user },
      correlation: zz.correlation.parse(id),
    }
  }
  /** Anna on her phone (PER-3, step 15): a leaf of the kernel's `self` by its path, at 1.0.0, its events. */
  const the_user = (leaf: string, input: unknown) =>
    all(node.personas().self(as_the_user('1.0.0'), { leaf, input }))

  /** A command sent as the stories send it (DOM-11): under an operation of the story's, in a scope. */
  const sent_as =
    (path: string, input: unknown, scope: string) =>
    (operation?: string): zz.CommandRootContext => {
      operations += 1
      const id = operation ?? `${start.face_id}-op-${String(operations)}`
      return {
        ...when(),
        operation: { id: zz.operation_id.parse(id), scope },
        correlation: zz.correlation.parse(`correlation-${id}`),
        fingerprint: zz.fingerprint_of({ path, input }),
      }
    }

  /** The app's executor of `user` while the app is open (`opens_the_app`). */
  let the_app: zz.EffectExecutor | undefined = undefined

  /** Ping pong hosted, which the app carries. */
  const the_extension = () => {
    const extension = node.the_extension('ping_pong')
    if (extension === undefined) throw new Error(`no ping pong on ${start.name}'s node`)
    return extension
  }

  /** Ping pong's partition, as the phone's port reads it whole (EXT-14): its records, in its order. */
  const the_records_of_ping_pong = async () => {
    const read = await node.partitions.of('ping_pong').read({ read: 'range' })
    return read.answer === 'read' ? read.entries : []
  }

  /** Every fact the storage recorded, in order, as its log gives them (DOM-17). */
  const recorded = async (): Promise<readonly zz.StoredEnvelope[]> => {
    const facts = new Map<zz.position, zz.StoredEnvelope>()
    for await (const each of node.log(undefined)) {
      if (each.event !== 'fact') break
      facts.set(each.position, each.fact)
    }
    return [...facts.values()]
  }

  // The first start (BND-8, SEA-3): the user's face, asked for from the app,
  // its keys made by the safe through the reactions.
  await the_user('usecase/make_my_first_face', { face_id: start.face_id, name: start.name })
  await runs()
  const key = (await my_faces()).find((mine) => mine.id === start.face_id)?.public_key
  if (key === undefined) throw new Error(`no face ${start.face_id} made on ${start.name}'s node`)

  /** An activity, as her screens read it (USR-2). */
  const the_activity = async (activity_id: string) =>
    entries_of(await all(user.an_activity(when(), { activity_id })))[0]

  return {
    name: start.name,
    /** The kernel's reads of its office (EXT-6, EXT-7). */
    reads: node.reads,
    /** The kernel's four persona trees by path (PER-24). */
    personas: node.personas,
    runs,
    /** One pass of the phone's collector (DOM-17): the first fault of the entry thrown once it is over. */
    collects: node.collects,
    notices: node.notices,
    to_the_extension,
    /** The kernel's trace, by why. */
    whys: (): readonly string[] => node.traced.map((entry) => entry.why),
    my_bonds: async () => entries_of(await all(address_book.my_bonds(when(), {}))),
    /** The ticket of a bond as the node shows it (BND-8, BND-9), none for one not ready. */
    shows: (bond_id: string): Promise<Shown | undefined> => node.the_ticket_shown(bond_id),
    /** The user prepares a ticket for a bond to be, on the relay (BND-8); ready once the node ran. */
    prepares_a_ticket: async (bond_id: string) => {
      const input = { bond_id, face_id: start.face_id, relays: [the_relay] }
      await all(
        address_book.prepare_a_ticket(
          sent_as('bonds/address_book/usecase/prepare_a_ticket', input, the_scope_of_the_user)(),
          input,
        ),
      )
      await runs()
    },
    /** The user opens their ticket, presenting hers of that bond (BND-10): her introduction handed to `post` once the node ran. */
    opens_their_ticket: async (input: {
      readonly bond_id: string
      readonly their_ticket: Shown
      readonly name: string
    }) => {
      const given = {
        bond_id: input.bond_id,
        their_ticket: {
          ...input.their_ticket,
          mailbox: {
            deposit_address: input.their_ticket.mailbox.deposit_address,
            relays: [...input.their_ticket.mailbox.relays],
          },
        },
        name: input.name,
      }
      await all(
        address_book.open_their_ticket(
          sent_as('bonds/address_book/usecase/open_their_ticket', given, the_scope_of_the_user)(),
          given,
        ),
      )
      await runs()
    },
    /** The introductions the address book handed to `post`, in order. */
    letters: (): readonly Letter[] => [...letters],
    /** What `post` carries from an introduction (step 10): my face, their ticket's secret, at their ticket's D, my mailbox of the bond. */
    carries: async (letter: Letter): Promise<Introduction> => {
      const mine = await a_bond(letter.bond_id)
      if (mine === undefined) throw new Error(`no bond ${letter.bond_id} to introduce`)
      const my_face = (await my_faces()).find((face) => face.id === mine.my_face_id)
      if (my_face === undefined) throw new Error(`no face ${mine.my_face_id} to introduce`)
      return {
        at: letter.their_ticket.mailbox.deposit_address,
        secret: letter.their_ticket.secret,
        their_face: { key: my_face.public_key, introduced_as: my_face.name },
        their_mailbox: mine.my_mailbox,
        declared_at: declared.get(letter) ?? zz.date_time.parse(clock.now()),
      }
    },
    /** An introduction collected at a mailbox of the node's, taken by the address book (PER-11): the bond of the ticket ready there. */
    receives: async (introduction: Introduction) => {
      const bond_id =
        (await the_ticket_at(introduction.at))?.id ?? (await the_bond_at(introduction.at))?.id
      if (bond_id === undefined) throw new Error(`no ticket at ${introduction.at}`)
      const given = {
        bond_id,
        secret: introduction.secret,
        their_face: { ...introduction.their_face },
        their_mailbox: {
          deposit_address: introduction.their_mailbox.deposit_address,
          relays: [...introduction.their_mailbox.relays],
        },
        declared_at: introduction.declared_at,
      }
      await all(
        address_book.accept_their_introduction(
          sent_as(
            'bonds/address_book/usecase/accept_their_introduction',
            given,
            the_scope_of_an_introduction,
          )(),
          given,
        ),
      )
      await runs()
    },
    /** The user activates ping pong, accepting its manifest as shown, and the kernel loads it (EXT-7, EXT-15). */
    activates: async (): Promise<Loaded> => {
      await the_user('usecase/activate_an_extension', {
        manifest: the_manifest_to_accept(the_extension().composed.manifest),
      })
      return the_extension().hosted.load()
    },
    /** The user deactivates ping pong, and the kernel unloads it (EXT-7, EXT-15). */
    deactivates: async (): Promise<void> => {
      await the_user('usecase/deactivate_an_extension', { extension: 'ping_pong' })
      await the_extension().hosted.unload()
    },
    /** Ping pong hosted (EXT-15). */
    the_hosted: (): Hosted => the_extension().hosted,
    /**
     * An update of the app with this manifest of ping pong (EXT-7, EXT-10):
     * ping pong unloaded, composed again, the node wired again over the
     * office with the manifest installed now (the same storage), then
     * loaded: what its load came to.
     */
    updated_to: async (manifest: unknown) => {
      await node.updated_to([{ manifest, realm: ping_pong }])
      return the_extension().hosted.load()
    },
    /** The user taps "Ping" on a bond (PNG-4): ping pong's leaf on `self`, through its mounted port; the ping its first event names. */
    pings: async (bond_id: string): Promise<string> => {
      const events = await all(
        the_extension().on_self(as_the_user('1.0.0'), {
          leaf: 'usecase/send_a_ping',
          input: { bond: bond_id },
        }),
      )
      const ping_id: unknown = Reflect.get(
        Object(Reflect.get(Object(events[0]), 'payload')),
        'ping_id',
      )
      if (typeof ping_id !== 'string') throw new Error(`no ping: ${JSON.stringify(events)}`)
      return ping_id
    },
    /** The requests the node's post recorded as sent, by their identity. */
    sent: async (): Promise<readonly string[]> =>
      (await recorded()).flatMap((fact) =>
        fact.parts
          .filter((part) => part.path === 'post/requests/fact/a_request_has_been_sent')
          .map((part) =>
            String(Reflect.get(Object(Reflect.get(Object(part.payload), 'sent_request')), 'id')),
          ),
      ),
    recorded,
    /** The pongs ping pong gave back, as its partition keeps them. */
    pongs: async (): Promise<readonly unknown[]> =>
      (await the_records_of_ping_pong())
        .filter((record) => record.key.startsWith('state/pong/'))
        .map((record) => record.value),
    /** The facts ping pong recorded in its partition, in order, by the last segment of each part's path. */
    facts_of_ping_pong: async (): Promise<readonly string[]> =>
      (await the_records_of_ping_pong())
        .filter((record) => record.key.startsWith('fact/'))
        .toSorted((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))
        .flatMap((record) =>
          a_fact_kept.parse(record.value).parts.map((part) => part.path.split('/').at(-1) ?? ''),
        ),
    /** The next commits of ping pong's partition, as the story scripts them (TST-4): `refused` makes it fall. */
    its_partition_will: (...next: readonly ('committed' | 'refused')[]): void => {
      commits.push(...next)
    },
    /**
     * The entries queued for an effect, by their ids, in order (DOM-13): as
     * the outbox gives them from its start, until it waits for the next.
     */
    queued: async (effect: string): Promise<readonly string[]> => {
      const entries = kept.storage.outbox(effect)(undefined)[Symbol.asyncIterator]()
      const ids: string[] = []
      for (;;) {
        const next = await Promise.race([entries.next(), quiet().then(() => 'it_waits' as const)])
        if (next === 'it_waits' || next.done === true) return ids
        ids.push(next.value.entry.id)
      }
    },
    // The user's offices (USR-1..USR-8, part 15.2), as her screens use them.
    /** The app opens: `user`'s executor runs, her activities carried out as they come, until it closes. */
    opens_the_app: (): void => {
      the_app ??= node.the_app()
    },
    /** The app closes: `user`'s executor stopped, the deliveries in flight abandoned (met again when it opens). */
    closes_the_app: async (): Promise<void> => {
      const running = the_app
      the_app = undefined
      await running?.stop()
    },
    /** Her screen asks for an activity, with the id it drew (USR-2, DOM-12): its events. */
    asks: (
      activity_id: string,
      what: activities_value.what_is_asked,
    ): Promise<readonly unknown[]> => {
      const input = { activity_id, what }
      return all(
        user.ask_for_an_activity(
          sent_as('user/activities/usecase/ask_for_an_activity', input, the_scope_of_the_user)(),
          input,
        ),
      )
    },
    the_activity,
    /** The activities in progress, in the order she asked them. */
    the_activities_in_progress: async () =>
      entries_of(await all(user.the_activities_in_progress(when(), {}))),
    /** How an activity ended, once it has (at most about two seconds, else the story fails). */
    how_it_ended: async (activity_id: string): Promise<activities_value.how_it_ended> => {
      const the_stage = async () => (await the_activity(activity_id))?.stage
      await until(async () => (await the_stage())?.stage === 'ended', `the end of ${activity_id}`)
      const stage = await the_stage()
      if (stage?.stage !== 'ended') throw new Error(`${activity_id} did not end`)
      return stage.how_it_ended
    },
    /** Her screen keeps a draft, or drops it (USR-5): its events. */
    keeps_a_draft: (purpose: drafts_value.what_it_is_for, text: string) => {
      const input = { for: purpose, text }
      return all(
        user.keep_a_draft(
          sent_as('user/drafts/usecase/keep_a_draft', input, the_scope_of_the_user)(),
          input,
        ),
      )
    },
    drops_a_draft: (purpose: drafts_value.what_it_is_for) => {
      const input = { for: purpose }
      return all(
        user.drop_a_draft(
          sent_as('user/drafts/usecase/drop_a_draft', input, the_scope_of_the_user)(),
          input,
        ),
      )
    },
    /** The draft for this, if one is kept. */
    a_draft: async (purpose: drafts_value.what_it_is_for) =>
      entries_of(await all(user.a_draft(when(), { for: purpose })))[0],
    /** She changes face (USR-6): its events. */
    changes_face: (face: string) =>
      all(
        user.change_face(
          sent_as('user/choices/usecase/change_face', { face }, the_scope_of_the_user)(),
          { face },
        ),
      ),
    /** The face she acts as, if she has chosen one. */
    the_active_face: async () => entries_of(await all(user.the_active_face(when(), {})))[0],
    /** `user`'s executor's return as a story sends it (USR-3): an end, under an operation of the effect's scope. */
    ends: (activity_id: string, how_it_ended: activities_value.how_it_ended) => {
      const input = { activity_id, how_it_ended }
      return all(
        user.end_an_activity(
          sent_as(
            'user/activities/usecase/end_an_activity',
            input,
            'user/activities/effect/carry_out_an_activity',
          )(),
          input,
        ),
      )
    },
    /** The letters held on the node, as she is told them (USR-8). */
    held_letters: async (): Promise<readonly user_value.a_held_letter[]> =>
      the_held_letters({
        entries: await kept.held(),
        parts: await kept.held_parts(),
        notices: node.notices,
      }),
    /** What happened without a fact, as she is told it (USR-8): the kernel's trace, then the trees'. */
    what_happened: (): readonly user_value.what_happened_without_a_fact[] => [
      ...node.traced.map(what_happened_in_the_kernel),
      ...node.tree_traced.flatMap((entry) => what_happened_in_a_tree(entry) ?? []),
    ],
  }
}

/** A node of a story. */
export type NodeUnderTest = Awaited<ReturnType<typeof a_node>>

/** A side of a bond to be: the node, the bond's id there, and the name its user gives the other. */
interface ASide {
  readonly node: NodeUnderTest
  readonly bond_id: string
  readonly name: string
}

/**
 * A bond made at a distance (BND-10), as the address book's stories make
 * it: the holder's ticket sent in a link; the opener opens it presenting a
 * ticket of its own; its introduction carried to the holder and accepted
 * there.
 */
const bonded_by_a_link = async (holder: ASide, opener: ASide): Promise<void> => {
  await holder.node.prepares_a_ticket(holder.bond_id)
  await opener.node.prepares_a_ticket(opener.bond_id)
  const ticket = await holder.node.shows(holder.bond_id)
  if (ticket === undefined) throw new Error(`no ticket ${holder.bond_id} on ${holder.node.name}'s`)
  await opener.node.opens_their_ticket({
    bond_id: opener.bond_id,
    their_ticket: ticket,
    name: opener.name,
  })
  const letter = opener.node.letters().at(-1)
  if (letter === undefined) throw new Error(`no introduction of ${opener.node.name}'s`)
  await holder.node.receives(await opener.node.carries(letter))
}

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
 * Anna's story: three phones kept as the factory keeps them, two bonds of
 * Anna's, ping pong activated on each unless the story says otherwise
 * (`anna`), Anna's app open unless it says closed (`app`), so that what
 * she asks is carried out as it comes.
 */
export const annas_story = async (
  factory: AFactory,
  options: { readonly anna?: Activated; readonly app?: 'open' | 'closed' } = {},
): Promise<AnnasStory> => {
  const story = await a_story()
  const anna = await a_node(
    story,
    { phone: 1, face_id: 'F_a', name: 'Anna', screens_follow: 'for_their_time' },
    factory,
  )
  const bruno = await a_node(story, { phone: 2, face_id: 'F_b', name: 'Bruno' }, factory)
  const carla = await a_node(story, { phone: 3, face_id: 'F_c', name: 'Carla' }, factory)
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
