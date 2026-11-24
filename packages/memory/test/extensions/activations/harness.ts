// The harness of the stories of the extensions' office (TST-1, TST-2,
// TST-3; README of `extensions`, § Stories to prove): a phone whose storage
// holds the office's state beside the address book's (MBX-7, GR-3), the
// ports of both over it, the manifests installed the composition's
// (`greetings`, composed from its `manifest.json` and translated by the
// kernel's adapter, `the_manifest_to_accept`), and the office's executor,
// whose delivery of a question is the story's: the kernel's port of
// requests and its leaf on `known` are step 13's. The storage is a
// factory's (TST-1): a cell of q-'s oracle unless another (`on_a_cell`), so
// that an adapter of `extensions` runs the same stories (`stories.ts`) as
// its conformance suite. An update of the app is the same storage with
// other manifests installed. The user's commands are sent as her entry
// would send them (`self`, step 13); the clock and the operations are the
// story's (TST-3). A story observes only what the ports give: the events of
// a command, the entries of a read, the facts of the log since the story
// began, the entries the executor holds; never the storage's state.

import {
  compose_an_extension,
  the_kernels_offer,
  the_manifest_to_accept,
} from '@q-mino/adapters-common'
import * as zz from '@q-mino/domains/library'
import { majors as activations_majors } from '@q-mino/domains/extensions/activations/_majors.ts'
import { registry as activations_registry } from '@q-mino/domains/extensions/activations/_registry.ts'
import {
  learn_the_extensions_in_common,
  type activate_an_extension,
} from '@q-mino/domains/extensions/activations/_usecase.ts'
import type { ask_for_the_extensions_in_common } from '@q-mino/domains/extensions/activations/_effect.ts'
import { manifest } from '@q-mino/domains/extensions/activations/_value.ts'
import { majors as address_book_majors } from '@q-mino/domains/bonds/address_book/_majors.ts'
import { kept_bond, made_face } from '@q-mino/domains/bonds/address_book/_value.ts'
import manifest_json from '@q-mino/greetings/manifest.json' with { type: 'json' }
import {
  bonds_ports,
  cell,
  extensions_ports,
  log,
  no_activation,
  no_bond,
  seen_by,
  type BondsState,
  type ExtensionsState,
} from '../../../src/index.ts'
import { fake_primitives } from '../../seals/primitives.ts'
import { until_quiet } from '../../quiet.ts'

/** The zone of the phone's clock, in the stories. */
export const time_zone = zz.time_zone.parse('Europe/Rome')

/** The scope of the user's entry, under which her commands are sent: `self`'s leaves, step 13. */
export const the_scope_of_the_user = 'persona/self'

/** The relay of the stories (BND-4). */
const the_relay = 'https://relay.q-mino.test'

/** A phone's cell: the office of the extensions and the address book, side by side (MBX-7, GR-3). */
type PhoneState = ExtensionsState & BondsState

/** A command's operation, if the story names it. */
export interface Sent {
  readonly operation?: string
}

/** The input of a command use case of the office, as the user's entry gives it. */
type Given<use_case> = Parameters<zz.CommandUseCasePort<use_case>>[1]

/** A manifest as the user's entry gives it to the office, the one she is shown. */
export type Manifest = Given<typeof activate_an_extension>['manifest']

/**
 * Greetings' manifest as the kernel composed it from its `manifest.json`
 * and translated it into the office's words: what the phones of the stories
 * have installed, and what the user is shown.
 */
export const greetings = (() => {
  const composition = compose_an_extension(the_kernels_offer([]))(manifest_json)
  if (composition.composition === 'a_fault') throw new Error(composition.message)
  return the_manifest_to_accept(composition.composed.manifest)
})()

/** Every event of a port's stream, until it ends. */
export const all = async <event>(events: AsyncIterable<event>): Promise<readonly event[]> => {
  const every: event[] = []
  for await (const event of events) every.push(event)
  return every
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

/** A question as the office asks it: the payload of `ask_for_the_extensions_in_common`. */
export type AQuestion = ask_for_the_extensions_in_common

/** What came back of a question, the input of its return. */
export type WhatCameBack = Given<typeof learn_the_extensions_in_common>['what_came_back']

/**
 * How the story answers a question (step 13 wires the kernel's port of
 * requests and the peer's leaf): what came back, or a delivery exhausted
 * with its reason, a dead letter.
 */
export type Answering = (
  question: AQuestion,
) => Promise<WhatCameBack | { readonly exhausted: string }>

/**
 * A bond of the phone's address book as the stories start from it: kept,
 * with its name; their face's key and mailbox if the story has a phone of
 * theirs (the stories of two nodes, `../harness.ts`), else made up.
 */
export interface ABond {
  readonly id: string
  readonly name: string
  readonly their_face?: {
    readonly key: string
    readonly mailbox: { readonly deposit_address: string; readonly relays: readonly string[] }
  }
}

/**
 * How a phone starts: its owner's face (and its key, if the story's safe
 * made it), its bonds, the manifests installed, its clock's first instant,
 * or the story's clock, which it then reads.
 */
export interface Start {
  readonly face: string
  readonly face_key?: string
  readonly bonds: readonly ABond[]
  readonly installed: readonly Manifest[]
  readonly at: string
  readonly clock?: zz.Clock
}

/** A key of a face, the address book's form, from a letter (no secret: the stories never sign). */
const a_key = (letter: string): string => `${letter.repeat(42)}A`

/**
 * The address book a story starts from (BND-1, GR-3): the user's face, made,
 * and her bonds, kept, as the address book's stories make them (part 11.2),
 * written as its state since this office reads it only through
 * `the_bond_exists`.
 */
const an_address_book = (start: Start): BondsState => {
  const face = made_face.parse({
    id: start.face,
    status: 'made',
    name: start.face,
    position: { place: 'at_the_top' },
    public_key: start.face_key ?? a_key('F'),
  })
  const bonds = start.bonds.map((bond, at) =>
    kept_bond.parse({
      id: bond.id,
      status: 'kept',
      name: bond.name,
      my_face_id: start.face,
      their_face: {
        key: bond.their_face?.key ?? a_key(String.fromCharCode(66 + at)),
        introduced_as: bond.name,
      },
      their_mailbox: bond.their_face?.mailbox ?? {
        deposit_address: `D-${bond.id}`,
        relays: [the_relay],
      },
      my_mailbox: { deposit_address: `D-mine-${bond.id}`, relays: [the_relay] },
      expires_at: start.at,
      handshake: { way: 'in_person', at: start.at },
      confirmation: { state: 'received', at: start.at },
      my_introduction: { state: 'sent', at: start.at },
      their_introduction: { state: 'received', declared_at: start.at },
    }),
  )
  return {
    address_book: {
      faces: new Map([[face.id, face]]),
      bonds: new Map(bonds.map((bond) => [bond.id, bond])),
    },
  }
}

/** The manifests of the office's extensions, as the office is given them (EXT-7). */
type Installed = Parameters<typeof extensions_ports>[1]

/** The office's ports over a phone's storage, with the manifests installed. */
type TheOffice = ReturnType<ReturnType<typeof extensions_ports>>

/** The address book's ports over a phone's storage. */
type TheAddressBook = ReturnType<ReturnType<typeof bonds_ports>>

/**
 * What a phone of the stories keeps (TST-1), as a factory gives it, with
 * the address book of the story's start: the office's ports and the
 * address book's over one storage (MBX-7, GR-3), its fact log (DOM-17), its
 * outbox and the executor's state (DOM-14), the versions it keeps (DOM-22),
 * the entries the executor holds. The oracle's cell is one (`on_a_cell`);
 * IndexedDB's another (`on_indexeddb.test.ts`).
 */
export interface AStorageUnderTest {
  readonly stored_versions: zz.StoredVersions
  readonly log: zz.FactLog
  readonly outbox: zz.Outbox
  readonly executor: zz.ExecutorState
  readonly held: () => Promise<readonly zz.HeldEntry[]>
  readonly office: (installed: Installed) => (versions: zz.Versions) => TheOffice
  readonly address_book: (versions: zz.Versions) => TheAddressBook
  /** Whether the storage is at work, a transaction of it not yet over (TST-11); the oracle's cell never is. */
  readonly at_work: () => boolean
}

/** How the phone of a story is kept (TST-1): a storage that starts with the story's address book. */
export type AFactory = (start: Start) => Promise<AStorageUnderTest>

/** A phone's storage on a new cell of q-'s oracle (TST-2), its address book written as its state. */
export const on_a_cell: AFactory = (start) => {
  const made = cell<PhoneState>({
    initial: { ...no_activation, ...no_bond, ...an_address_book(start) },
  })
  return Promise.resolve({
    stored_versions: made.stored_versions,
    log: log(made),
    outbox: made.outbox,
    executor: made.executor,
    held: () => Promise.resolve(made.held()),
    office: (installed) => extensions_ports(made, installed),
    address_book: bonds_ports(seen_by<BondsState, PhoneState>(made), fake_primitives),
    at_work: () => false,
  })
}

/** A secret of a ticket of theirs, the address book's form: kept as given when her phone opens it (BND-10). */
const a_ticket_s_secret = `${'S'.repeat(85)}A`

/**
 * The address book a story starts from, made through its commands (BND-8,
 * BND-10), on a storage the story cannot write as its state: her face asked
 * for and made with its key, as the safe's reaction keeps it; for each
 * bond, her ticket asked for and ready at her mailbox of it, then their
 * ticket opened, at a distance, the bond kept. The office reads of it only
 * `the_bond_exists`, the same as of the state written (`an_address_book`);
 * its facts come before the story, which reads none of them (`recorded`).
 */
export const the_address_book_made_through_its_commands = async (
  storage: AStorageUnderTest,
  start: Start,
): Promise<void> => {
  const versions = await zz.versions([activations_majors, address_book_majors])({
    stored: storage.stored_versions,
  })
  const address_book = storage.address_book(versions)
  let operations = 0
  /** A command of the address book sent at the start's instant, which applies, or the story fails. */
  const sends = async <input>(
    use_case: string,
    port: (
      context: zz.CommandRootContext,
      input: input,
    ) => AsyncIterable<{ readonly outcome: string }>,
    input: input,
  ): Promise<void> => {
    operations += 1
    const id = `the-start-${String(operations)}`
    const events = await all(
      port(
        {
          now: zz.date_time.parse(start.at),
          time_zone,
          operation: { id: zz.operation_id.parse(id), scope: the_scope_of_the_user },
          correlation: zz.correlation.parse(`correlation-${id}`),
          fingerprint: zz.fingerprint_of({ path: `bonds/address_book/usecase/${use_case}`, input }),
        },
        input,
      ),
    )
    if (last_of(events).outcome !== 'applied')
      throw new Error(`the address book's ${use_case} at the start: ${JSON.stringify(events)}`)
  }
  await sends('make_my_first_face', address_book.make_my_first_face, {
    face_id: start.face,
    name: start.face,
  })
  await sends('keep_the_key_of_a_face', address_book.keep_the_key_of_a_face, {
    face_id: start.face,
    public_key: start.face_key ?? a_key('F'),
  })
  for (const [at, bond] of start.bonds.entries()) {
    await sends('prepare_a_ticket', address_book.prepare_a_ticket, {
      bond_id: bond.id,
      face_id: start.face,
      relays: [the_relay],
    })
    await sends('keep_the_mailbox_of_a_ticket', address_book.keep_the_mailbox_of_a_ticket, {
      bond_id: bond.id,
      deposit_address: `D-mine-${bond.id}`,
    })
    await sends('open_their_ticket', address_book.open_their_ticket, {
      bond_id: bond.id,
      their_ticket: {
        key: bond.their_face?.key ?? a_key(String.fromCharCode(66 + at)),
        introduced_as: bond.name,
        mailbox: {
          deposit_address: bond.their_face?.mailbox.deposit_address ?? `D-${bond.id}`,
          relays: [...(bond.their_face?.mailbox.relays ?? [the_relay])],
        },
        secret: a_ticket_s_secret,
      },
      name: bond.name,
    })
  }
}

/**
 * A phone of a story, kept as the factory keeps it (the oracle's cell
 * unless another, TST-1); `updated_to` the same phone after an update of
 * the app.
 */
export const a_phone = async (start: Start, factory: AFactory = on_a_cell) => {
  const made = await factory(start)
  const versions = await zz.versions([activations_majors, address_book_majors])({
    stored: made.stored_versions,
  })
  const address_book = made.address_book(versions)
  // The phone's clock, which a story sets (`at`); every wait ended when it
  // moves. Or the story's clock, given, which the phone reads.
  let instant = zz.date_time.parse(start.at)
  const waits: (() => void)[] = []
  const clock: zz.Clock = start.clock ?? { now: () => instant, time_zone }
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
      const id = sent.operation ?? `op-${String(operations)}`
      return {
        now: clock.now(),
        time_zone: clock.time_zone,
        operation: { id: zz.operation_id.parse(id), scope: the_scope_of_the_user },
        correlation: zz.correlation.parse(`correlation-${id}`),
        fingerprint: zz.fingerprint_of({ path, input }),
      }
    }
  const when = () => ({ now: clock.now(), time_zone: clock.time_zone })
  /** Every fact the log gives, each once by its position, up to where it is caught up (DOM-17). */
  const the_facts_logged = async (): Promise<ReadonlyMap<zz.position, zz.StoredEnvelope>> => {
    const kept = new Map<zz.position, zz.StoredEnvelope>()
    for await (const event of made.log(undefined)) {
      if (event.event !== 'fact') break
      kept.set(event.position, event.fact)
    }
    return kept
  }
  // The facts the storage recorded before the story, its address book made
  // through its commands (`the_address_book_made_through_its_commands`): none on the oracle.
  const before_the_story = new Set((await the_facts_logged()).keys())
  const questions: AQuestion[] = []
  const answering: { current: Answering } = {
    current: () => Promise.resolve({ outcome: 'no_answer_came_back', why: 'no_response' }),
  }
  // The questions being answered: an answer may read the other phone's office (its storage at work, not this one's).
  let answers_in_flight = 0
  /**
   * Everything already set going has run its course, up to its next wait
   * (TST-11, `../../quiet.ts`): no transaction of its storage in flight, no
   * question of its being answered.
   */
  const quiet = (): Promise<void> =>
    until_quiet(() => made.at_work() || answers_in_flight > 0, `${start.face}'s phone quiet`)
  const executor = zz.effect_executor({
    registry: activations_registry,
    versions,
    returns: { learn_the_extensions_in_common },
  })({
    'extensions/activations/effect/ask_for_the_extensions_in_common': async (entry) => {
      questions.push(entry.payload)
      answers_in_flight += 1
      const answered = await answering.current(entry.payload).finally(() => {
        answers_in_flight -= 1
      })
      return 'exhausted' in answered
        ? { outcome: 'exhausted', reason: answered.exhausted }
        : {
            outcome: 'delivered',
            returns: { question_id: entry.payload.question_id, what_came_back: answered },
          }
    },
  })

  /** The phone with these manifests installed: the composition's, at its start or after an update. */
  const with_installed = (installed: readonly Manifest[]) => {
    const office = made.office(installed.map((each) => manifest.parse(each)))(versions)
    const reads = {
      an_extension: (name: string) => all(office.an_extension(when(), { name })),
      the_extensions_offered_to_a_bond: (bond: string) =>
        all(office.the_extensions_offered_to_a_bond(when(), { bond })),
      the_extensions_in_common: (
        bond: string,
        offered: readonly { readonly name: string; readonly majors: readonly number[] }[],
      ) =>
        all(
          office.the_extensions_in_common(when(), {
            bond,
            offered: offered.map((each) => ({ name: each.name, majors: [...each.majors] })),
          }),
        ),
      /** The address book's reads (BND-1, BND-3, BND-6): a bond's card, the user's faces, her list of bonds. */
      a_bond: (bond_id: string) => all(address_book.a_bond(when(), { bond_id })),
      my_faces: () => all(address_book.my_faces(when(), {})),
      my_bonds: () => all(address_book.my_bonds(when(), {})),
    }
    const commands = {
      activate_an_extension: (manifest: Manifest, sent?: Sent) =>
        all(
          office.activate_an_extension(
            sent_as('extensions/activations/usecase/activate_an_extension', { manifest })(sent),
            { manifest },
          ),
        ),
      deactivate_an_extension: (name: string, sent?: Sent) =>
        all(
          office.deactivate_an_extension(
            sent_as('extensions/activations/usecase/deactivate_an_extension', { name })(sent),
            { name },
          ),
        ),
      withdraw_the_offer_from_a_bond: (input: { readonly name: string; readonly bond: string }) =>
        all(
          office.withdraw_the_offer_from_a_bond(
            sent_as('extensions/activations/usecase/withdraw_the_offer_from_a_bond', input)(),
            input,
          ),
        ),
      offer_an_extension_to_a_bond: (input: { readonly name: string; readonly bond: string }) =>
        all(
          office.offer_an_extension_to_a_bond(
            sent_as('extensions/activations/usecase/offer_an_extension_to_a_bond', input)(),
            input,
          ),
        ),
      ask_a_bond_for_the_extensions_in_common: (
        input: {
          readonly bond: string
          readonly offered: readonly { readonly name: string; readonly majors: readonly number[] }[]
        },
        sent?: Sent,
      ) => {
        const given = {
          bond: input.bond,
          offered: input.offered.map((each) => ({ name: each.name, majors: [...each.majors] })),
        }
        return all(
          office.ask_a_bond_for_the_extensions_in_common(
            sent_as(
              'extensions/activations/usecase/ask_a_bond_for_the_extensions_in_common',
              given,
            )(sent),
            given,
          ),
        )
      },
      /** The user removes a bond from her address book (BND-6), as its stories do. */
      remove_a_bond: (bond_id: string) =>
        all(
          address_book.remove_a_bond(
            sent_as('bonds/address_book/usecase/remove_a_bond', { bond_id })(),
            { bond_id },
          ),
        ),
    }
    return {
      ...reads,
      ...commands,
      /** The office's read ports, as the kernel's adapter reads them (`the_kernels_reads`). */
      office: {
        an_extension: office.an_extension,
        the_extensions_offered_to_a_bond: office.the_extensions_offered_to_a_bond,
      },
      clock,
      /**
       * The phone runs until it is quiet (DOM-14): the office's executor
       * started, what is due delivered, then stopped.
       */
      runs: async (): Promise<void> => {
        const running = executor({
          outbox: made.outbox,
          state: made.executor,
          clock,
          elapsed,
          returns: office,
        })
        await quiet()
        await running.stop()
      },
      /** The story's answer to the next questions. */
      answers: (with_this: Answering) => {
        answering.current = with_this
      },
      /** The questions the executor delivered, as the kernel's port would take them (step 13). */
      questions: (): readonly AQuestion[] => [...questions],
      /** Every fact the storage recorded since the story began, in order, as its log gives them (DOM-17). */
      recorded: async (): Promise<readonly zz.StoredEnvelope[]> =>
        [...(await the_facts_logged())].flatMap(([position, fact]) =>
          before_the_story.has(position) ? [] : [fact],
        ),
      /** The entries the executor holds: its dead letters. */
      held: made.held,
      /** The phone's clock reads this instant; every wait asked for wakes, to look again. */
      at: (to: string) => {
        instant = zz.date_time.parse(to)
        for (const over of waits.splice(0)) over()
      },
    }
  }
  return {
    ...with_installed(start.installed),
    /** The phone after an update of the app, with these manifests installed (EXT-7): the same storage. */
    updated_to: (manifests: readonly Manifest[]) => with_installed(manifests),
  }
}

/** A phone under the stories, as it started or after an update. */
export type PhoneUnderTest = Omit<Awaited<ReturnType<typeof a_phone>>, 'updated_to'>
