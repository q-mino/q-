// The node of q-'s oracle as the kernel runs it (TST-2, TST-3, MBX-7; PER-22,
// PER-24, PER-25, EXT-6; part 13.3): one cell per phone holding the safe's
// state (`seals`), the requests' (`post`), the address book's (`bonds`) and
// the office of the extensions' (`extensions`), each domain's ports over it
// (`seen_by`); the reactions of `reaction/` (the first face, the ticket) and
// the executors of the safe, the post, the address book and the office (its
// question of the extensions in common delivered over the kernel's own port
// of requests, EXT-8); the story's clock. Its face is made at its first start, from the app (`self`);
// its bonds are made for real, by tickets and introductions through the
// address book's own commands, as the address book's stories make them, so
// that keys, secrets and one mailbox per bond are the safe's. A collector
// reads every mailbox the node collects (`the_mailboxes_i_collect`) at the
// relay, with its collect secret R from the safe, and hands each deposit
// not seen yet to the kernel's entry (`the_kernels_entry`), wired with the
// four persona trees by path (`zz.tree_ports_by_path`) over the address
// book's and the office's use cases and auth's lookups (`the_acquaintances`
// by `zz.lookup_ports`); greetings, the test extension, hosted in process,
// its leaves mounted on `self` and below q-'s node of `known`, its requests
// sent through the kernel's port of requests. `self` is invoked as the
// user's entry will (step 15). The relay's desk hashes R as the safe draws D
// (SEA-4), so that the safe's mailboxes are the relay's. Every wait is
// bounded and turns on a real timer (A, 20 Nov 2026).
//
// Rejected: two cells side by side, as part 12.4 had them (a phone of the
// post's harness and an office over an address book written as state): two
// safes, so the face that signs letters and the address book's face would
// differ, and a ticket's secret is the address book's face's signature
// (BND-9).

import {
  a_hosted_extension,
  compose_an_extension,
  the_acquaintances,
  the_kernels_entry,
  the_kernels_offer,
  the_kernels_reads,
  the_delivery_of_the_extensions_in_common,
  the_kernels_port_of_requests,
  the_manifest_to_accept,
  the_port_of_requests,
  type ABondToAnswerOn,
  type ABondToAskOn,
  type ANotice,
  type AnEnvelopeCollected,
  type Composed,
  type Hosted,
  type Loaded,
  type TheKernelsTraced,
  type Transport,
} from '@q-mino/adapters-common'
import * as boundary from '@q-mino/boundary'
import { registry as acquaintances_registry } from '@q-mino/domains/auth/acquaintances/_registry.ts'
import {
  the_bond_of_a_face_at_my_mailbox,
  the_extensions_offered_to_the_bond_of_a_key,
  the_ticket_a_face_presents_at_my_mailbox,
} from '@q-mino/domains/auth/acquaintances/_lookup.ts'
import { bond_of_a_face } from '@q-mino/domains/auth/acquaintances/_value.ts'
import { majors as address_book_majors } from '@q-mino/domains/bonds/address_book/_majors.ts'
import { registry as address_book_registry } from '@q-mino/domains/bonds/address_book/_registry.ts'
import { let_a_ticket_expire } from '@q-mino/domains/bonds/address_book/_usecase.ts'
import { the_content_a_ticket_s_secret_signs } from '@q-mino/domains/bonds/address_book/_dsl.ts'
import { majors as activations_majors } from '@q-mino/domains/extensions/activations/_majors.ts'
import { registry as activations_registry } from '@q-mino/domains/extensions/activations/_registry.ts'
import { learn_the_extensions_in_common } from '@q-mino/domains/extensions/activations/_usecase.ts'
import * as zz from '@q-mino/domains/library'
import { persona } from '@q-mino/domains/persona/_node.ts'
import { registry as persona_registry } from '@q-mino/domains/persona/_registry.ts'
import { majors as anonymous_majors } from '@q-mino/domains/persona/anonymous/_majors.ts'
import { registry as anonymous_registry } from '@q-mino/domains/persona/anonymous/_registry.ts'
import { majors as known_majors } from '@q-mino/domains/persona/known/_majors.ts'
import { registry as known_registry } from '@q-mino/domains/persona/known/_registry.ts'
import { the_extensions_in_common } from '@q-mino/domains/persona/known/_usecase.ts'
import { majors as self_majors } from '@q-mino/domains/persona/self/_majors.ts'
import { registry as self_registry } from '@q-mino/domains/persona/self/_registry.ts'
import * as self_usecase from '@q-mino/domains/persona/self/_usecase.ts'
import { majors as unknown_majors } from '@q-mino/domains/persona/unknown/_majors.ts'
import { registry as unknown_registry } from '@q-mino/domains/persona/unknown/_registry.ts'
import { introduce_myself } from '@q-mino/domains/persona/unknown/_usecase.ts'
import {
  a_letter_in_an_envelope,
  content_of,
  the_content_a_letter_signs,
  the_identity_of_a_request,
  the_identity_of_the_response_to,
  the_operation_of_a_deposit,
  type Deposited,
  type Machine,
} from '@q-mino/domains/post/_dsl.ts'
import type * as post_value from '@q-mino/domains/post/_value.ts'
import { majors as requests_majors } from '@q-mino/domains/post/requests/_majors.ts'
import { registry as requests_registry } from '@q-mino/domains/post/requests/_registry.ts'
import {
  close_a_request_with_no_response,
  send_a_request_again,
} from '@q-mino/domains/post/requests/_usecase.ts'
import { the_deposit_of_a_letter } from '@q-mino/domains/post/requests/_dsl.ts'
import { registry as first_face_registry } from '@q-mino/domains/reaction/first_face/_registry.ts'
import { registry as ticket_registry } from '@q-mino/domains/reaction/ticket/_registry.ts'
import {
  base64url_of,
  bytes_of,
  sealed_for,
  the_deposit_address_of,
  the_signature_holds,
  type Bytes,
  type Primitives,
} from '@q-mino/domains/seals/safe/_dsl.ts'
import { majors as safe_majors } from '@q-mino/domains/seals/safe/_majors.ts'
import { registry as safe_registry } from '@q-mino/domains/seals/safe/_registry.ts'
import {
  keep_a_mailbox_key,
  keep_a_new_seed_and_its_face,
} from '@q-mino/domains/seals/safe/_usecase.ts'
import { greetings } from '@q-mino/greetings'
import manifest_json from '@q-mino/greetings/manifest.json' with { type: 'json' }
import { z } from 'zod'
import {
  bonds_ports,
  cell,
  extensions_ports,
  in_process,
  log,
  no_activation,
  no_bond,
  no_request,
  no_secret,
  partitions,
  post_ports,
  seals_ports,
  seen_by,
  type BondsState,
  type ExtensionsState,
  type PostState,
  type SealsState,
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
import { a_relay, showing, type RelayUnderTest } from '../relay/harness.ts'
import { the_safe_s_machine } from '../seals/harness.ts'
import { fake_primitives } from '../seals/primitives.ts'

export { all, entries_of, quiet, the_relay } from '../post/harness.ts'

/** Greetings' manifest as its build writes it (EXT-10): what a node installs. */
export const greetings_manifest: unknown = manifest_json

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
  const time = a_clock('2026-11-20T10:00:00.000Z')
  return {
    primitives,
    relay,
    time,
    /** The nodes' clock. */
    clock: time.clock,
    /** The nodes' clock reads this time of Friday 20 November (10:00:15 is `at('10:00:15')`). */
    at: (time_of_day: string): void => {
      time.at(`2026-11-20T${time_of_day}.000Z`)
    },
    /** The nodes' clock reads this instant, however far (a ticket's 48 hours). */
    at_the_instant: (instant: string): void => {
      time.at(instant)
    },
  }
}

/** The story of the nodes. */
export type Story = Awaited<ReturnType<typeof a_story>>

/** A node's cell: the safe, the requests, the address book and the office, one cell (MBX-7). */
type NodeState = SealsState & PostState & BondsState & ExtensionsState

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

/** How a node starts: its number for the world's draws, its face's id and name, greetings, its partition's size. */
export interface Start {
  readonly phone: number
  readonly face_id: string
  readonly name: string
  readonly greetings?: 'not_installed' | 'installed'
  readonly characters?: number
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
 * signs it, the mailbox the sender's ticket declares, and the time its
 * letter declares, the sender's clock when `post` wrote it (PER-13).
 */
export interface Introduction {
  readonly at: string
  readonly secret: string
  readonly their_face: { readonly key: string; readonly introduced_as: string }
  readonly their_mailbox: { readonly deposit_address: string; readonly relays: readonly string[] }
  readonly declared_at: string
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

/** What the node of `known` gives a mounted folder, as the hosting reads it (PER-24): the bond, whole. */
const the_context_on_known = z.object({ bond: bond_of_a_face })

/** A fact as greetings' partition keeps it, as far as a story reads it: its parts' paths. */
const a_fact_kept = z.object({ parts: z.array(z.object({ path: z.string() })) })

/** The effect of greetings whose deliveries are its requests (EXT-12). */
export const ask_for_a_greeting_back = 'business/greetings/effect/ask_for_a_greeting_back'

/**
 * A node of the story, as the oracle starts it: its first start made (its
 * face, from the app), greetings installed or not (not active until its
 * user activates it, `activates`). What it gives a story is below.
 */
export const a_node = async (story: Story, start: Start) => {
  const made = cell<NodeState>({
    initial: { ...no_secret, ...no_request, ...no_bond, ...no_activation },
  })
  const world = a_world_of(story.primitives, start.phone)
  const versions = await zz.versions([
    safe_majors,
    requests_majors,
    address_book_majors,
    activations_majors,
  ])({ stored: made.stored_versions })
  const safe = seals_ports(seen_by<SealsState, NodeState>(made), world)(versions)
  const post = post_ports(seen_by<PostState, NodeState>(made))(versions)
  const address_book = bonds_ports(seen_by<BondsState, NodeState>(made), world)(versions)
  const clock = story.clock
  const when = (): zz.RootContext => ({
    now: clock.now(),
    time_zone: clock.time_zone,
  })
  const facts = log(made)
  const relay: RelayUnderTest = story.relay
  const transport = a_transport(relay, story.time.now)

  // The office over the manifests installed (EXT-7): the composition's; an
  // update of the app is the same cell with another composition.
  let composed: Composed | undefined =
    (start.greetings ?? 'installed') === 'not_installed'
      ? undefined
      : composed_from(greetings_manifest)
  const the_office_of = (installed: Composed | undefined) =>
    extensions_ports(
      seen_by<ExtensionsState & BondsState, NodeState>(made),
      installed === undefined ? [] : [the_manifest_to_accept(installed.manifest)],
    )(versions)
  let office = the_office_of(composed)

  /**
   * The post's machine of a face of the node (PST-3, PST-10): to sign and to
   * open, the safe's reads; to seal and to check, the safe's pure functions;
   * the hash, BLAKE2b-256. A face the safe has not made signs nothing: a
   * fault of the wiring.
   */
  const machine_of = (face_id: string): Machine => ({
    sign: async (content) => {
      const [face] = entries_of(
        await all(safe.a_content_signed_by_a_face(when(), { face_id, content })),
      )
      if (face === undefined) throw new Error(`no face ${face_id} to sign`)
      return face.signature
    },
    seal_for: sealed_for(world),
    open: async (sealed_content) => {
      const [face] = entries_of(
        await all(safe.a_sealed_content_opened_by_a_face(when(), { face_id, sealed_content })),
      )
      if (face === undefined) throw new Error(`no face ${face_id} to open`)
      return face.opened
    },
    signature_holds: the_signature_holds(world),
    hash: (content) => base64url_of(world.blake2b_256(bytes_of(content))),
  })
  const machine = machine_of(start.face_id)

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
   * The bond a request names, as the ports of requests read it (PST-5), an
   * extension's by the boundary's bond, the kernel's by the address book's
   * id: kept, with my face that signs and theirs with the mailbox they
   * declared; gone otherwise.
   */
  const the_bond = async (bond_id: string): Promise<ABondToAskOn> => {
    const card = await a_bond(bond_id)
    if (card === undefined) return { bond: 'gone' }
    return {
      bond: 'kept',
      from: { face_id: card.my_face_id, key: await the_key_of_my_face(card.my_face_id) },
      to: { key: card.their_face.key, mailbox: card.their_mailbox },
    }
  }

  // The executors (DOM-14) and the reactions' consumers (DOM-16).
  const letters: Letter[] = []
  const declared = new Map<Letter, string>()
  const the_safe_s_executor = zz.effect_executor({
    registry: safe_registry,
    versions,
    returns: { keep_a_new_seed_and_its_face, keep_a_mailbox_key },
  })(the_safe_s_machine(world))
  const the_post_s_executor = zz.effect_executor({
    registry: requests_registry,
    versions,
    returns: { send_a_request_again, close_a_request_with_no_response },
  })({
    'post/requests/effect/deposit_a_letter': the_deposit_of_a_letter(machine_of, transport.port),
    'post/requests/effect/wait_to_send_again': zz.returns_the_payload,
    'post/requests/effect/wait_for_the_response': zz.returns_the_payload,
  })
  const the_address_book_s_executor = zz.effect_executor({
    registry: address_book_registry,
    versions,
    returns: { let_a_ticket_expire },
  })({
    'bonds/address_book/effect/wait_until_the_ticket_expires': zz.returns_the_payload,
    // The introduction handed to `post`: kept, carried by the story (`carries`).
    'bonds/address_book/effect/send_my_introduction': (entry) => {
      letters.push(entry.payload)
      declared.set(entry.payload, zz.date_time.parse(clock.now()))
      return Promise.resolve({ outcome: 'delivered' })
    },
  })
  /** The kernel's own port of requests (F7, EXT-8): the node's post and machine, the address book's bond by its id, the kernel's trace. */
  const the_kernels_port = the_kernels_port_of_requests({
    clock,
    machine,
    post: {
      send_a_request: post.send_a_request,
      the_answer_to_a_request: post.the_answer_to_a_request,
      log: facts,
    },
    the_bond,
    trace: (entry) => {
      trace(entry)
    },
  })
  const the_office_s_executor = zz.effect_executor({
    registry: activations_registry,
    versions,
    returns: { learn_the_extensions_in_common },
  })({
    // The question's delivery (EXT-8), over the kernel's own port of requests.
    'extensions/activations/effect/ask_for_the_extensions_in_common':
      the_delivery_of_the_extensions_in_common(the_kernels_port),
  })
  const the_first_face = zz.reaction_consumers({ registry: first_face_registry, versions })({
    'reaction/first_face/reaction/the_safe_makes_the_first_face': {
      log: facts,
      invokes: safe.make_a_face_from_a_new_seed,
    },
    'reaction/first_face/reaction/the_address_book_keeps_the_key_of_the_face': {
      log: facts,
      invokes: address_book.keep_the_key_of_a_face,
    },
  })
  const the_ticket = zz.reaction_consumers({ registry: ticket_registry, versions })({
    'reaction/ticket/reaction/the_safe_draws_the_key_of_the_ticket_s_mailbox': {
      log: facts,
      invokes: safe.draw_a_mailbox_key,
    },
    'reaction/ticket/reaction/the_ticket_gets_its_mailbox': {
      log: facts,
      invokes: address_book.keep_the_mailbox_of_a_ticket,
    },
  })

  /**
   * The node runs until it is quiet (DOM-14, DOM-16): the reactions and the
   * four executors started, what is due delivered, then stopped, as a phone
   * closed. A wait not due yet stays in the outbox, delivered once the clock
   * reaches it and the node runs again.
   */
  const runs = async (): Promise<void> => {
    const ports = {
      outbox: made.outbox,
      state: made.executor,
      clock,
      elapsed: story.time.elapsed,
    }
    const consumers = { state: made.reactions, clock }
    const running = [
      the_first_face(consumers),
      the_ticket(consumers),
      the_safe_s_executor({ ...ports, returns: safe }),
      the_post_s_executor({ ...ports, returns: post }),
      the_address_book_s_executor({ ...ports, returns: address_book }),
      the_office_s_executor({ ...ports, returns: office }),
    ]
    await quiet()
    for (const each of running) await each.stop()
  }

  /**
   * The bond a response goes on (PER-25, 5): the bond kept at the mailbox
   * the request came to with that key; else a bond kept with that key (a
   * known key outside its bond reads `not_found` on its own bond); else
   * none. From my face of the bond, to their key at the mailbox they
   * declared.
   */
  const the_bond_to_answer_on = async (asked: {
    readonly face: string
    readonly mailbox: string
  }): Promise<ABondToAnswerOn> => {
    const here = await the_bond_at(asked.mailbox)
    const bond_id =
      here?.their_face.key === asked.face
        ? here.id
        : (await my_bonds()).find((bond) => bond.their_face.key === asked.face)?.id
    const card = bond_id === undefined ? undefined : await a_bond(bond_id)
    if (card === undefined) return { bond: 'none' }
    return {
      bond: 'kept',
      from: { face_id: card.my_face_id, key: await the_key_of_my_face(card.my_face_id) },
      to: { key: card.their_face.key, mailbox: card.their_mailbox },
    }
  }

  /** The face of mine at a mailbox (PST-4): the one of the bond kept there, or of the ticket ready there; none otherwise. */
  const the_face_at_my_mailbox = async (mailbox: string): Promise<string | undefined> =>
    (await the_bond_at(mailbox))?.my_face_id ?? (await the_ticket_at(mailbox))?.my_face_id

  // The traces (F6): the kernel's (EXT-6), the trees' (PER-14), the notices of the extensions (EXT-2).
  const traced: TheKernelsTraced[] = []
  const trace = (entry: TheKernelsTraced): void => {
    traced.push(entry)
  }
  const tree_traced: zz.Traced<unknown>[] = []
  const tree_trace = (entry: zz.Traced<unknown>): void => {
    tree_traced.push(entry)
  }
  const notices: ANotice[] = []
  const to_the_extension: boundary.a_message_to_an_extension[] = []
  const storage = partitions({ characters: start.characters ?? 1_000_000 })
  // A node whose code is changed (the code is free, F2): what its entry
  // answers in place of an extension's leaf's event.
  let tampered: ((event: zz.EventByPath) => zz.EventByPath) | undefined = undefined
  /** An extension's leaves as the node's code serves them: as mounted, or with their events changed. */
  const as_served =
    (
      leaves: zz.PortByPath<zz.EntryOf<typeof persona>>,
    ): zz.PortByPath<zz.EntryOf<typeof persona>> =>
    (context, request) => {
      const change = tampered
      if (change === undefined) return leaves(context, request)
      const events = leaves(context, request)
      return (async function* () {
        for await (const event of events) yield change(event)
      })()
    }

  /** The kernel's reads of its office (EXT-6, EXT-7), over the office installed now. */
  const reads = the_kernels_reads({
    clock,
    office: {
      an_extension: (context, input) => office.an_extension(context, input),
      the_extensions_offered_to_a_bond: (context, input) =>
        office.the_extensions_offered_to_a_bond(context, input),
    },
  })
  const port_of_requests = the_port_of_requests({
    clock,
    machine,
    post: {
      send_a_request: post.send_a_request,
      the_answer_to_a_request: post.the_answer_to_a_request,
      log: facts,
    },
    the_bond,
    extensions: { is_active: reads.is_active, is_offered: reads.is_offered },
    trace,
  })

  /** The transport to greetings' realm, in process (EXT-13), each message to it kept for the story. */
  const transport_to_greetings: Transport = (to_the_kernel) => {
    const realm = in_process((send) => greetings({ clock, elapsed: a_timer(2), send }))(
      to_the_kernel,
    )
    return {
      to_the_extension: (message) => {
        to_the_extension.push(message)
        realm.to_the_extension(message)
      },
      unload: realm.unload,
    }
  }

  /**
   * The node wired over the office installed now (GR-6): auth's lookups
   * over the address book's and the office's reads; the four persona trees
   * by path, their invoked ports the address book's, the office's and auth's;
   * greetings hosted, its leaves mounted on `self` and below the node of
   * `known`; the kernel's entry. An update of the app wires it again.
   */
  const wired_over = (installed: Composed | undefined) => {
    const the_office = the_office_of(installed)
    const acquaintances = zz.lookup_ports({
      registry: acquaintances_registry,
      lookups: {
        the_bond_of_a_face_at_my_mailbox,
        the_ticket_a_face_presents_at_my_mailbox,
        the_extensions_offered_to_the_bond_of_a_key,
      },
    })(
      the_acquaintances({
        clock,
        address_book: {
          the_bond_at_my_mailbox: address_book.the_bond_at_my_mailbox,
          the_ticket_at_my_mailbox: address_book.the_ticket_at_my_mailbox,
          a_bond: address_book.a_bond,
        },
        office: { the_extensions_offered_to_a_bond: the_office.the_extensions_offered_to_a_bond },
      }),
    )
    const trees = {
      invoked: {
        'bonds/address_book': address_book,
        'extensions/activations': the_office,
        'auth/acquaintances': acquaintances,
      },
      log: facts,
      trace: tree_trace,
    }
    const the_personas = {
      self: zz.tree_ports_by_path({
        registry: { ...persona_registry, ...self_registry },
        versions,
        majors: self_majors,
        top: persona,
        use_cases: {
          make_my_first_face: self_usecase.make_my_first_face,
          prepare_a_ticket: self_usecase.prepare_a_ticket,
          open_their_ticket: self_usecase.open_their_ticket,
          rename_a_bond: self_usecase.rename_a_bond,
          remove_a_bond: self_usecase.remove_a_bond,
          activate_an_extension: self_usecase.activate_an_extension,
          deactivate_an_extension: self_usecase.deactivate_an_extension,
          withdraw_the_offer_from_a_bond: self_usecase.withdraw_the_offer_from_a_bond,
          offer_an_extension_to_a_bond: self_usecase.offer_an_extension_to_a_bond,
          ask_a_bond_for_the_extensions_in_common:
            self_usecase.ask_a_bond_for_the_extensions_in_common,
          my_faces: self_usecase.my_faces,
          my_bonds: self_usecase.my_bonds,
          a_bond: self_usecase.a_bond,
          my_ticket: self_usecase.my_ticket,
          an_extension: self_usecase.an_extension,
          the_extensions_offered_to_a_bond: self_usecase.the_extensions_offered_to_a_bond,
        },
      })(trees),
      known: zz.tree_ports_by_path({
        registry: { ...persona_registry, ...known_registry },
        versions,
        majors: known_majors,
        top: persona,
        use_cases: { the_extensions_in_common },
      })(trees),
      unknown: zz.tree_ports_by_path({
        registry: { ...persona_registry, ...unknown_registry },
        versions,
        majors: unknown_majors,
        top: persona,
        use_cases: { introduce_myself },
      })(trees),
      anonymous: zz.tree_ports_by_path({
        registry: { ...persona_registry, ...anonymous_registry },
        versions,
        majors: anonymous_majors,
        top: persona,
        use_cases: {},
      })(trees),
    }

    /** Greetings hosted (EXT-15), and its leaves mounted on `self` and below the node of `known` (PER-6, EXT-11). */
    const greetings_of = (extension: Composed) => {
      const name = extension.manifest.name
      const hosted = a_hosted_extension({
        composed: extension,
        transport: transport_to_greetings,
        is_active: () => reads.is_active(name),
        the_port_of_requests: port_of_requests({ name, touches: extension.manifest.touches }),
        its_storage: storage.of(name),
        the_bond_on_known: (context) => {
          const given = the_context_on_known.parse(context)
          return {
            bond: given.bond.bond_id,
            peer_key: given.bond.their_key,
            bond_name: given.bond.name,
          }
        },
        trace,
        notices: (notice) => {
          notices.push(notice)
        },
        clock,
        a_while: a_timer(5),
      })
      const { self, known } = extension.surfaces
      if (self === undefined || known === undefined)
        throw new Error(`${name} has no leaf on self or on known`)
      const on_self = zz.mounted_leaf_ports({
        registry: { ...persona_registry, ...self_registry },
        top: persona,
        at: 'persona/self',
        name,
      })({
        invoked: {},
        trace: tree_trace,
        surface: self,
        invokes: hosted.invokes('self'),
        outside_the_surface: hosted.outside_the_surface('self'),
      })
      const on_known = zz.mounted_leaf_ports({
        registry: { ...persona_registry, ...known_registry },
        top: persona,
        at: 'persona/known',
        name,
      })({
        invoked: { 'auth/acquaintances': acquaintances },
        trace: tree_trace,
        surface: known,
        invokes: hosted.invokes('known'),
        outside_the_surface: hosted.outside_the_surface('known'),
      })
      return { name, hosted, on_self, on_known }
    }
    const extension = installed === undefined ? undefined : greetings_of(installed)

    const entry = the_kernels_entry({
      clock,
      the_machine_at_my_mailbox: async (mailbox) => {
        const face = await the_face_at_my_mailbox(mailbox)
        return face === undefined ? undefined : machine_of(face)
      },
      the_personas,
      the_leaves_of_an_extension: (name, persona_named) =>
        extension?.name !== name
          ? undefined
          : persona_named === 'known'
            ? as_served(extension.on_known)
            : persona_named === 'self'
              ? as_served(extension.on_self)
              : undefined,
      routing: {
        installed: () => Promise.resolve(extension === undefined ? [] : [extension.name]),
        the_active_among: reads.the_active_among,
        offered_to_the_bond_of_the_caller: async (caller) => {
          const offered = await acquaintances.the_extensions_offered_to_the_bond_of_a_key(caller)
          return offered.answer === 'known'
            ? { answer: 'known', value: offered.value.map((each) => each.extension) }
            : offered
        },
      },
      post: { take_a_response: post.take_a_response, mailbox: transport.port },
      the_bond_to_answer_on,
      machine_of,
      trace,
    })
    return { office: the_office, acquaintances, the_personas, extension, entry }
  }
  let wired = wired_over(composed)

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
  const the_user = (leaf: string, input: unknown, sent: { readonly operation?: string } = {}) =>
    all(wired.the_personas.self(as_the_user('1.0.0', sent.operation), { leaf, input }))

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

  // The collector (DOM-17): every mailbox the node collects, at the relay,
  // with its R from the safe; each deposit not seen yet handed to the entry;
  // one the entry throws on is left unseen, and the mailbox's next deposits
  // wait behind it for the next pass.
  const seen = new Set<string>()
  const collected: AnEnvelopeCollected[] = []
  /** The deposits the relay keeps at a mailbox, in its order, collected with its R. */
  const the_deposits_at = async (collect_secret: string, deposit_address: string) => {
    const holder = await relay.as(showing(collect_secret), '1.0.0')
    const stream = relay.holder
      .collect_the_envelopes(holder.when(story.time.now()), { deposit_address })
      [Symbol.asyncIterator]()
    const first = await stream.next()
    await stream.return?.()
    if (first.done === true || first.value.event !== 'snapshot')
      throw new Error(`${start.name}'s collect at ${deposit_address} began with no snapshot`)
    return first.value.entries.map((entry) => ({
      deposit_id: entry.deposit_id,
      envelope: entry.envelope,
    }))
  }
  /** The mailboxes the node collects (BND-11), each with its R from the safe (SEA-4). */
  const my_mailboxes = async () =>
    Promise.all(
      entries_of(await all(address_book.the_mailboxes_i_collect(when(), {}))).map(
        async (mailbox) => {
          const [key] = entries_of(
            await all(safe.the_key_of_a_mailbox(when(), { mailbox_key_id: mailbox.id })),
          )
          if (key === undefined) throw new Error(`no key of the mailbox of ${mailbox.id}`)
          return {
            bond_id: mailbox.id,
            deposit_address: mailbox.my_mailbox.deposit_address,
            collect_secret: key.collect_secret,
          }
        },
      ),
    )
  /** One pass of the collector: what came to each mailbox, to the entry; the first fault of the entry thrown once the pass is over. */
  const collects = async (): Promise<void> => {
    const faults: unknown[] = []
    for (const mailbox of await my_mailboxes()) {
      for (const deposit of await the_deposits_at(
        mailbox.collect_secret,
        mailbox.deposit_address,
      )) {
        const at = `${mailbox.deposit_address}/${deposit.deposit_id}`
        if (seen.has(at)) continue
        const envelope = { came_to: mailbox.deposit_address, envelope: deposit.envelope }
        try {
          await wired.entry(envelope)
        } catch (fault) {
          faults.push(fault)
          break
        }
        seen.add(at)
        collected.push(envelope)
      }
    }
    if (faults.length > 0) throw faults[0]
  }

  /** Greetings hosted, which the story installed. */
  const the_greetings = () => {
    if (wired.extension === undefined)
      throw new Error(`greetings is not installed on ${start.name}'s node`)
    return wired.extension
  }

  // The first start (BND-8, SEA-3): the user's face, asked for from the app,
  // its keys made by the safe through the reactions.
  await the_user('usecase/make_my_first_face', { face_id: start.face_id, name: start.name })
  await runs()
  const key = await the_key_of_my_face(start.face_id)

  /** The ticket of a bond as the node shows it (BND-8, BND-9): with its secret, the safe's signature over its D; none for one not ready. */
  const shows = async (bond_id: string): Promise<Shown | undefined> => {
    const ticket = await my_ticket(bond_id)
    if (ticket === undefined) return undefined
    const secret = await machine_of(ticket.my_face_id).sign(
      the_content_a_ticket_s_secret_signs(ticket.my_mailbox.deposit_address),
    )
    return {
      key: ticket.key,
      introduced_as: ticket.introduced_as,
      mailbox: ticket.my_mailbox,
      secret,
    }
  }

  const the_node = {
    name: start.name,
    face_id: start.face_id,
    /** The node's face's key (K_a, K_b, …). */
    key,
    machine_of,
    /** The ports of `post/requests` over the node's cell, and the log of its facts. */
    requests: post,
    log: facts,
    /** The address book's ports over the node's cell. */
    address_book,
    /** The office's ports over the node's cell, with the manifests installed now. */
    office: () => wired.office,
    /** The kernel's reads of its office (EXT-6, EXT-7). */
    reads,
    /** Auth's lookups as the trees invoke them (`zz.lookup_ports` over `the_acquaintances`, PER-22). */
    acquaintances: () => wired.acquaintances,
    /** The kernel's four persona trees by path (PER-24). */
    personas: () => wired.the_personas,
    /** The kernel's entry (PER-25), one envelope at a time, as the collector hands it. */
    entry: (envelope: AnEnvelopeCollected): Promise<void> => wired.entry(envelope),
    /** The port of requests of an extension of this node, by its name and its manifest's touches (EXT-2). */
    port_of_requests,
    the_user,
    /** The context the user's entry gives `self` (step 15), at a version, under an operation. */
    as_the_user,
    runs,
    collects,
    /** The node runs, then its collector passes: what came is served, and its answers deposited. */
    serves: async (): Promise<void> => {
      await runs()
      await collects()
    },
    /** What the collector handed the entry, in order. */
    collected: (): readonly AnEnvelopeCollected[] => [...collected],
    /** The envelopes the relay keeps at the node's mailboxes, seen or not. */
    at_my_mailboxes: async (): Promise<readonly AnEnvelopeCollected[]> =>
      (
        await Promise.all(
          (await my_mailboxes()).map(async (mailbox) =>
            (await the_deposits_at(mailbox.collect_secret, mailbox.deposit_address)).map(
              (deposit) => ({ came_to: mailbox.deposit_address, envelope: deposit.envelope }),
            ),
          ),
        )
      ).flat(),
    /** The kernel's trace (EXT-6), in order. */
    traced,
    /** The kernel's trace, by why. */
    whys: (): readonly string[] => traced.map((entry) => entry.why),
    /** The trees' trace (PER-14), the mounted ports' included, in order. */
    tree_traced,
    notices,
    storage,
    to_the_extension,
    // The address book, as the user and the introductions use it.
    my_faces,
    my_bonds,
    a_bond,
    my_ticket,
    shows,
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
        declared_at: declared.get(letter) ?? zz.date_time.parse(clock.now()),
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
        declared_at: introduction.declared_at,
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
    /** The user activates greetings, accepting its manifest as shown, and the kernel loads it (EXT-7, EXT-15). */
    activates: async (): Promise<Loaded> => {
      await the_user('usecase/activate_an_extension', { manifest: the_node.shown() })
      return the_greetings().hosted.load()
    },
    /** The user deactivates greetings, and the kernel unloads it (EXT-7, EXT-15). */
    deactivates: async (): Promise<void> => {
      await the_user('usecase/deactivate_an_extension', { extension: 'greetings' })
      await the_greetings().hosted.unload()
    },
    /** The user withdraws greetings' offer from a bond (EXT-7). */
    withdraws_the_offer_from: (bond_id: string) =>
      the_user('usecase/withdraw_the_offer_from_a_bond', { extension: 'greetings', bond_id }),
    /** The user offers greetings to a bond again (EXT-7). */
    offers_again_to: (bond_id: string) =>
      the_user('usecase/offer_an_extension_to_a_bond', { extension: 'greetings', bond_id }),
    /** The user renames a bond (BND-6). */
    renames: (bond_id: string, name: string) =>
      the_user('usecase/rename_a_bond', { bond_id, name }),
    /** The user removes a bond from her address book (BND-6). */
    removes_a_bond: (bond_id: string) => the_user('usecase/remove_a_bond', { bond_id }),
    /** The node starts greetings, if active (EXT-15): the phone started. */
    starts: (): Promise<Loaded> => the_greetings().hosted.load(),
    /** The phone closes: greetings stopped and unloaded (EXT-15), what it keeps in its partition. */
    closes: (): Promise<void> => the_greetings().hosted.unload(),
    /**
     * The user taps "Saluta" on a bond: greetings' leaf on `self`, through
     * its mounted port, as the user's entry will invoke it (step 15); the
     * greeting its event names.
     */
    greets: async (bond_id: string): Promise<string> => {
      const events = await all(
        the_greetings().on_self(as_the_user('1.0.0'), {
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
    tampers_with_its_responses: (change: (event: zz.EventByPath) => zz.EventByPath): void => {
      tampered = change
    },
    /** The identity of a request of greetings' (F7, PST-2), as this node's kernel composes it. */
    the_request_of: (id: string, effect: string = ask_for_a_greeting_back): string =>
      the_identity_of_a_request(machine)({
        of: 'an_extension',
        extension: 'greetings',
        effect,
        id,
      }),
    /** The identity of a request of the kernel's (F7, PST-2), as this node's kernel composes it: the question of the office's, or a story's letter. */
    the_kernels_request_of: (
      id: string,
      effect = 'extensions/activations/effect/ask_for_the_extensions_in_common',
    ): string => the_identity_of_a_request(machine)({ of: 'the_kernel', effect, id }),
    /** The identity of the response to a request (PST-2). */
    the_response_to: (request_id: string): string =>
      the_identity_of_the_response_to(machine)(request_id),
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
      identity: the_identity_of_the_response_to(machine)(letter.answers),
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
        const sealed = await a_letter_in_an_envelope(machine)(letter, for_key)
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
      machine.sign(the_content_a_letter_signs(letter)),
    /** A text deposited at a D through the node's transport (TST-4: its faults), under an operation of its own: what the relay answered. */
    deposits: (deposit_address: string, envelope: string, operation?: string): Promise<Deposited> =>
      transport.port.deposit({
        operation:
          operation ?? the_operation_of_a_deposit(machine)(content_of(envelope), deposit_address),
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
      for await (const each of facts(undefined)) {
        if (each.event !== 'fact') break
        kept.set(each.position, each.fact)
      }
      return [...kept.values()]
    },
    /** The entries the executors hold, and the parts the reactions hold: their dead letters. */
    held: () => [...made.held(), ...made.held_parts()],
    // Greetings, hosted (EXT-15).
    /** Greetings hosted, which the story installed. */
    the_hosted: (): Hosted => the_greetings().hosted,
    /** Greetings' leaves on `known`, below the node of `known`, as the entry invokes them. */
    on_known: () => the_greetings().on_known,
    /** Greetings' leaves on `self`, below the node of `self`, as the user's entry will invoke them. */
    on_self: () => the_greetings().on_self,
    /** Greetings' manifest in the office's words, as the user is shown it (EXT-7). */
    shown: () => {
      if (composed === undefined)
        throw new Error(`greetings is not installed on ${start.name}'s node`)
      return the_manifest_to_accept(composed.manifest)
    },
    /**
     * An update of the app with this manifest of greetings (EXT-7, EXT-10):
     * greetings unloaded, composed again, the node wired again over the
     * office with the manifest installed now (the same cell, the same
     * partition), then loaded, as a node starts: what its load came to.
     */
    updated_to: async (manifest: unknown) => {
      await wired.extension?.hosted.unload()
      composed = composed_from(manifest)
      office = the_office_of(composed)
      wired = wired_over(composed)
      return the_greetings().hosted.load()
    },
    /** A greeting as greetings keeps it in its partition (`state/greeting/<id>`). */
    the_greeting: (greeting_id: string): unknown =>
      storage.kept('greetings').get(`state/greeting/${greeting_id}`),
    /** Whether a greeting is closed, as its partition keeps it. */
    is_closed: (greeting_id: string): boolean =>
      JSON.stringify(
        storage.kept('greetings').get(`state/greeting/${greeting_id}`) ?? null,
      ).includes('"stage":"closed"'),
    /** The greetings back greetings sent, as its partition keeps them. */
    greetings_back: (): readonly unknown[] =>
      [...storage.kept('greetings')]
        .filter(([at]) => at.startsWith('state/greeting_back/'))
        .map(([, value]) => value),
    /** The facts greetings recorded in its partition, in order, by the last segment of each part's path. */
    facts_of_greetings: (): readonly string[] =>
      [...storage.kept('greetings')]
        .filter(([at]) => at.startsWith('fact/'))
        .toSorted(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .flatMap(([, value]) =>
          a_fact_kept.parse(value).parts.map((part) => part.path.split('/').at(-1) ?? ''),
        ),
    /** The dead letters greetings told the kernel (EXT-2), by their names. */
    dead_letters: (): readonly string[] =>
      notices.flatMap((notice) =>
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
