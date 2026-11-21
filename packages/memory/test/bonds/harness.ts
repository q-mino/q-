// The harness of the address book's stories (TST-2, TST-3; README of
// `bonds`, § Stories to prove): a phone of q-'s oracle, one cell with the
// state of `bonds` and of `seals` (MBX-7), the ports of both over it, the
// consumers of the reactions of `reaction/` (GR-9, BND-12), the safe's
// executor, its deliveries the domain's `dsl` over the primitives port the
// story runs on (SEA-8), and the address book's: its waits, given back to
// their return, and the introductions it sends, which the harness keeps as
// `post` would take them (step 10). The user's commands are sent as her
// entry would send them (`self`, step 13), an introduction collected as
// the entry of `unknown` would give it (PER-11, step 13); the phone's clock
// and the operations are the story's (TST-3). A story observes only what
// the ports give: the events of a command, the entries of a read, the
// facts of the log, the letters handed to `post`; never the cell's state.
//
// The harness is parametrized by a storage factory (TST-1): the oracle's
// cell unless a suite gives another (`on_indexeddb.test.ts`), the domain's
// stories then its conformance suite. The factory gives the ports of both
// domains over its storage, the node's versions, log, outbox, executors'
// and reactions' state, and what a story reads of it, each as a function:
// the entries queued, the entries and parts held, and the time its storage
// takes to run its course (`quiet`).

import * as zz from '@q-mino/domains/library'
import { majors as address_book_majors } from '@q-mino/domains/bonds/address_book/_majors.ts'
import { registry as address_book_registry } from '@q-mino/domains/bonds/address_book/_registry.ts'
import { let_a_ticket_expire } from '@q-mino/domains/bonds/address_book/_usecase.ts'
import { the_content_a_ticket_s_secret_signs } from '@q-mino/domains/bonds/address_book/_dsl.ts'
import { majors as safe_majors } from '@q-mino/domains/seals/safe/_majors.ts'
import { registry as safe_registry } from '@q-mino/domains/seals/safe/_registry.ts'
import {
  keep_a_mailbox_key,
  keep_a_new_seed_and_its_face,
} from '@q-mino/domains/seals/safe/_usecase.ts'
import type { Bytes, Primitives } from '@q-mino/domains/seals/safe/_dsl.ts'
import { registry as first_face_registry } from '@q-mino/domains/reaction/first_face/_registry.ts'
import { registry as ticket_registry } from '@q-mino/domains/reaction/ticket/_registry.ts'
import {
  bonds_ports,
  cell,
  log,
  no_bond,
  no_secret,
  seals_ports,
  seen_by,
  type BondsState,
  type SealsState,
} from '../../src/index.ts'
import { all, quiet, the_safe_s_machine, type AKernelsStorage } from '../seals/harness.ts'

/** The zone of the phone's clock, in the stories. */
export const time_zone = zz.time_zone.parse('UTC')

/** The relay of the stories (BND-4): one, in stage 1. */
export const the_relay = 'https://relay.q-mino.test'

/** A phone's cell: the address book and the safe, side by side (MBX-7). */
type PhoneState = BondsState & SealsState

/** The scope of the user's entry, under which her commands are sent: `self`'s leaves, step 13. */
export const the_scope_of_the_user = 'persona/self'

/** The scope of the entry of an introduction collected: `unknown`'s leaf, step 13 (PER-11). */
export const the_scope_of_an_introduction = 'persona/unknown'

/** A command's operation, if the story names it, and its scope: the user's, by default. */
export interface Sent {
  readonly operation?: string
  readonly scope?: string
}

/** A ticket as its holder shows it, in a QR or after `#` in a link (BND-8, BND-9). */
export interface Shown {
  readonly key: string
  readonly introduced_as: string
  readonly mailbox: { readonly deposit_address: string; readonly relays: readonly string[] }
  readonly secret: string
}

/** An introduction handed to `post`, as the address book queued it (`send_my_introduction`). */
export interface Letter {
  readonly bond_id: string
  readonly their_ticket: Shown
}

/**
 * An introduction as it reaches the other phone (BND-10): at the D of the
 * ticket it presents itself to, with that ticket's secret, the face that
 * signed it, and the mailbox its sender's ticket declares. What `post`
 * carries from the letter (step 10), signed by the sender's face.
 */
export interface Introduction {
  readonly at: string
  readonly secret: string
  readonly their_face: { readonly key: string; readonly introduced_as: string }
  readonly their_mailbox: { readonly deposit_address: string; readonly relays: readonly string[] }
}

/**
 * The world's random bytes for a phone: each draw new, of the length asked,
 * from a number the story gives each phone so that two phones never draw
 * the same seed (TST-3).
 */
const a_world_of = (primitives: Primitives, phone: number): Primitives => {
  let draws = 0
  return {
    ...primitives,
    random_bytes: (length): Bytes => {
      draws += 1
      return Uint8Array.from({ length }, (_, at) => (phone * 97 + draws * 31 + at * 7) & 255)
    },
  }
}

/** A command's last event, the one that closes its stream. */
export const last_of = <event>(events: readonly event[]): event => {
  const last = events.at(-1)
  if (last === undefined) throw new Error('a command gave no event')
  return last
}

/** The entries of a read's snapshot, its first event. */
export const entries_of = <entry>(
  events: readonly (
    | { readonly event: 'snapshot'; readonly entries: readonly entry[] }
    | { readonly event: 'invalid_request' }
  )[],
): readonly entry[] => {
  const first = events[0]
  if (first?.event !== 'snapshot') throw new Error('a read began with no snapshot')
  return first.entries
}

/** How a phone starts: its number for the world's draws, its clock's first instant. */
export interface Start {
  readonly phone: number
  readonly at: string
}

/**
 * What a phone of a story keeps: the ports of the address book and of the
 * safe, the node's versions, log, outbox, executors' and reactions' state;
 * its entries queued, its entries and parts held.
 */
export type AnAddressBooksStorage = Pick<
  AKernelsStorage,
  | 'address_book'
  | 'safe'
  | 'stored_versions'
  | 'log'
  | 'outbox'
  | 'executor'
  | 'reactions'
  | 'queued'
  | 'held'
  | 'held_parts'
  | 'quiet'
>

/** How a suite makes the storage of a story's phone (TST-1): the oracle's cell, or an adapter's. */
export type AnAddressBooksFactory = () => Promise<AnAddressBooksStorage>

/** A phone's storage on a new cell of the oracle: the address book and the safe, side by side (MBX-7). */
export const the_address_book_on_a_cell: AnAddressBooksFactory = () => {
  const made = cell<PhoneState>({ initial: { ...no_bond, ...no_secret } })
  return Promise.resolve({
    address_book: (primitives: Primitives) =>
      bonds_ports(seen_by<BondsState, PhoneState>(made), primitives),
    safe: (primitives: Primitives) =>
      seals_ports(seen_by<SealsState, PhoneState>(made), primitives),
    stored_versions: made.stored_versions,
    log: log(made),
    outbox: made.outbox,
    executor: made.executor,
    reactions: made.reactions,
    queued: () => Promise.resolve(made.entries()),
    held: () => Promise.resolve(made.held()),
    held_parts: () => Promise.resolve(made.held_parts()),
    quiet,
  })
}

/** A phone of a story, over a primitives port, on the storage a suite makes: the oracle's cell, unless another. */
export const a_phone = async (
  primitives: Primitives,
  start: Start,
  storage: AnAddressBooksFactory = the_address_book_on_a_cell,
) => {
  const made = await storage()
  const world = a_world_of(primitives, start.phone)
  const versions = await zz.versions([address_book_majors, safe_majors])({
    stored: made.stored_versions,
  })
  const address_book = made.address_book(world)(versions)
  const safe = made.safe(world)(versions)
  // The phone's clock, which a story sets (`at`); the time that passes, every
  // wait ended when the story moves the clock.
  let instant = zz.date_time.parse(start.at)
  const waits: (() => void)[] = []
  const clock = { now: () => instant, time_zone }
  const elapsed = () =>
    new Promise<void>((over) => {
      waits.push(over)
    })
  let operations = 0
  /** The context of a command sent under an operation (DOM-11), its fingerprint over its use case's path and its input. */
  const sent_as =
    (path: string, input: unknown) =>
    (sent: Sent = {}): zz.CommandRootContext => {
      operations += 1
      const id = sent.operation ?? `op-${String(start.phone)}-${String(operations)}`
      return {
        now: zz.in_zone(time_zone)(instant),
        time_zone,
        operation: { id: zz.operation_id.parse(id), scope: sent.scope ?? the_scope_of_the_user },
        correlation: zz.correlation.parse(`correlation-${id}`),
        fingerprint: zz.fingerprint_of({ path, input }),
      }
    }
  const when = () => ({ now: zz.in_zone(time_zone)(instant), time_zone })
  const facts = made.log
  // The letters the address book hands to `post` (step 10): kept, in order.
  const letters: Letter[] = []
  const the_safe_s_executor = zz.effect_executor({
    registry: safe_registry,
    versions,
    returns: { keep_a_new_seed_and_its_face, keep_a_mailbox_key },
  })(the_safe_s_machine(world))
  const the_address_book_s_executor = zz.effect_executor({
    registry: address_book_registry,
    versions,
    returns: { let_a_ticket_expire },
  })({
    'bonds/address_book/effect/wait_until_the_ticket_expires': zz.returns_the_payload,
    'bonds/address_book/effect/send_my_introduction': (entry) => {
      letters.push(entry.payload)
      return Promise.resolve({ outcome: 'delivered' })
    },
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
  const ports = { outbox: made.outbox, state: made.executor, clock, elapsed }
  /**
   * The phone runs until it is quiet (DOM-14, DOM-16): the reactions and both
   * executors started, what is due delivered, then stopped. A wait not due
   * yet stays in the outbox, delivered once the clock reaches it.
   */
  const runs = async (): Promise<void> => {
    const consumers = { state: made.reactions, clock }
    const running = [
      the_first_face(consumers),
      the_ticket(consumers),
      the_safe_s_executor({ ...ports, returns: safe }),
      the_address_book_s_executor({ ...ports, returns: address_book }),
    ]
    await made.quiet()
    for (const each of running) await each.stop()
  }
  /**
   * The address book's waits come back, and nothing else runs (DOM-14): a
   * ticket's 48 hours over while the safe has not drawn its mailbox yet.
   */
  const the_waits_come_back = async (): Promise<void> => {
    const executor = the_address_book_s_executor({ ...ports, returns: address_book })
    await made.quiet()
    await executor.stop()
  }
  const reads = {
    my_faces: () => all(address_book.my_faces(when(), {})),
    my_bonds: () => all(address_book.my_bonds(when(), {})),
    a_bond: (bond_id: string) => all(address_book.a_bond(when(), { bond_id })),
    the_bond_at_my_mailbox: (deposit_address: string) =>
      all(address_book.the_bond_at_my_mailbox(when(), { deposit_address })),
    my_ticket: (bond_id: string) => all(address_book.my_ticket(when(), { bond_id })),
    the_ticket_at_my_mailbox: (deposit_address: string) =>
      all(address_book.the_ticket_at_my_mailbox(when(), { deposit_address })),
    the_mailboxes_i_collect: () => all(address_book.the_mailboxes_i_collect(when(), {})),
  }
  /** What the safe signs for a face (SEA-6): the signature of a content, as `post` and the ticket ask it. */
  const signs = async (face_id: string, content: string): Promise<string | undefined> =>
    entries_of(await all(safe.a_content_signed_by_a_face(when(), { face_id, content })))[0]
      ?.signature
  const commands = {
    make_my_first_face: (input: { readonly face_id: string; readonly name: string }, sent?: Sent) =>
      all(
        address_book.make_my_first_face(
          sent_as('bonds/address_book/usecase/make_my_first_face', input)(sent),
          input,
        ),
      ),
    prepare_a_ticket: (
      input: { readonly bond_id: string; readonly face_id: string; readonly relays: string[] },
      sent?: Sent,
    ) =>
      all(
        address_book.prepare_a_ticket(
          sent_as('bonds/address_book/usecase/prepare_a_ticket', input)(sent),
          input,
        ),
      ),
    open_their_ticket: (
      input: { readonly bond_id: string; readonly their_ticket: Shown; readonly name: string },
      sent?: Sent,
    ) => {
      const given = {
        ...input,
        their_ticket: {
          ...input.their_ticket,
          mailbox: {
            ...input.their_ticket.mailbox,
            relays: [...input.their_ticket.mailbox.relays],
          },
        },
      }
      return all(
        address_book.open_their_ticket(
          sent_as('bonds/address_book/usecase/open_their_ticket', given)(sent),
          given,
        ),
      )
    },
    accept_their_introduction: (
      input: {
        readonly bond_id: string
        readonly secret: string
        readonly their_face: { readonly key: string; readonly introduced_as: string }
        readonly their_mailbox: {
          readonly deposit_address: string
          readonly relays: readonly string[]
        }
      },
      sent: Sent = {},
    ) => {
      const given = {
        ...input,
        their_face: { ...input.their_face },
        their_mailbox: { ...input.their_mailbox, relays: [...input.their_mailbox.relays] },
      }
      return all(
        address_book.accept_their_introduction(
          sent_as(
            'bonds/address_book/usecase/accept_their_introduction',
            given,
          )({ scope: the_scope_of_an_introduction, ...sent }),
          given,
        ),
      )
    },
    rename_a_bond: (input: { readonly bond_id: string; readonly name: string }, sent?: Sent) =>
      all(
        address_book.rename_a_bond(
          sent_as('bonds/address_book/usecase/rename_a_bond', input)(sent),
          input,
        ),
      ),
    remove_a_bond: (input: { readonly bond_id: string }, sent?: Sent) =>
      all(
        address_book.remove_a_bond(
          sent_as('bonds/address_book/usecase/remove_a_bond', input)(sent),
          input,
        ),
      ),
    keep_the_mailbox_of_a_ticket: (
      input: { readonly bond_id: string; readonly deposit_address: string },
      sent?: Sent,
    ) =>
      all(
        address_book.keep_the_mailbox_of_a_ticket(
          sent_as('bonds/address_book/usecase/keep_the_mailbox_of_a_ticket', input)(sent),
          input,
        ),
      ),
  }
  const the_phone = {
    ...reads,
    ...commands,
    signs,
    runs,
    the_waits_come_back,
    /** The safe's face, as `post` reads it (SEA-6): its id and public key, no secret. */
    the_safe_s_key_of: async (face_id: string): Promise<string | undefined> =>
      entries_of(await all(safe.a_content_signed_by_a_face(when(), { face_id, content: 'AA' })))[0]
        ?.public_key,
    /** The safe's key of a bond's mailbox, as who collects reads it (SEA-4): its D and its collect secret. */
    the_safe_s_mailbox_of: async (bond_id: string) =>
      entries_of(await all(safe.the_key_of_a_mailbox(when(), { mailbox_key_id: bond_id })))[0],
    /** The phone's clock reads this instant; every wait asked for wakes, to look again. */
    at: (to: string) => {
      instant = zz.date_time.parse(to)
      for (const over of waits.splice(0)) over()
    },
    /**
     * The ticket of a bond as the phone shows it (BND-8, BND-9): `my_ticket`,
     * with its secret, the safe's signature by the ticket's face over the
     * content its D makes; nothing for a ticket not ready.
     */
    shows: async (bond_id: string): Promise<Shown | undefined> => {
      const [ticket] = entries_of(await reads.my_ticket(bond_id))
      if (ticket === undefined) return undefined
      const secret = await signs(
        ticket.my_face_id,
        the_content_a_ticket_s_secret_signs(ticket.my_mailbox.deposit_address),
      )
      return secret === undefined
        ? undefined
        : {
            key: ticket.key,
            introduced_as: ticket.introduced_as,
            mailbox: ticket.my_mailbox,
            secret,
          }
    },
    /** The introductions the address book handed to `post`, in order. */
    letters: (): readonly Letter[] => [...letters],
    /**
     * What `post` carries from a letter (step 10): my side of the bond (`a_bond`,
     * `my_faces`), their ticket's secret, deposited at their ticket's D.
     */
    carries: async (letter: Letter): Promise<Introduction> => {
      const [mine] = entries_of(await reads.a_bond(letter.bond_id))
      if (mine === undefined) throw new Error(`no bond ${letter.bond_id} to introduce`)
      const my_face = entries_of(await reads.my_faces()).find((face) => face.id === mine.my_face_id)
      if (my_face === undefined) throw new Error(`no face ${mine.my_face_id} to introduce`)
      return {
        at: letter.their_ticket.mailbox.deposit_address,
        secret: letter.their_ticket.secret,
        their_face: { key: my_face.public_key, introduced_as: my_face.name },
        their_mailbox: mine.my_mailbox,
      }
    },
    /**
     * An introduction collected at a mailbox of the phone's, given as the entry
     * of `unknown` gives it (PER-11, step 13): the bond of the ticket ready at
     * that D, or the bond kept there (the QR crossed); none, nothing invoked.
     */
    receives: async (introduction: Introduction, sent?: Sent) => {
      const [ticket] = entries_of(await reads.the_ticket_at_my_mailbox(introduction.at))
      const [kept] = entries_of(await reads.the_bond_at_my_mailbox(introduction.at))
      const bond_id = ticket?.id ?? kept?.id
      return bond_id === undefined
        ? undefined
        : commands.accept_their_introduction(
            {
              bond_id,
              secret: introduction.secret,
              their_face: introduction.their_face,
              their_mailbox: introduction.their_mailbox,
            },
            sent,
          )
    },
    /** Every fact the cell recorded, in order, as its log gives them (DOM-17). */
    recorded: async (): Promise<readonly zz.StoredEnvelope[]> => {
      const kept = new Map<zz.position, zz.StoredEnvelope>()
      for await (const event of facts(undefined)) {
        if (event.event !== 'fact') break
        kept.set(event.position, event.fact)
      }
      return [...kept.values()]
    },
    /** The entries queued with the facts, in order (DOM-14). */
    queued: made.queued,
    /** The entries the executors hold, and the parts the reactions hold: their dead letters. */
    held: async (): Promise<readonly (zz.HeldEntry | zz.HeldPart)[]> => [
      ...(await made.held()),
      ...(await made.held_parts()),
    ],
  }
  return the_phone
}

/** A phone under the stories: the oracle's, over the primitives port a suite gives (TST-1). */
export type PhoneUnderTest = Awaited<ReturnType<typeof a_phone>>

/**
 * A phone through its first start and a ticket (BND-8): the face made under
 * `face_id`, named `name`; a ticket for each bond named, on the relay,
 * asked for at the phone's instant and ready once the phone ran.
 */
export const a_phone_with = async (
  primitives: Primitives,
  start: Start & {
    readonly face_id: string
    readonly name: string
    readonly tickets?: readonly string[]
  },
  storage: AnAddressBooksFactory = the_address_book_on_a_cell,
): Promise<PhoneUnderTest> => {
  const phone = await a_phone(primitives, start, storage)
  await phone.make_my_first_face({ face_id: start.face_id, name: start.name })
  await phone.runs()
  for (const bond_id of start.tickets ?? []) {
    await phone.prepare_a_ticket({ bond_id, face_id: start.face_id, relays: [the_relay] })
  }
  await phone.runs()
  return phone
}
