// The node of q-'s oracle as the kernel runs it (TST-2, TST-3, MBX-7; PER-22,
// PER-24, PER-25, EXT-6; parts 13.3, 17): a phone of the `memory` stack
// (`phone(cell, release)(world)`, `src/phone/`), the one wiring of a phone
// over q-'s oracle (CFG-1, CFG-2), started over a cell of its own, in the
// story's world: the story's clock, the world's random bytes for this node,
// the post's deposits through a transport over the relay's oracle (where a
// story injects its faults, `will`), the relay's collect at its mailboxes,
// the extension its app carries (greetings, the test extension, or ping
// pong, part 14.2). What is the story's, not the phone's, comes in through
// the release: an introduction the address book hands to `post` kept for the
// story to carry (`letters`, `carries`, `receives`); the time that passes in
// the extension's realm (`screens_follow`); the partition's next commits
// (`its_partition_will`); a node whose code is changed
// (`tampers_with_its_responses`); the messages to the extension's realm,
// watched (`to_the_extension`). The harness keeps only the story's
// affordances: the user's gestures as the user's entry will send them
// (`self`, step 15), the address book's commands as its stories send them,
// letters a story writes itself, the reads of the extension's partition.
// The relay's desk hashes R as the safe draws D (SEA-4), so that the safe's
// mailboxes are the relay's. Every wait is bounded and turns on a real timer
// (A, 20 Nov 2026).
//
// Rejected: two cells side by side, as part 12.4 had them (a phone of the
// post's harness and an office over an address book written as state): two
// safes, so the face that signs letters and the address book's face would
// differ, and a ticket's secret is the address book's face's signature
// (BND-9).

import {
  compose_an_extension,
  the_kernels_offer,
  the_manifest_to_accept,
  the_held_letters,
  what_happened_in_a_tree,
  what_happened_in_the_kernel,
  type ACollect,
  type AnEnvelopeCollected,
  type AnExtensionsLeaves,
  type Composed,
  type Hosted,
  type Loaded,
} from '@q-mino/adapters-common'
import * as boundary from '@q-mino/boundary'
import * as zz from '@q-mino/domains/library'
import {
  a_letter_in_an_envelope,
  content_of,
  the_content_a_letter_signs,
  the_identity_of_a_request,
  the_identity_of_the_response_to,
  the_operation_of_a_deposit,
  type Deposited,
} from '@q-mino/domains/post/_dsl.ts'
import type * as post_value from '@q-mino/domains/post/_value.ts'
import {
  base64url_of,
  sealed_for,
  the_deposit_address_of,
  type Bytes,
  type Primitives,
} from '@q-mino/domains/seals/safe/_dsl.ts'
import type * as activities_value from '@q-mino/domains/user/activities/_value.ts'
import type * as drafts_value from '@q-mino/domains/user/drafts/_value.ts'
import type * as user_value from '@q-mino/domains/user/_value.ts'
import { greetings } from '@q-mino/greetings'
import manifest_json from '@q-mino/greetings/manifest.json' with { type: 'json' }
import { ping_pong } from '@q-mino/ping_pong'
import ping_pong_manifest_json from '@q-mino/ping_pong/manifest.json' with { type: 'json' }
import { z } from 'zod'
import {
  a_new_phone,
  cell,
  phone,
  the_relay_s_transports,
  type PhoneState,
} from '../../src/index.ts'
import {
  a_clock,
  a_transport,
  all,
  entries_of,
  quiet,
  the_relay,
  type Fault,
} from '../post/harness.ts'
import { a_relay, type RelayUnderTest } from '../relay/harness.ts'
import { fake_primitives } from '../seals/primitives.ts'

export { all, entries_of, quiet, the_relay } from '../post/harness.ts'

/** Greetings' manifest as its build writes it (EXT-10): what a node installs. */
export const greetings_manifest: unknown = manifest_json

/** Ping pong's manifest as its build writes it (EXT-10, PNG-5). */
export const ping_pong_manifest: unknown = ping_pong_manifest_json

/** The extensions an app of the story may carry (preinstalled, off until the user activates one, PNG-1). */
export type AnExtensionOfTheApp = 'greetings' | 'ping_pong'

/**
 * Each extension an app may carry: its manifest as built, its realm (its
 * side of the boundary, in process, EXT-13) and the effect whose
 * deliveries are its requests (EXT-12), which the story names.
 */
const the_apps_extensions: Readonly<
  Record<
    AnExtensionOfTheApp,
    {
      readonly manifest: unknown
      readonly realm: (host: {
        readonly clock: zz.Clock
        readonly elapsed: zz.Elapsed
        readonly send: boundary.Send
      }) => ReturnType<typeof greetings>
      readonly asks_by: string
    }
  >
> = {
  greetings: {
    manifest: greetings_manifest,
    realm: greetings,
    asks_by: 'business/greetings/effect/ask_for_a_greeting_back',
  },
  ping_pong: {
    manifest: ping_pong_manifest,
    realm: ping_pong,
    asks_by: 'business/pings/effect/ask_for_a_pong',
  },
}

/** An extension composed from its manifest (EXT-4), or the story fails with the composition's message. */
export const composed_from = (manifest: unknown): Composed => {
  const composition = compose_an_extension(the_kernels_offer([]))(manifest)
  if (composition.composition === 'a_fault') throw new Error(composition.message)
  return composition.composed
}

/** Turns of the event loop, each a real timer, until a condition holds: at most about two seconds, else the story fails. */
export const until = async (
  holds: () => boolean | Promise<boolean>,
  what: string,
): Promise<void> => {
  for (let round = 0; round < 1000; round += 1) {
    if (await holds()) return
    await new Promise<void>((done) => {
      setTimeout(done, 2)
    })
  }
  throw new Error(`${what}: it did not come to pass`)
}

/** A real timer of so many milliseconds. */
const a_timer = (milliseconds: number) => (): Promise<void> =>
  new Promise<void>((done) => {
    setTimeout(done, milliseconds)
  })

/** The hash a node's safe draws a mailbox's D with (SEA-4): BLAKE2b-256 of R; the relay's desk hashes R so too. */
export const the_hash_of_a_collect_secret =
  (primitives: Primitives) =>
  (secret: string): Promise<string> =>
    Promise.resolve(the_deposit_address_of(primitives)(secret))

/**
 * The story of the nodes: one relay, whose desk hashes R as the safes do;
 * the nodes' clock at 10:00:00 UTC on Friday 20 November 2026, which a
 * story moves, every wait asked for then over. The fake primitives, unless
 * a story gives others (TST-1).
 */
export const a_story = async (primitives: Primitives = fake_primitives) => {
  const relay = await a_relay({ hash: the_hash_of_a_collect_secret(primitives) })
  const time = a_clock('2026-11-20T10:00:00Z')
  return {
    primitives,
    relay,
    time,
    /** The nodes' clock. */
    clock: time.clock,
    /** The nodes' clock reads this time of Friday 20 November (10:00:15 is `at('10:00:15')`). */
    at: (time_of_day: string): void => {
      time.at(`2026-11-20T${time_of_day}Z`)
    },
    /** The nodes' clock reads this instant, however far (a ticket's 48 hours). */
    at_the_instant: (instant: string): void => {
      time.at(instant)
    },
  }
}

/** The story of the nodes. */
export type Story = Awaited<ReturnType<typeof a_story>>

/**
 * The world's random bytes for a node: each draw new, of the length asked,
 * from a number the story gives each node, so that two nodes never draw
 * the same seed nor the same R (TST-3).
 */
const a_world_of = (primitives: Primitives, phone: number): Primitives => {
  let draws = 0
  return {
    ...primitives,
    random_bytes: (length): Bytes => {
      draws += 1
      return Uint8Array.from({ length }, (_, at) => (phone * 89 + draws * 43 + at * 13) & 255)
    },
  }
}

/** How a node starts: its number for the world's draws, its face's id and name, the extension its app carries (greetings by default), its partition's size. */
export interface Start {
  readonly phone: number
  readonly face_id: string
  readonly name: string
  readonly installed?: 'not_installed' | AnExtensionOfTheApp
  readonly characters?: number
  /**
   * How long a screen of the extension's follows (DOM-3): at once over, as
   * the stories of steps 12–14 read what came back in its partition; or for
   * its time (part 15.2), a wait of a minute or more over once the story's
   * clock has moved past it, a shorter one a real timer of 2 ms.
   */
  readonly screens_follow?: 'at_once' | 'for_their_time'
  /**
   * How the introductions the address book hands to `post` go (BND-10):
   * kept for the story to carry (`carries`, `receives`), as the stories of
   * steps 11–16 make their bonds; or sent through `post` as the phone sends
   * them, a request of the kernel's to the peer's `unknown` (step 17).
   */
  readonly introductions?: 'carried_by_the_story' | 'sent_through_post'
}

/** A ticket as its holder shows it, in a QR or after `#` in a link (BND-8, BND-9). */
export interface Shown {
  readonly key: string
  readonly introduced_as: string
  readonly mailbox: { readonly deposit_address: string; readonly relays: readonly string[] }
  readonly secret: string
}

/** An introduction the address book handed to `post` (`send_my_introduction`): the bond, and the ticket it goes to. */
export interface Letter {
  readonly bond_id: string
  readonly their_ticket: Shown
}

/**
 * An introduction as it reaches the other node (BND-10): at the D of the
 * ticket it presents itself to, with that ticket's secret, the face that
 * signs it, and the mailbox the sender's ticket declares.
 */
export interface Introduction {
  readonly at: string
  readonly secret: string
  readonly their_face: { readonly key: string; readonly introduced_as: string }
  readonly their_mailbox: { readonly deposit_address: string; readonly relays: readonly string[] }
}

/** A mailbox as a bond declares it: its D, at the relay. */
export interface Mailbox {
  readonly deposit_address: string
  readonly relays: readonly string[]
}

/** How a letter a story writes itself is signed (the code is free, F2): by the node's face; unsigned (PER-2); with a signature given, one that need not hold. */
export type Signed = 'by_my_face' | 'unsigned' | { readonly signature: string }

/** The scope of the user's entry (`self`, step 15): the persona and who asks. */
export const the_scope_of_the_user = 'self/the_user'

/** The scope of the entry of an introduction collected (`unknown`), under which the address book takes it, as its stories do. */
export const the_scope_of_an_introduction = 'persona/unknown'

/** A fact as an extension's partition keeps it, as far as a story reads it: its parts' paths. */
const a_fact_kept = z.object({ parts: z.array(z.object({ path: z.string() })) })

/** The effect of greetings whose deliveries are its requests (EXT-12). */
export const ask_for_a_greeting_back = 'business/greetings/effect/ask_for_a_greeting_back'

/**
 * A node of the story, as the oracle starts it: the phone of the `memory`
 * stack over a cell of its own, its first start made (its face, from the
 * app), the extension its app carries installed or not (not active until
 * its user activates it, `activates`). What it gives a story is below.
 */
export const a_node = async (story: Story, start: Start) => {
  const made = cell<PhoneState>({ initial: a_new_phone })
  const world = a_world_of(story.primitives, start.phone)
  const clock = story.clock
  const when = (): zz.RootContext => ({
    now: zz.in_zone(clock.time_zone)(clock.now()),
    time_zone: clock.time_zone,
  })
  const relay: RelayUnderTest = story.relay
  const transport = a_transport(relay, story.time.now)
  // The collect port over the relay's oracle (MBX-6): the `memory` stack's,
  // in process, its R hashed as the relay's desk hashes it.
  const collect: ACollect = the_relay_s_transports(relay, {
    clock,
    hash: the_hash_of_a_collect_secret(story.primitives),
  }).collect
  const installed = start.installed ?? 'greetings'
  const carried = installed === 'not_installed' ? undefined : the_apps_extensions[installed]
  /** The extension the app carries, by its manifest's name: the user's gestures name it. */
  const the_name = installed === 'not_installed' ? 'greetings' : installed

  // What the story keeps or scripts, through the phone's release.
  const letters: Letter[] = []
  const to_the_extension: boundary.a_message_to_an_extension[] = []
  // The partition's next commits as a story scripts them (TST-4): each
  // committed, or refused as a full partition refuses it, so that the
  // extension falls there (EXT-15); then as the partition answers.
  const commits: ('committed' | 'refused')[] = []
  // A node whose code is changed (the code is free, F2): what its entry
  // answers in place of an extension's leaf's event.
  let tampered: ((event: zz.MountedLeafEvent) => zz.MountedLeafEvent) | undefined = undefined
  /** An extension's leaves as the node's code serves them: as mounted, or with their events changed. */
  const as_served =
    (leaves: AnExtensionsLeaves): AnExtensionsLeaves =>
    (context, request) => {
      const change = tampered
      if (change === undefined) return leaves(context, request)
      const events = leaves(context, request)
      return (async function* () {
        for await (const event of events) yield change(event)
      })()
    }
  /**
   * The time that passes in the extension's realm (DOM-3): at once over, or,
   * for a screen that follows for its time, a wait of a minute or more over
   * once the story's clock has moved that far from when it began (the
   * screen's 70 seconds), a shorter one a real timer (an executor's retry).
   */
  const the_screens_wait: zz.Elapsed =
    start.screens_follow === 'for_their_time'
      ? async (milliseconds) => {
          if (milliseconds < 60_000) return a_timer(2)()
          const from = Date.parse(clock.now())
          while (Date.parse(clock.now()) - from < milliseconds) await story.time.elapsed()
        }
      : a_timer(2)

  const node = await phone(made, {
    // The introduction handed to `post`: kept, carried by the story (`carries`),
    // unless the story sends it through `post` as the phone does.
    ...(start.introductions === 'sent_through_post'
      ? {}
      : {
          send_my_introduction: (entry: { readonly payload: Letter }) => {
            letters.push(entry.payload)
            return Promise.resolve({ outcome: 'delivered' as const })
          },
        }),
    the_realm_s_time: the_screens_wait,
    a_while: a_timer(5),
    characters: start.characters ?? 1_000_000,
    the_partition: (_, partition) => ({
      read: partition.read,
      commit: (writes) =>
        commits.shift() === 'refused'
          ? Promise.resolve({ answer: 'refused', why: 'the_partition_is_full' })
          : partition.commit(writes),
    }),
    serves: as_served,
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
    extensions: carried === undefined ? [] : [{ manifest: carried.manifest, realm: carried.realm }],
    relays: [the_relay],
  })
  const { address_book, user } = node
  const post = node.post
  const machine = (): ReturnType<typeof node.machine_of> => node.machine_of(start.face_id)

  // The address book's reads, at the clock's instant.
  const my_faces = async () => entries_of(await all(address_book.my_faces(when(), {})))
  const my_bonds = async () => entries_of(await all(address_book.my_bonds(when(), {})))
  const a_bond = async (bond_id: string) =>
    entries_of(await all(address_book.a_bond(when(), { bond_id })))[0]
  const my_ticket = async (bond_id: string) =>
    entries_of(await all(address_book.my_ticket(when(), { bond_id })))[0]
  const the_bond_at = async (deposit_address: string) =>
    entries_of(await all(address_book.the_bond_at_my_mailbox(when(), { deposit_address })))[0]
  const the_ticket_at = async (deposit_address: string) =>
    entries_of(await all(address_book.the_ticket_at_my_mailbox(when(), { deposit_address })))[0]

  /** The key of a face of the node's, as the address book keeps it (the safe made it). */
  const the_key_of_my_face = async (face_id: string): Promise<string> => {
    const face = (await my_faces()).find((mine) => mine.id === face_id)
    if (face === undefined) throw new Error(`no face ${face_id} made on ${start.name}'s node`)
    return face.public_key
  }

  /**
   * The node runs until it is quiet (DOM-14, DOM-16): the reactions and the
   * four kernel's executors started, what is due delivered, then stopped,
   * as a phone closed. A wait not due yet stays in the outbox, delivered
   * once the clock reaches it and the node runs again.
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
    return {
      ...when(),
      caller: { is: 'the_user' as const },
      version: zz.semver.parse(version),
      operation: { id: zz.operation_id.parse(id), scope: the_scope_of_the_user },
      correlation: zz.correlation.parse(id),
    }
  }
  /** Anna on her phone (PER-3, step 15): a leaf of the kernel's `self` by its path, at 1.0.0, its events. */
  const the_user = (leaf: string, input: unknown, sent: { readonly operation?: string } = {}) =>
    all(node.personas().self(as_the_user('1.0.0', sent.operation), { leaf, input }))

  /** A command of the address book sent as the stories send it (DOM-11): under an operation of the story's, in a scope. */
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

  /** The mailboxes the node collects (BND-11), each with its R from the safe (SEA-4). */
  const my_mailboxes = async () =>
    Promise.all(
      entries_of(await all(address_book.the_mailboxes_i_collect(when(), {}))).map(
        async (mailbox) => {
          const [key] = entries_of(
            await all(node.safe.the_key_of_a_mailbox(when(), { mailbox_key_id: mailbox.id })),
          )
          if (key === undefined) throw new Error(`no key of the mailbox of ${mailbox.id}`)
          return {
            deposit_address: mailbox.my_mailbox.deposit_address,
            collect_secret: key.collect_secret,
            relays: mailbox.my_mailbox.relays,
          }
        },
      ),
    )

  /** The extension hosted, which the story installed. */
  const the_extension = () => {
    const extension = node.the_extension(the_name)
    if (extension === undefined || carried === undefined)
      throw new Error(`no extension is installed on ${start.name}'s node`)
    return extension
  }

  // The first start (BND-8, SEA-3): the user's face, asked for from the app,
  // its keys made by the safe through the reactions.
  await the_user('usecase/make_my_first_face', { face_id: start.face_id, name: start.name })
  await runs()
  const key = await the_key_of_my_face(start.face_id)

  /** An activity, as her screens read it (USR-2). */
  const the_activity_of = async (activity_id: string) =>
    entries_of(await all(user.an_activity(when(), { activity_id })))[0]

  const the_node = {
    name: start.name,
    face_id: start.face_id,
    /** The node's face's key (K_a, K_b, …). */
    key,
    machine_of: node.machine_of,
    /** The ports of `post/requests` over the node's cell, and the log of its facts. */
    requests: post,
    log: node.log,
    /** The address book's ports over the node's cell. */
    address_book,
    /** The office's ports over the node's cell, with the manifests installed now. */
    office: node.office,
    /** The kernel's reads of its office (EXT-6, EXT-7). */
    reads: node.reads,
    /** Auth's lookups as the trees invoke them (`zz.lookup_ports` over `the_acquaintances`, PER-22). */
    acquaintances: node.acquaintances,
    /** The kernel's four persona trees by path (PER-24). */
    personas: node.personas,
    /** The kernel's entry (PER-25), one envelope at a time, as the collector hands it. */
    entry: node.entry,
    /** The port of requests of an extension of this node, by its name and its manifest's touches (EXT-2). */
    port_of_requests: node.port_of_requests,
    the_user,
    /** The context the user's entry gives `self` (step 15), at a version, under an operation. */
    as_the_user,
    runs,
    /** The phone's consumer that loads and unloads the extension as the office says (EXT-15), started: the story stops it. */
    the_extensions_follow_the_office: node.the_extensions_follow_the_office,
    /** One pass of the phone's collector (DOM-17): the first fault of the entry thrown once it is over. */
    collects: node.collects,
    /** The node runs, then its collector passes: what came is served, and its answers deposited. */
    serves: async (): Promise<void> => {
      await runs()
      await node.collects()
    },
    /** What the collector handed the entry, in order. */
    collected: node.collected,
    /** The envelopes the relay keeps at the node's mailboxes, seen or not. */
    at_my_mailboxes: async (): Promise<readonly AnEnvelopeCollected[]> =>
      (
        await Promise.all(
          (await my_mailboxes()).map(async (mailbox) =>
            (await collect(mailbox)).map((deposit) => ({
              came_to: mailbox.deposit_address,
              envelope: deposit.envelope,
            })),
          ),
        )
      ).flat(),
    /** The kernel's trace (EXT-6), in order. */
    traced: node.traced,
    /** The kernel's trace, by why. */
    whys: (): readonly string[] => node.traced.map((entry) => entry.why),
    /** The trees' trace (PER-14), the mounted ports' included, in order. */
    tree_traced: node.tree_traced,
    notices: node.notices,
    storage: node.partitions,
    to_the_extension,
    // The address book, as the user and the introductions use it.
    my_faces,
    my_bonds,
    a_bond,
    my_ticket,
    /** The ticket of a bond as the node shows it (BND-8, BND-9): with its secret, the safe's signature over its D; none for one not ready. */
    shows: (bond_id: string): Promise<Shown | undefined> => node.the_ticket_shown(bond_id),
    /** My mailbox of a bond kept or a ticket ready (BND-4): where its peer writes to me. */
    my_mailbox_of: async (bond_id: string): Promise<Mailbox> => {
      const mailbox = (await a_bond(bond_id))?.my_mailbox ?? (await my_ticket(bond_id))?.my_mailbox
      if (mailbox === undefined) throw new Error(`no mailbox of ${bond_id} on ${start.name}'s node`)
      return mailbox
    },
    /** Their side of a bond kept (BND-4): their key, and the mailbox they declared, where I write to them. */
    their_side_of: async (
      bond_id: string,
    ): Promise<{ readonly key: string; readonly mailbox: Mailbox }> => {
      const card = await a_bond(bond_id)
      if (card === undefined) throw new Error(`no bond ${bond_id} kept on ${start.name}'s node`)
      return { key: card.their_face.key, mailbox: card.their_mailbox }
    },
    /** The user prepares a ticket for a bond to be, on the relay (BND-8); ready once the node ran. */
    prepares_a_ticket: async (bond_id: string, sent?: string) => {
      const input = { bond_id, face_id: start.face_id, relays: [the_relay] }
      const events = await all(
        address_book.prepare_a_ticket(
          sent_as(
            'bonds/address_book/usecase/prepare_a_ticket',
            input,
            the_scope_of_the_user,
          )(sent),
          input,
        ),
      )
      await runs()
      return events
    },
    /** The user opens their ticket, presenting her ticket of that bond (BND-10): her introduction handed to `post` once the node ran. */
    opens_their_ticket: async (
      input: { readonly bond_id: string; readonly their_ticket: Shown; readonly name: string },
      sent?: string,
    ) => {
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
      const events = await all(
        address_book.open_their_ticket(
          sent_as(
            'bonds/address_book/usecase/open_their_ticket',
            given,
            the_scope_of_the_user,
          )(sent),
          given,
        ),
      )
      await runs()
      return events
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
      }
    },
    /**
     * An introduction collected at a mailbox of the node's, taken by the
     * address book as its stories take it (PER-11): the bond of the ticket
     * ready at that D, or the bond kept there (the QR crossed); none, nothing
     * taken.
     */
    receives: async (introduction: Introduction, sent?: string) => {
      const bond_id =
        (await the_ticket_at(introduction.at))?.id ?? (await the_bond_at(introduction.at))?.id
      if (bond_id === undefined) return undefined
      const given = {
        bond_id,
        secret: introduction.secret,
        their_face: { ...introduction.their_face },
        their_mailbox: {
          deposit_address: introduction.their_mailbox.deposit_address,
          relays: [...introduction.their_mailbox.relays],
        },
      }
      const events = await all(
        address_book.accept_their_introduction(
          sent_as(
            'bonds/address_book/usecase/accept_their_introduction',
            given,
            the_scope_of_an_introduction,
          )(sent),
          given,
        ),
      )
      await runs()
      return events
    },
    // The user's gestures from the app, on `self` (PER-24, step 15).
    /** The user activates the extension, accepting its manifest as shown, and the kernel loads it (EXT-7, EXT-15). */
    activates: async (): Promise<Loaded> => {
      await the_user('usecase/activate_an_extension', { manifest: the_node.shown() })
      return the_extension().hosted.load()
    },
    /** The user deactivates the extension, and the kernel unloads it (EXT-7, EXT-15). */
    deactivates: async (): Promise<void> => {
      await the_user('usecase/deactivate_an_extension', { extension: the_name })
      await the_extension().hosted.unload()
    },
    /** The user withdraws the extension's offer from a bond (EXT-7). */
    withdraws_the_offer_from: (bond_id: string) =>
      the_user('usecase/withdraw_the_offer_from_a_bond', { extension: the_name, bond_id }),
    /** The user offers the extension to a bond again (EXT-7). */
    offers_again_to: (bond_id: string) =>
      the_user('usecase/offer_an_extension_to_a_bond', { extension: the_name, bond_id }),
    /** The user renames a bond (BND-6). */
    renames: (bond_id: string, name: string) =>
      the_user('usecase/rename_a_bond', { bond_id, name }),
    /** The user removes a bond from her address book (BND-6). */
    removes_a_bond: (bond_id: string) => the_user('usecase/remove_a_bond', { bond_id }),
    /** The node starts the extension, if active (EXT-15): the phone started. */
    starts: (): Promise<Loaded> => the_extension().hosted.load(),
    /** The phone closes: the extension stopped and unloaded (EXT-15), what it keeps in its partition. */
    closes: (): Promise<void> => the_extension().hosted.unload(),
    /**
     * The user taps "Saluta" on a bond: greetings' leaf on `self`, through
     * its mounted port, as the user's entry will invoke it (step 15); the
     * greeting its event names.
     */
    greets: async (bond_id: string): Promise<string> => {
      const events = await all(
        the_extension().on_self(as_the_user('1.0.0'), {
          leaf: 'usecase/greet_a_bond',
          input: { bond: bond_id },
        }),
      )
      const greeting_id: unknown = Reflect.get(
        Object(Reflect.get(Object(events[0]), 'payload')),
        'greeting_id',
      )
      if (typeof greeting_id !== 'string') throw new Error(`no greeting: ${JSON.stringify(events)}`)
      return greeting_id
    },
    /** The requests the node's post recorded as sent, by their identity. */
    sent: async (): Promise<readonly string[]> =>
      (await the_node.recorded()).flatMap((fact) =>
        fact.parts
          .filter((part) => part.path === 'post/requests/fact/a_request_has_been_sent')
          .map((part) =>
            String(Reflect.get(Object(Reflect.get(Object(part.payload), 'sent_request')), 'id')),
          ),
      ),
    /** The node's code changed (the code is free, F2): its entry answers this in place of an extension's leaf's event. */
    tampers_with_its_responses: (
      change: (event: zz.MountedLeafEvent) => zz.MountedLeafEvent,
    ): void => {
      tampered = change
    },
    /** The identity of a request of the extension's (F7, PST-2), as this node's kernel composes it. */
    the_request_of: (
      id: string,
      effect: string = carried?.asks_by ?? ask_for_a_greeting_back,
    ): string =>
      the_identity_of_a_request(machine())({
        of: 'an_extension',
        extension: the_name,
        effect,
        id,
      }),
    /** The identity of a request of the kernel's (F7, PST-2), as this node's kernel composes it: the question of the office's, or a story's letter. */
    the_kernels_request_of: (
      id: string,
      effect = 'extensions/activations/effect/ask_for_the_extensions_in_common',
    ): string => the_identity_of_a_request(machine())({ of: 'the_kernel', effect, id }),
    /** The identity of the response to a request (PST-2). */
    the_response_to: (request_id: string): string =>
      the_identity_of_the_response_to(machine())(request_id),
    /** The post sends a request from the node's face (PST-5), as the port of requests does: under its identity, in the port's scope. */
    sends_a_request: (
      input: {
        readonly request_id: string
        readonly to: { readonly key: string; readonly mailbox: Mailbox }
        readonly invokes: post_value.invocation
        readonly input: unknown
        readonly waits?: number
      },
      sent: { readonly operation?: string } = {},
    ) => {
      const given = {
        request_id: input.request_id,
        from: { face_id: start.face_id, key },
        to: {
          key: input.to.key,
          mailbox: {
            deposit_address: input.to.mailbox.deposit_address,
            relays: [...input.to.mailbox.relays],
          },
        },
        invokes: input.invokes,
        input: input.input,
        waits: input.waits ?? 60,
      }
      return all(
        post.send_a_request(
          sent_as(
            'post/requests/usecase/send_a_request',
            given,
            'the_port_of_requests',
          )(sent.operation ?? input.request_id),
          given,
        ),
      )
    },
    /** The answer the post keeps under a request's identity (PST-8). */
    the_answer_to: async (request_id: string) =>
      entries_of(await all(post.the_answer_to_a_request(when(), { request_id }))),
    /**
     * A request letter from the node's face to a mailbox, as a story writes
     * one itself (PST-1): its identity, the mailbox it is for, the clock's
     * time, what it invokes and its input.
     */
    a_request: (letter: {
      readonly identity: string
      readonly to: string
      readonly invokes: post_value.invocation
      readonly input: unknown
    }): post_value.letter => ({
      is: 'a_request',
      schema: 1,
      identity: letter.identity,
      from: key,
      to: letter.to,
      declared_at: zz.date_time.parse(clock.now()),
      invokes: letter.invokes,
      input: letter.input,
    }),
    /** A response letter from the node's face to a mailbox (PST-1), its identity the one of the response to the request it answers. */
    a_response: (letter: {
      readonly answers: string
      readonly to: string
      readonly event: unknown
    }): post_value.letter => ({
      is: 'a_response',
      schema: 1,
      identity: the_identity_of_the_response_to(machine())(letter.answers),
      from: key,
      to: letter.to,
      declared_at: zz.date_time.parse(clock.now()),
      answers: letter.answers,
      event: letter.event,
    }),
    /**
     * A letter in an envelope for a key, as a story writes it (PST-1, PST-3,
     * PER-2): signed by the node's face, unsigned, or with a signature given;
     * the text the relay keeps.
     */
    an_envelope_of: async (
      letter: post_value.letter,
      for_key: string,
      signed: Signed = 'by_my_face',
    ): Promise<string> => {
      if (signed === 'by_my_face') {
        const sealed = await a_letter_in_an_envelope(machine())(letter, for_key)
        if (sealed.outcome !== 'sealed') throw new Error('the letter was not sealed')
        return sealed.envelope
      }
      const signed_letter =
        signed === 'unsigned' ? { letter } : { letter, signature: signed.signature }
      const sealing = sealed_for(world)(for_key, content_of(signed_letter))
      if (sealing.outcome !== 'sealed')
        throw new Error('the story seals for a key that takes no seal')
      return content_of({ format: 1, sealed: sealing.sealed_content })
    },
    /** The node's face's signature over a letter (PST-1): what a story puts on a letter it writes. */
    signs: (letter: post_value.letter): Promise<string> =>
      machine().sign(the_content_a_letter_signs(letter)),
    /** A text deposited at a D through the node's transport (TST-4: its faults), under an operation of its own: what the relay answered. */
    deposits: (deposit_address: string, envelope: string, operation?: string): Promise<Deposited> =>
      transport.port.deposit({
        operation:
          operation ?? the_operation_of_a_deposit(machine())(content_of(envelope), deposit_address),
        deposit_address,
        relays: [the_relay],
        envelope,
      }),
    /** The next deposits of the node's transport meet these faults (TST-4). */
    will: (...faults: readonly Fault[]): void => {
      transport.will(...faults)
    },
    /** Every deposit the node's transport carried, in order. */
    carried: transport.carried,
    /** Every fact the cell recorded, in order, as its log gives them (DOM-17). */
    recorded: async (): Promise<readonly zz.StoredEnvelope[]> => {
      const kept = new Map<zz.position, zz.StoredEnvelope>()
      for await (const each of node.log(undefined)) {
        if (each.event !== 'fact') break
        kept.set(each.position, each.fact)
      }
      return [...kept.values()]
    },
    /** The entries the executors hold, and the parts the reactions hold: their dead letters. */
    held: () => [...made.held(), ...made.held_parts()],
    // The user's offices (USR-1..USR-8, part 15.2), as her screens will use them (step 16).
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
      sent?: string,
    ): Promise<readonly unknown[]> => {
      const input = { activity_id, what }
      return all(
        user.ask_for_an_activity(
          sent_as(
            'user/activities/usecase/ask_for_an_activity',
            input,
            the_scope_of_the_user,
          )(sent),
          input,
        ),
      )
    },
    /** An activity, as her screens read it. */
    the_activity: the_activity_of,
    /** The activities in progress, in the order she asked them. */
    the_activities_in_progress: async () =>
      entries_of(await all(user.the_activities_in_progress(when(), {}))),
    /** How an activity ended, once it has (at most about two seconds, else the story fails). */
    how_it_ended: async (activity_id: string): Promise<activities_value.how_it_ended> => {
      const the_stage = async () => (await the_activity_of(activity_id))?.stage
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
    /** The letters held on the node, as she is told them (USR-8). */
    held_letters: (): readonly user_value.a_held_letter[] =>
      the_held_letters({ entries: made.held(), parts: made.held_parts(), notices: node.notices }),
    /** What happened without a fact, as she is told it (USR-8): the kernel's trace, then the trees'. */
    what_happened: (): readonly user_value.what_happened_without_a_fact[] => [
      ...node.traced.map(what_happened_in_the_kernel),
      ...node.tree_traced.flatMap((entry) => what_happened_in_a_tree(entry) ?? []),
    ],
    // The extension, hosted (EXT-15).
    /** The extension hosted, which the story installed. */
    the_hosted: (): Hosted => the_extension().hosted,
    /** The extension's leaves on `known`, below the node of `known`, as the entry invokes them. */
    on_known: () => the_extension().on_known,
    /** The extension's leaves on `self`, below the node of `self`, as the user's entry will invoke them. */
    on_self: () => the_extension().on_self,
    /** The extension's manifest in the office's words, as the user is shown it (EXT-7). */
    shown: () => the_manifest_to_accept(the_extension().composed.manifest),
    /**
     * An update of the app with this manifest of its extension (EXT-7,
     * EXT-10): the phone's update, the extension unloaded, composed again,
     * the node wired again over the office with the manifest installed now
     * (the same cell, the same partition), then loaded, as a node starts:
     * what its load came to.
     */
    updated_to: async (manifest: unknown) => {
      if (carried === undefined)
        throw new Error(`no extension is installed on ${start.name}'s node`)
      await node.updated_to([{ manifest, realm: carried.realm }])
      return the_extension().hosted.load()
    },
    /** A greeting as greetings keeps it in its partition (`state/greeting/<id>`). */
    the_greeting: (greeting_id: string): unknown =>
      node.partitions.kept('greetings').get(`state/greeting/${greeting_id}`),
    /** Whether a greeting is closed, as its partition keeps it. */
    is_closed: (greeting_id: string): boolean =>
      JSON.stringify(
        node.partitions.kept('greetings').get(`state/greeting/${greeting_id}`) ?? null,
      ).includes('"stage":"closed"'),
    /** The greetings back greetings sent, as its partition keeps them. */
    greetings_back: (): readonly unknown[] =>
      [...node.partitions.kept('greetings')]
        .filter(([at]) => at.startsWith('state/greeting_back/'))
        .map(([, value]) => value),
    /** The facts greetings recorded in its partition, in order, by the last segment of each part's path. */
    facts_of_greetings: (): readonly string[] =>
      [...node.partitions.kept('greetings')]
        .filter(([at]) => at.startsWith('fact/'))
        .toSorted(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .flatMap(([, value]) =>
          a_fact_kept.parse(value).parts.map((part) => part.path.split('/').at(-1) ?? ''),
        ),
    // Ping pong (step 14), where the app carries it.
    /**
     * The user taps "Ping" on a bond (PNG-4): ping pong's leaf on `self`,
     * through its mounted port, as the user's entry will invoke it (step
     * 15); the ping its first event names. Her screen stops following at
     * once on the oracle (its realm's 2 ms): what came back is read in the
     * partition.
     */
    pings: async (bond_id: string, sent: { readonly operation?: string } = {}): Promise<string> => {
      const events = await all(
        the_extension().on_self(as_the_user('1.0.0', sent.operation), {
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
    /** A ping as ping pong keeps it in its partition (`state/ping/<id>`). */
    the_ping: (ping_id: string): unknown =>
      node.partitions.kept('ping_pong').get(`state/ping/${ping_id}`),
    /** Whether a ping is closed, as its partition keeps it. */
    the_ping_is_closed: (ping_id: string): boolean =>
      JSON.stringify(
        node.partitions.kept('ping_pong').get(`state/ping/${ping_id}`) ?? null,
      ).includes('"stage":"closed"'),
    /** The pongs ping pong gave back, as its partition keeps them. */
    pongs: (): readonly unknown[] =>
      [...node.partitions.kept('ping_pong')]
        .filter(([at]) => at.startsWith('state/pong/'))
        .map(([, value]) => value),
    /** The facts ping pong recorded in its partition, in order, by the last segment of each part's path. */
    facts_of_ping_pong: (): readonly string[] =>
      [...node.partitions.kept('ping_pong')]
        .filter(([at]) => at.startsWith('fact/'))
        .toSorted(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .flatMap(([, value]) =>
          a_fact_kept.parse(value).parts.map((part) => part.path.split('/').at(-1) ?? ''),
        ),
    /** The next commits of the extension's partition, as the story scripts them (TST-4): `refused` makes it fall. */
    its_partition_will: (...next: readonly ('committed' | 'refused')[]): void => {
      commits.push(...next)
    },
    /** The entries queued for an effect, by their ids, in order (DOM-13). */
    queued: (effect: string): readonly string[] =>
      made
        .entries()
        .filter((entry) => entry.effect === effect)
        .map((entry) => entry.id),
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
    /** The dead letters the extension told the kernel (EXT-2), by their names. */
    dead_letters: (): readonly string[] =>
      node.notices.flatMap((notice) =>
        notice.notice.message === 'dead_letter' ? [notice.notice.letter] : [],
      ),
  }
  return the_node
}

/** A node of the story. */
export type NodeUnderTest = Awaited<ReturnType<typeof a_node>>

/** The ticket a node shows, which the story needs. */
export const shown = async (node: NodeUnderTest, bond_id: string): Promise<Shown> => {
  const ticket = await node.shows(bond_id)
  if (ticket === undefined) throw new Error(`no ticket ${bond_id} on ${node.name}'s node to show`)
  return ticket
}

/** The last introduction a node handed to `post`, carried to another node and taken there (BND-10). */
export const carried = async (from: NodeUnderTest, to: NodeUnderTest) => {
  const letter = from.letters().at(-1)
  if (letter === undefined) throw new Error(`no introduction of ${from.name}'s`)
  return to.receives(await from.carries(letter))
}

/** A side of a bond to be: the node, the bond's id there, and the name its user gives the other. */
export interface ASide {
  readonly node: NodeUnderTest
  readonly bond_id: string
  readonly name: string
}

/**
 * A bond made at a distance (BND-10), as the address book's stories make
 * it: the holder's ticket sent in a link; the opener opens it presenting a
 * ticket of its own; its introduction carried to the holder and accepted
 * there. The holder's bond takes the name the opener's face is introduced
 * as; the opener's, the name given. One mailbox each, the holder's ticket's
 * and the opener's.
 */
export const bonded_by_a_link = async (holder: ASide, opener: ASide): Promise<void> => {
  await holder.node.prepares_a_ticket(holder.bond_id)
  await opener.node.prepares_a_ticket(opener.bond_id)
  await opener.node.opens_their_ticket({
    bond_id: opener.bond_id,
    their_ticket: await shown(holder.node, holder.bond_id),
    name: opener.name,
  })
  await carried(opener.node, holder.node)
}

/**
 * A bond made in person (BND-11), the QR crossed: each node prepares a
 * ticket and opens the other's presenting it; each introduction carried to
 * the other, unless the story keeps the second's back (`the_second`: the
 * second side's introduction not carried yet).
 */
export const bonded_in_person = async (
  first: ASide,
  second: ASide,
  carried_back: 'both' | 'not_the_second_s' = 'both',
): Promise<void> => {
  await first.node.prepares_a_ticket(first.bond_id)
  await second.node.prepares_a_ticket(second.bond_id)
  const first_s = await shown(first.node, first.bond_id)
  const second_s = await shown(second.node, second.bond_id)
  await first.node.opens_their_ticket({
    bond_id: first.bond_id,
    their_ticket: second_s,
    name: first.name,
  })
  await second.node.opens_their_ticket({
    bond_id: second.bond_id,
    their_ticket: first_s,
    name: second.name,
  })
  await carried(first.node, second.node)
  if (carried_back === 'both') await carried(second.node, first.node)
}

/** A key of a face no node of the story ever made (K_e): the public key of a private key of the story's. */
export const a_key_never_seen = (primitives: Primitives, seed: number): string =>
  base64url_of(primitives.public_key_of(Uint8Array.from({ length: 32 }, () => seed & 255)))
