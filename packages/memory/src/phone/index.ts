// A phone in the `memory` stack (CFG-1, CFG-2, CFG-3; step 17): the
// composition root of a phone over q-'s oracle, one cell (MBX-7) holding the
// safe (`seals`), the requests (`post`), the address book (`bonds`), the
// office of the extensions (`extensions`) and the user's offices (`user`).
// It wires each domain's ports over the cell (`seen_by`), the post's
// machine of a face, the executors of the safe, the post, the address book
// (its introductions delivered as the kernel's requests, BND-10), the office
// (EXT-8) and `user` (the port toward `self`, USR-9), the reactions of
// `reaction/`, the kernel's ports of requests and its reads, auth's lookups,
// the four persona trees by path, the kernel's entry with the bond to
// answer on (PER-25), the extensions the app carries composed (EXT-4),
// hosted in process (EXT-13) and mounted on `self` and `known`, the
// collector (DOM-17), the ticket shown (BND-9) and the consumer that loads
// and unloads the extensions as the office says (EXT-15). On the model of
// the relay's configurator and Shed's: everything is wired, and checked
// (CFG-2), when the phone starts, before any request; a composition fault
// of an extension's manifest stops the start. The durable consumers are
// given wired, not started, each a function to start: the node runs them,
// a story starts those it needs.

import {
  a_hosted_extension,
  compose_an_extension,
  the_acquaintances,
  the_calling_off,
  the_collector,
  the_delivery_of_an_activity,
  the_delivery_of_my_introduction,
  the_delivery_of_the_extensions_in_common,
  the_extensions_follow_the_office,
  the_kernels_entry,
  the_kernels_offer,
  the_kernels_port_of_requests,
  the_kernels_reads,
  the_letters_an_extension_holds,
  the_manifest_to_accept,
  the_name_of_a_letter,
  the_port_of_requests,
  the_ticket_shown,
  type ABondToAnswerOn,
  type ABondToAskOn,
  type ACollect,
  type AnEnvelopeCollected,
  type AnExtensionsLeaves,
  type ANotice,
  type Composed,
  type Hosted,
  type TheFollowing,
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
import type { send_my_introduction } from '@q-mino/domains/bonds/address_book/_effect.ts'
import { majors as address_book_majors } from '@q-mino/domains/bonds/address_book/_majors.ts'
import { registry as address_book_registry } from '@q-mino/domains/bonds/address_book/_registry.ts'
import { let_a_ticket_expire } from '@q-mino/domains/bonds/address_book/_usecase.ts'
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
import type { MailboxPort, Machine } from '@q-mino/domains/post/_dsl.ts'
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
  a_new_mailbox_key,
  a_new_seed_and_its_first_face,
  base64url_of,
  bytes_of,
  sealed_for,
  the_signature_holds,
  type Primitives,
} from '@q-mino/domains/seals/safe/_dsl.ts'
import { majors as safe_majors } from '@q-mino/domains/seals/safe/_majors.ts'
import { registry as safe_registry } from '@q-mino/domains/seals/safe/_registry.ts'
import {
  keep_a_mailbox_key,
  keep_a_new_seed_and_its_face,
} from '@q-mino/domains/seals/safe/_usecase.ts'
import { majors as activities_majors } from '@q-mino/domains/user/activities/_majors.ts'
import { registry as activities_registry } from '@q-mino/domains/user/activities/_registry.ts'
import { end_an_activity } from '@q-mino/domains/user/activities/_usecase.ts'
import { majors as choices_majors } from '@q-mino/domains/user/choices/_majors.ts'
import { majors as drafts_majors } from '@q-mino/domains/user/drafts/_majors.ts'
import { z } from 'zod'
import {
  bonds_ports,
  extensions_ports,
  in_process,
  log,
  no_activation,
  no_bond,
  no_request,
  no_secret,
  nothing_asked,
  partitions,
  post_ports,
  seals_ports,
  seen_by,
  user_ports,
  type BondsState,
  type Cell,
  type ExtensionsState,
  type Made,
  type Partitions,
  type PostState,
  type SealsState,
  type UserState,
} from '../oracle/index.ts'

/** A phone's cell: the safe, the requests, the address book, the office, and the user's offices beside them (USR-1), one cell (MBX-7). */
export type PhoneState = SealsState & PostState & BondsState & ExtensionsState & UserState

/** A new phone's state: no secret, no request, no bond, no activation, nothing asked. */
export const a_new_phone: PhoneState = {
  ...no_secret,
  ...no_request,
  ...no_bond,
  ...no_activation,
  ...nothing_asked,
}

/** The cell a phone runs over: the oracle's, with the entries its executors hold (DOM-14), which the user is told and acts on (USR-8). */
export type PhoneCell = Cell<PhoneState> & Pick<Made<PhoneState>, 'held'>

/** The manifests of the office's extensions, as the office is given them (EXT-7). */
type Installed = Parameters<typeof extensions_ports>[1]

/**
 * What a phone keeps, as its composition root wires it (STK-1; steps 21 and
 * 25 vary it, ADP-6): each kernel domain's ports over its storage, the
 * node's fact log (DOM-17), the outbox (DOM-14), the executors' and the
 * reactions' durable state (DOM-14, DOM-16), the versions it keeps (DOM-22),
 * the entries its executors hold (USR-8), and the extensions' partitions
 * (EXT-14) of a size. The oracle's cell is one (`on_the_cell`); IndexedDB's
 * another (part 21.2). [Q, C, 21 Nov 2026]
 */
export interface PhoneStorage<partitions extends APhonesPartitions = APhonesPartitions> {
  readonly stored_versions: zz.StoredVersions
  readonly log: zz.FactLog
  readonly outbox: zz.Outbox
  readonly executor: zz.ExecutorState
  readonly reactions: zz.ReactionState
  readonly held: () => Promise<readonly zz.HeldEntry[]>
  readonly safe: (
    primitives: Primitives,
  ) => (versions: zz.Versions) => ReturnType<ReturnType<typeof seals_ports>>
  readonly post: (versions: zz.Versions) => ReturnType<ReturnType<typeof post_ports>>
  readonly address_book: (
    primitives: Primitives,
  ) => (versions: zz.Versions) => ReturnType<ReturnType<typeof bonds_ports>>
  readonly office: (
    installed: Installed,
  ) => (versions: zz.Versions) => ReturnType<ReturnType<typeof extensions_ports>>
  readonly user: (versions: zz.Versions) => ReturnType<ReturnType<typeof user_ports>>
  readonly partitions: (limit: { readonly characters: number }) => partitions
}

/** The extensions' partitions of a phone (EXT-14): each extension's `its_storage`, by its name. */
export interface APhonesPartitions {
  readonly of: (name: string) => boundary.Ports['its_storage']
}

/** A phone's storage on the oracle's cell (TST-2): each domain's ports over it (`seen_by`), its partitions in memory. */
export const on_the_cell = (cell: PhoneCell) =>
  ({
    stored_versions: cell.stored_versions,
    log: log(cell),
    outbox: cell.outbox,
    executor: cell.executor,
    reactions: cell.reactions,
    held: () => Promise.resolve(cell.held()),
    safe: (primitives) => seals_ports(seen_by<SealsState, PhoneState>(cell), primitives),
    post: post_ports(seen_by<PostState, PhoneState>(cell)),
    address_book: (primitives) => bonds_ports(seen_by<BondsState, PhoneState>(cell), primitives),
    office: (installed) =>
      extensions_ports(seen_by<ExtensionsState & BondsState, PhoneState>(cell), installed),
    user: user_ports(seen_by<UserState, PhoneState>(cell)),
    partitions,
  }) satisfies PhoneStorage

/** What an extension's realm is given beside the boundary (EXT-13): its clock, the time that passes, how it speaks to the kernel. */
export interface TheRealmsHost {
  readonly clock: zz.Clock
  readonly elapsed: zz.Elapsed
  readonly send: boundary.Send
}

/**
 * An extension the app carries (EXT-9, CFG-3): its manifest as its build
 * writes it (data, composed at the start, EXT-4), and how the kernel reaches
 * its realm, the configurator's (EXT-13): **in process**, its side of the
 * boundary as its package gives it, loaded in the kernel's realm (`memory`,
 * the oracle); or **isolated**, a transport to a realm of its own, which
 * keeps its clock and its time (`phone`, a sandboxed frame, PWA-3).
 * [Q, C, 21 Nov 2026] (step 25)
 */
export type AnExtensionOfTheApp =
  | {
      readonly manifest: unknown
      readonly runs: 'in_process'
      readonly realm: (host: TheRealmsHost) => {
        readonly receive: (message: unknown) => Promise<void>
      }
    }
  | { readonly manifest: unknown; readonly runs: 'isolated'; readonly transport: Transport }

/**
 * The world outside the phone: its clock; the time that passes, which wakes
 * the executors and ends a leaf's wait (DOM-3, DOM-14); the primitives of
 * its safe, its randomness included (SEA-5); the post's mailbox port, its
 * deposits at the relays (PST-10); the collect port, its mailboxes read at
 * the relays (MBX-6); the extensions the app carries (ping pong in stage 1);
 * the relays its tickets declare (one in stage 1).
 */
export interface World {
  readonly clock: zz.Clock
  readonly elapsed: zz.Elapsed
  readonly primitives: Primitives
  readonly mailbox: MailboxPort
  readonly collect: ACollect
  readonly extensions: readonly AnExtensionOfTheApp[]
  readonly relays: readonly string[]
}

/**
 * The release a phone runs, as the test configurator gives it (TST-4, on
 * Shed's model): the kernel's adapters as they are unless it gives
 * another. A delivery of `send_my_introduction` in place of the kernel's
 * request (a story that carries the introductions itself); the time that
 * passes in the extensions' realm, and the while the kernel waits for an
 * extension's invocations in flight at its unload (EXT-15); the size of
 * each extension's partition (EXT-14), and its partition as the release
 * gives it (a story that scripts its commits); the leaves of an extension
 * as the node's code serves them (the code is free, F2); the transport to
 * an extension's realm as the release gives it (one a story watches).
 */
export interface Release {
  readonly send_my_introduction?: (entry: {
    readonly id: zz.entry_id
    readonly payload: send_my_introduction
  }) => Promise<zz.Delivered<never>>
  readonly the_realm_s_time?: zz.Elapsed
  readonly a_while?: () => Promise<void>
  readonly characters?: number
  readonly the_partition?: (
    name: string,
    partition: boundary.Ports['its_storage'],
  ) => boundary.Ports['its_storage']
  readonly serves?: (leaves: AnExtensionsLeaves) => AnExtensionsLeaves
  readonly the_transport?: (transport: Transport) => Transport
}

/** How large an extension's partition is on the oracle, in characters, unless the release says (EXT-14). */
const a_partition_s_size = 1_000_000

/** How long the kernel waits for an extension's invocations in flight when it unloads it, unless the release says (EXT-15). */
const the_while_of_an_unload = 1_000

/** What the node of `known` gives a mounted folder, as the hosting reads it (PER-24): the bond, whole. */
const the_context_on_known = z.object({ bond: bond_of_a_face })

/** A read's events as the phone's wiring reads them: its snapshot's entries, or a refusal of its input. */
type ARead<entry> = AsyncIterable<
  | { readonly event: 'snapshot'; readonly entries: readonly entry[] }
  | { readonly event: 'invalid_request' }
>

/** The entries of a read's snapshot, its first event; none for a refused input. */
const the_entries_of = async <entry>(events: ARead<entry>): Promise<readonly entry[]> => {
  for await (const event of events) return event.event === 'snapshot' ? event.entries : []
  return []
}

/** A list as its readers see it: the same list, which they cannot change. */
const a_view_of = <each>(list: readonly each[]): readonly each[] => list

/** An extension the phone hosts (EXT-15): its name, its composition, its hosting, its leaves mounted on `self` and below the node of `known`. */
export interface AnExtensionHostedOnThePhone {
  readonly name: string
  readonly composed: Composed
  readonly hosted: Hosted
  readonly on_self: AnExtensionsLeaves
  readonly on_known: AnExtensionsLeaves
}

/**
 * The extensions of the app composed (EXT-4, EXT-3: each name once), or the
 * start stops with the composition's message (CFG-2): every extension's
 * faults, one message, its lines in the order the app carries them, so that
 * a second extension's fault is not seen only once the first's is fixed (as
 * one extension's faults are told together, EXT-4). [Q, C, 21 Nov 2026]
 * (step 25; until then the first extension's fault stopped it alone)
 */
const the_compositions_of = (
  extensions: readonly AnExtensionOfTheApp[],
): readonly { readonly composed: Composed; readonly carried: AnExtensionOfTheApp }[] => {
  const told = extensions.reduce<{
    readonly composed: readonly {
      readonly composed: Composed
      readonly carried: AnExtensionOfTheApp
    }[]
    readonly faults: readonly string[]
  }>(
    (so_far, carried) => {
      const composition = compose_an_extension(
        the_kernels_offer(so_far.composed.map((each) => each.composed.manifest.name)),
      )(carried.manifest)
      return composition.composition === 'a_fault'
        ? { ...so_far, faults: [...so_far.faults, composition.message] }
        : {
            ...so_far,
            composed: [...so_far.composed, { composed: composition.composed, carried }],
          }
    },
    { composed: [], faults: [] },
  )
  if (told.faults.length > 0) throw new Error(told.faults.join('\n'))
  return told.composed
}

export const phone =
  <partitions extends APhonesPartitions>(kept: PhoneStorage<partitions>, release: Release = {}) =>
  async (world: World) => {
    // The versions of the cell, from the majors of the seven domains whose
    // facts and effects it keeps, checked against what it keeps (DOM-22).
    const versions = await zz.versions([
      safe_majors,
      requests_majors,
      address_book_majors,
      activations_majors,
      activities_majors,
      drafts_majors,
      choices_majors,
    ])({ stored: kept.stored_versions })
    const clock = world.clock
    const when = (): zz.RootContext => ({
      now: zz.in_zone(clock.time_zone)(clock.now()),
      time_zone: clock.time_zone,
    })
    const safe = kept.safe(world.primitives)(versions)
    const post = kept.post(versions)
    const address_book = kept.address_book(world.primitives)(versions)
    const user = kept.user(versions)
    const facts = kept.log

    /** The post's hash (PST-3): BLAKE2b-256, in base64url; no face's. */
    const the_hash = (content: string): string =>
      base64url_of(world.primitives.blake2b_256(bytes_of(content)))

    /**
     * The post's machine of a face of the phone (PST-3, PST-10): to sign and
     * to open, the safe's reads; to seal and to check, the safe's pure
     * functions; the hash. A face the safe has not made signs nothing: a
     * fault of the wiring.
     */
    const machine_of = (face_id: string): Machine => ({
      sign: async (content) => {
        const [face] = await the_entries_of(
          safe.a_content_signed_by_a_face(when(), { face_id, content }),
        )
        if (face === undefined) throw new Error(`no face ${face_id} to sign`)
        return face.signature
      },
      seal_for: sealed_for(world.primitives),
      open: async (sealed_content) => {
        const [face] = await the_entries_of(
          safe.a_sealed_content_opened_by_a_face(when(), { face_id, sealed_content }),
        )
        if (face === undefined) throw new Error(`no face ${face_id} to open`)
        return face.opened
      },
      signature_holds: the_signature_holds(world.primitives),
      hash: the_hash,
    })

    // The address book's reads, at the clock's instant.
    const my_faces = async () => the_entries_of(address_book.my_faces(when(), {}))
    const my_bonds = async () => the_entries_of(address_book.my_bonds(when(), {}))
    const a_bond = async (bond_id: string) =>
      (await the_entries_of(address_book.a_bond(when(), { bond_id })))[0]
    const the_bond_at = async (deposit_address: string) =>
      (await the_entries_of(address_book.the_bond_at_my_mailbox(when(), { deposit_address })))[0]
    const the_ticket_at = async (deposit_address: string) =>
      (await the_entries_of(address_book.the_ticket_at_my_mailbox(when(), { deposit_address })))[0]

    /** The key of a face of the phone's, as the address book keeps it (the safe made it). */
    const the_key_of_my_face = async (face_id: string): Promise<string> => {
      const face = (await my_faces()).find((mine) => mine.id === face_id)
      if (face === undefined) throw new Error(`no face ${face_id} made on this phone`)
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

    // The traces (F6), kept by the phone in memory for the news (USR-8):
    // the kernel's (EXT-6), the trees' (PER-14), the extensions' notices (EXT-2).
    // Each written, whoever listens is told (`when_written`, WEB-19: her
    // screens read the news again). [Q, C, 21 Nov 2026] (step 25)
    const listening = new Set<() => void>()
    const written = (): void => {
      for (const tell of listening) tell()
    }
    const traced: TheKernelsTraced[] = []
    const trace = (entry: TheKernelsTraced): void => {
      traced.push(entry)
      written()
    }
    const tree_traced: zz.Traced<unknown>[] = []
    const tree_trace = (entry: zz.Traced<unknown>): void => {
      tree_traced.push(entry)
      written()
    }
    const notices: ANotice[] = []

    /** The kernel's own port of requests (F7, EXT-8): the phone's post, the hash, the address book's bond by its id. */
    const the_kernels_port = the_kernels_port_of_requests({
      clock,
      machine: { hash: the_hash },
      post: {
        send_a_request: post.send_a_request,
        the_answer_to_a_request: post.the_answer_to_a_request,
        log: facts,
      },
      the_bond,
    })

    // The executors (DOM-14) and the reactions' consumers (DOM-16), wired.
    const the_safe_s_executor = zz.effect_executor({
      registry: safe_registry,
      versions,
      returns: { keep_a_new_seed_and_its_face, keep_a_mailbox_key },
    })({
      // The safe's draws (SEA-3, SEA-4): its world, the primitives' randomness.
      'seals/safe/effect/draw_a_seed_for_the_face': (entry) =>
        Promise.resolve({
          outcome: 'delivered',
          returns: {
            face_id: entry.payload.face_id,
            ...a_new_seed_and_its_first_face(world.primitives),
          },
        }),
      'seals/safe/effect/draw_the_mailbox_key': (entry) =>
        Promise.resolve({
          outcome: 'delivered',
          returns: {
            mailbox_key_id: entry.payload.mailbox_key_id,
            ...a_new_mailbox_key(world.primitives),
          },
        }),
    })
    const the_post_s_executor = zz.effect_executor({
      registry: requests_registry,
      versions,
      returns: { send_a_request_again, close_a_request_with_no_response },
    })({
      'post/requests/effect/deposit_a_letter': the_deposit_of_a_letter(machine_of, world.mailbox),
      'post/requests/effect/wait_to_send_again': zz.returns_the_payload,
      'post/requests/effect/wait_for_the_response': zz.returns_the_payload,
    })
    const the_address_book_s_executor = zz.effect_executor({
      registry: address_book_registry,
      versions,
      returns: { let_a_ticket_expire },
    })({
      'bonds/address_book/effect/wait_until_the_ticket_expires': zz.returns_the_payload,
      // My introduction (BND-10): a request of the kernel's to their `unknown`.
      'bonds/address_book/effect/send_my_introduction':
        release.send_my_introduction ??
        the_delivery_of_my_introduction({
          clock,
          address_book: { a_bond: address_book.a_bond, my_faces: address_book.my_faces },
          the_kernels_port,
        }),
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

    // The extensions' partitions (EXT-14): the oracle's, the same across an update of the app.
    const storage = kept.partitions({ characters: release.characters ?? a_partition_s_size })
    const the_partition_of = (name: string): boundary.Ports['its_storage'] =>
      release.the_partition === undefined
        ? storage.of(name)
        : release.the_partition(name, storage.of(name))
    /** An extension's leaves as the phone's code serves them: as mounted, or as the release changes them (F2). */
    const as_served = (leaves: AnExtensionsLeaves): AnExtensionsLeaves =>
      release.serves === undefined ? leaves : release.serves(leaves)
    const the_realm_s_time = release.the_realm_s_time ?? world.elapsed
    const a_while = release.a_while ?? (() => world.elapsed(the_while_of_an_unload))

    /** The office over the manifests installed (EXT-7): the composition's; an update of the app is the same cell with another composition. */
    const the_office_of = (installed: readonly Composed[]) =>
      kept.office(installed.map((each) => the_manifest_to_accept(each.manifest)))(versions)

    /** The kernel's reads of its office (EXT-6, EXT-7), over the office installed now. */
    const reads = the_kernels_reads({
      clock,
      office: {
        an_extension: (context, input) => wired.office.an_extension(context, input),
        the_extensions_offered_to_a_bond: (context, input) =>
          wired.office.the_extensions_offered_to_a_bond(context, input),
      },
    })

    /**
     * The phone wired over the extensions the app carries now (GR-6): the
     * office over their manifests; auth's lookups over the address book's
     * and the office's reads; the four persona trees by path; each
     * extension hosted, its leaves mounted on `self` and below the node of
     * `known`; the kernel's entry. An update of the app wires it again.
     */
    const wired_over = (carried_now: readonly AnExtensionOfTheApp[]) => {
      const composed = the_compositions_of(carried_now)
      const office = the_office_of(composed.map((each) => each.composed))
      const port_of_requests = the_port_of_requests({
        clock,
        machine: { hash: the_hash },
        post: {
          send_a_request: post.send_a_request,
          the_answer_to_a_request: post.the_answer_to_a_request,
          log: facts,
        },
        the_bond,
        extensions: { is_active: reads.is_active, is_offered: reads.is_offered },
        trace,
      })
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
          office: { the_extensions_offered_to_a_bond: office.the_extensions_offered_to_a_bond },
        }),
      )
      const trees = {
        invoked: {
          'bonds/address_book': address_book,
          'extensions/activations': office,
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

      /** An extension hosted (EXT-15), in process (EXT-13), its leaves mounted on `self` and below the node of `known` (PER-6, EXT-11). */
      const hosted_of = (
        extension: Composed,
        carried: AnExtensionOfTheApp,
      ): AnExtensionHostedOnThePhone => {
        const name = extension.manifest.name
        const in_its_realm =
          carried.runs === 'isolated'
            ? carried.transport
            : in_process((send) => carried.realm({ clock, elapsed: the_realm_s_time, send }))
        const hosted = a_hosted_extension({
          composed: extension,
          transport:
            release.the_transport === undefined
              ? in_its_realm
              : release.the_transport(in_its_realm),
          is_active: () => reads.is_active(name),
          the_port_of_requests: port_of_requests({ name, touches: extension.manifest.touches }),
          its_storage: the_partition_of(name),
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
            written()
          },
          clock,
          a_while,
        })
        const { self, known } = extension.surfaces
        if (self === undefined || known === undefined)
          throw new Error(`${name} has no leaf on self or on known (CFG-2)`)
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
        return { name, composed: extension, hosted, on_self, on_known }
      }
      const extensions = composed.map((each) => hosted_of(each.composed, each.carried))
      const the_extension = (name: string) => extensions.find((each) => each.name === name)

      const entry = the_kernels_entry({
        clock,
        the_machine_at_my_mailbox: async (mailbox) => {
          const face = await the_face_at_my_mailbox(mailbox)
          return face === undefined ? undefined : machine_of(face)
        },
        the_personas,
        the_leaves_of_an_extension: (name, persona_named) => {
          const extension = the_extension(name)
          if (extension === undefined) return undefined
          return persona_named === 'known'
            ? as_served(extension.on_known)
            : persona_named === 'self'
              ? as_served(extension.on_self)
              : undefined
        },
        routing: {
          installed: () => Promise.resolve(extensions.map((each) => each.name)),
          the_active_among: reads.the_active_among,
          offered_to_the_bond_of_the_caller: async (caller) => {
            const offered = await acquaintances.the_extensions_offered_to_the_bond_of_a_key(caller)
            return offered.answer === 'known'
              ? { answer: 'known', value: offered.value.map((each) => each.extension) }
              : offered
          },
        },
        post: { take_a_response: post.take_a_response, mailbox: world.mailbox },
        the_bond_to_answer_on,
        machine_of,
        trace,
      })
      return {
        office,
        port_of_requests,
        acquaintances,
        the_personas,
        extensions,
        the_extension,
        entry,
      }
    }
    let wired = wired_over(world.extensions)

    /** The ports a started executor runs over (DOM-14). */
    const executor_ports = () => ({
      outbox: kept.outbox,
      state: kept.executor,
      clock,
      elapsed: world.elapsed,
    })
    /** The kernel's executors, each wired and not started: a function that starts it. */
    const the_executors = {
      'seals/safe': () => the_safe_s_executor({ ...executor_ports(), returns: safe }),
      'post/requests': () => the_post_s_executor({ ...executor_ports(), returns: post }),
      'bonds/address_book': () =>
        the_address_book_s_executor({ ...executor_ports(), returns: address_book }),
      'extensions/activations': () =>
        the_office_s_executor({ ...executor_ports(), returns: wired.office }),
    }
    /** The consumers of the reactions (DOM-16), by their folder, wired and not started. */
    const the_reactions = {
      'reaction/first_face': () => the_first_face({ state: kept.reactions, clock }),
      'reaction/ticket': () => the_ticket({ state: kept.reactions, clock }),
    }

    // The user's offices (USR-1..USR-9): her activities carried out by
    // `user`'s executor through the port toward `self` (GR-7), the kernel's
    // tree by path as the user and an extension's `self` through its
    // hosting, while the app is open (`the_app`).
    /** The extension's notices of its held letters, by name (EXT-2). */
    const the_extension_s_letters = (name: string): readonly string[] =>
      the_letters_an_extension_holds(notices)
        .filter((held) => held.extension === name)
        .map((held) => held.notice.letter)
    let the_app_open: zz.EffectExecutor | undefined = undefined
    /** A gesture of the user's on a kernel's held letter: through the running executor of its effect, `user`'s while the app is open, else its office's, started for it. */
    const on_a_kernel_s_letter = async <outcome>(
      letter: string,
      gesture: (executor: zz.EffectExecutor, held: zz.EffectDeadLetter) => Promise<outcome>,
    ): Promise<outcome | 'not_held'> => {
      const held = (await kept.held()).find(
        (entry): entry is zz.EffectDeadLetter =>
          entry.held === 'dead_letter' && the_name_of_a_letter(entry) === letter,
      )
      if (held === undefined) return 'not_held'
      const office = held.entry.effect.split('/effect/')[0] ?? ''
      if (office === 'user/activities') {
        if (the_app_open === undefined) throw new Error('the app is closed: no executor of user')
        return gesture(the_app_open, held)
      }
      const start = Object.entries(the_executors).find(([folder]) => folder === office)?.[1]
      if (start === undefined) throw new Error(`no executor of ${office} on this phone`)
      const running = start()
      try {
        return await gesture(running, held)
      } finally {
        await running.stop()
      }
    }
    const the_port_toward_self = the_delivery_of_an_activity({
      clock,
      self: (context, request) => wired.the_personas.self(context, request),
      relays: world.relays,
      the_extension: (name) => {
        const extension = wired.the_extension(name)
        if (extension === undefined) return undefined
        return {
          composed: extension.composed,
          is_active: () => reads.is_active(name),
          life: () => extension.hosted.life(),
          on_self: as_served(extension.on_self),
          held: () => the_extension_s_letters(name),
          redeliver: (letter) => extension.hosted.redeliver(letter),
          discard: (letter, trace) => extension.hosted.discard(letter, trace),
        }
      },
      the_kernels_letters: {
        held: async () =>
          (await kept.held()).flatMap((entry) =>
            entry.held === 'dead_letter' ? [the_name_of_a_letter(entry)] : [],
          ),
        redeliver: async (letter) => {
          const outcome = await on_a_kernel_s_letter(letter, (executor, held) =>
            executor.redeliver(held),
          )
          return outcome === 'not_held'
            ? 'not_held'
            : outcome.outcome === 'delivered'
              ? 'delivered'
              : outcome.outcome === 'dead_letter'
                ? 'held_again'
                : 'not_held'
        },
        discard: (letter, trace) =>
          on_a_kernel_s_letter(letter, async (executor, held) => {
            await executor.discard(held)(trace)
            return 'discarded' as const
          }),
      },
    })
    const the_user_s_executor = zz.effect_executor({
      registry: activities_registry,
      versions,
      returns: { end_an_activity },
    })({ 'user/activities/effect/carry_out_an_activity': the_port_toward_self })

    /** The collector (DOM-17): one pass over the mailboxes the phone collects, what came handed to the entry. */
    const collected: AnEnvelopeCollected[] = []
    const collects = the_collector({
      clock,
      address_book: { the_mailboxes_i_collect: address_book.the_mailboxes_i_collect },
      safe: { the_key_of_a_mailbox: safe.the_key_of_a_mailbox },
      collect: world.collect,
      entry: (envelope) => wired.entry(envelope),
      handed: (envelope) => {
        collected.push(envelope)
      },
    })

    /**
     * The calling off (F7, EXT-7, PST-14): the requests in flight of an
     * extension not active, or not offered to their bond, called off in the
     * phone's post; the bond of a request by my face and their key, among
     * the bonds the address book keeps.
     */
    const calling_off = the_calling_off({
      clock,
      post: {
        the_requests_waiting: post.the_requests_waiting,
        call_off_a_request: post.call_off_a_request,
      },
      the_bond_of: async (asked) => {
        const bond = (await my_bonds()).find(
          (mine) => mine.my_face_id === asked.face_id && mine.their_face.key === asked.their_key,
        )
        return bond === undefined ? undefined : boundary.bond.parse(bond.id)
      },
      extensions: { is_active: reads.is_active, is_offered: reads.is_offered },
    })

    /** The extensions following the office (EXT-15, USR-9): loaded at an activation, unloaded at a deactivation, their requests in flight called off. */
    const the_following = the_extensions_follow_the_office({
      log: facts,
      is_active: reads.is_active,
      hosted: () => wired.extensions,
      the_calling_off: calling_off,
    })

    return {
      /** The versions of the store, as its readers meet its data (DOM-22). */
      versions,
      /** The fact log of the cell (DOM-17). */
      log: facts,
      /** Each domain's ports over the cell: the safe, the requests, the address book, the user's offices. */
      safe,
      post,
      address_book,
      user,
      /** The office's ports over the cell, with the manifests installed now (EXT-7). */
      office: () => wired.office,
      /** The kernel's reads of its office (EXT-6, EXT-7). */
      reads,
      /** Auth's lookups as the trees invoke them (PER-22). */
      acquaintances: () => wired.acquaintances,
      /** The kernel's four persona trees by path (PER-24): `self` is the user's entry's. */
      personas: () => wired.the_personas,
      /** The post's machine of a face of the phone (PST-3). */
      machine_of,
      /** The bond a request names (PST-5). */
      the_bond,
      /** The kernel's own port of requests (F7, EXT-8). */
      the_kernels_port,
      /** The port of requests of an extension of the phone, by its name and its manifest's touches (EXT-2). */
      port_of_requests: (extension: {
        readonly name: string
        readonly touches: readonly boundary.port[]
      }) => wired.port_of_requests(extension),
      /** The kernel's entry (PER-25), one envelope at a time, as the collector hands it. */
      entry: (envelope: AnEnvelopeCollected): Promise<void> => wired.entry(envelope),
      /** The extensions the app carries, hosted now (EXT-15). */
      extensions: (): readonly AnExtensionHostedOnThePhone[] => wired.extensions,
      /** An extension hosted, by its manifest's name; none if the app does not carry it. */
      the_extension: (name: string): AnExtensionHostedOnThePhone | undefined =>
        wired.the_extension(name),
      /** The extensions' partitions (EXT-14), the oracle's. */
      partitions: storage,
      /** The kernel's trace (EXT-6), the trees' (PER-14), the extensions' notices (EXT-2), in order. */
      traced: a_view_of(traced),
      /** Writes an entry of the kernel's trace (EXT-6): a frame's fence's, which the screens' door refuses (EXT-4, WEB-23). */
      trace,
      tree_traced: a_view_of(tree_traced),
      notices: a_view_of(notices),
      /** Tells, at each trace or notice written, until the returned function is called (WEB-19). */
      when_written: (tell: () => void): (() => void) => {
        listening.add(tell)
        return () => {
          listening.delete(tell)
        }
      },
      /** One pass of the collector (DOM-17): its first fault thrown once it is over. */
      collects,
      /** What the collector handed the entry, in order. */
      collected: (): readonly AnEnvelopeCollected[] => [...collected],
      /** The ticket of a bond as the phone shows it (BND-8, BND-9), none for one not ready. */
      the_ticket_shown: the_ticket_shown({
        clock,
        address_book: { my_ticket: address_book.my_ticket },
        machine_of,
      }),
      // The durable consumers, wired and not started (CFG-2): each a function that starts it.
      the_executors,
      the_reactions,
      /** The app opens: `user`'s executor runs, her activities carried out as they come, until it stops. */
      the_app: (): zz.EffectExecutor => {
        const started = the_user_s_executor({ ...executor_ports(), returns: user })
        the_app_open = started
        return {
          stop: async () => {
            if (the_app_open === started) the_app_open = undefined
            await started.stop()
          },
          redeliver: started.redeliver,
          discard: started.discard,
        }
      },
      /** The extensions follow the office (EXT-15): started, loaded and unloaded as it says. */
      the_extensions_follow_the_office: (): TheFollowing => the_following(),
      /**
       * An update of the app with these extensions (EXT-7, EXT-10): each
       * hosted unloaded, then the phone wired again over the same cell and
       * partitions, its office over the manifests installed now; a
       * composition fault throws, as at the start. The extensions are not
       * loaded: the node's start does it (EXT-15).
       */
      updated_to: async (extensions: readonly AnExtensionOfTheApp[]): Promise<void> => {
        for (const each of wired.extensions) await each.hosted.unload()
        wired = wired_over(extensions)
      },
    }
  }

/** A phone, as the `memory` stack starts it: over the oracle's partitions unless its storage gives others. */
export type Phone<partitions extends APhonesPartitions = Partitions> = Awaited<
  ReturnType<ReturnType<typeof phone<partitions>>>
>
