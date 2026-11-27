// The `memory` stack (CFG-3, TST-2, PER-19; step 17): phones and the relay
// in one process, `mailbox` imported in place of HTTP and reached only
// through the personas of the relay's desk. One relay over its cell, its
// waits' executor wired and not started; phones over it, each over a cell
// of its own, the post's deposits and the collector's reads carried to the
// relay by the two transports in process (`the_relay_s_transports`). A
// phone's transports pass through a hook, so that a test decorates them
// (TST-4: loss, duplication, abort, ADP-5) and an adapter's step puts its
// own in their place (TST-1: HTTP in step 20, the phone's in step 25). The
// stack keeps no state of its own and starts no consumer: what runs, and
// when, is its caller's (CFG-2).

import type { ACollect } from '@q-mino/adapters-common'
import { depositor } from '@q-mino/domains/desk/depositor/_version.ts'
import { holder } from '@q-mino/domains/desk/holder/_version.ts'
import * as zz from '@q-mino/domains/library'
import type { Deposited, MailboxPort } from '@q-mino/domains/post/_dsl.ts'
import { cell, type Cell } from '../oracle/index.ts'
import {
  a_new_phone,
  on_the_cell,
  phone,
  type APhonesPartitions,
  type Phone,
  type PhoneCell,
  type PhoneStorage,
  type Release as PhoneRelease,
  type World as PhoneWorld,
} from '../phone/index.ts'
import {
  a_new_relay,
  relay,
  the_desks_interface,
  the_scope_of_a_deposit,
  type HashOfACollectSecret,
  type Relay,
  type RelayState,
  type Release as RelayRelease,
} from '../relay/index.ts'

/**
 * The two transports between a phone and the relay (CFG-3, ADP-4): the
 * post's mailbox port, its deposits (PST-10), and the collect port, the
 * collector's reads of its mailboxes (MBX-6).
 */
export interface TheRelaysTransports {
  readonly mailbox: MailboxPort
  readonly collect: ACollect
}

/** What of the relay its transports reach: the trees of the desk's two personas (PER-19). */
export type TheDesk = Pick<Relay, 'depositor' | 'holder'>

/**
 * What the transports in process are given beside the desk: the relay's
 * clock, the instant of each request it takes; the hash of its desk's
 * interface, which turns a collect secret R into its D (MBX-6).
 */
export interface TheDesksSide {
  readonly clock: zz.Clock
  readonly hash: HashOfACollectSecret
}

/** Every event of a port's stream, until it ends. */
const every_event_of = async <event>(events: AsyncIterable<event>): Promise<readonly event[]> => {
  const every: event[] = []
  for await (const event of events) every.push(event)
  return every
}

/** The relay's answer to a deposit, in the post's words (PST-10): its last event. */
const told_in_the_post_s_words = (events: readonly { readonly event: string }[]): Deposited => {
  const answer = events.at(-1)?.event
  if (answer === 'the_envelope_is_kept') return { outcome: 'kept' }
  if (answer === 'identity_already_used') return { outcome: 'kept_already' }
  return { outcome: 'refused', why: answer ?? 'no_event' }
}

/**
 * The transports between a phone and the relay, in process (CFG-3, ADP-4,
 * MBX-6): what a phone's request shows turned into the desk's `Caller` by
 * the desk's interface, and the request handed to the tree of its persona
 * at the relay's instant, at the version of the desk's surface the stack
 * was built at. A deposit shows nothing and goes to the depositor, under
 * the post's operation in the depositor's scope (PST-11): the relay's
 * answer told in the post's words, `kept`, `kept_already` (its
 * `identity_already_used`) or `refused` with what it said. A collect shows
 * the mailbox's R and goes to the holder: the deposits of its snapshot, in
 * the relay's order, the stream let go; a read that does not begin with a
 * snapshot throws, as a transport that fails. The transports carry the
 * request and its answer, and translate nothing more (ADP-4); the relays a
 * mailbox declares are this one, in process.
 */
export const the_relay_s_transports = (desk: TheDesk, side: TheDesksSide): TheRelaysTransports => {
  const the_interface = the_desks_interface(side.hash)
  const now = () => ({
    now: side.clock.now(),
    time_zone: side.clock.time_zone,
  })
  return {
    mailbox: {
      deposit: async (deposit) => {
        const caller = await the_interface({ shows: 'nothing' })
        const operation = zz.operation_id.parse(deposit.operation)
        const events = await every_event_of(
          desk.depositor.deposit_an_envelope(
            {
              caller,
              version: depositor[zz.$Version],
              ...now(),
              operation: { id: operation, scope: the_scope_of_a_deposit },
              correlation: zz.correlation.parse(deposit.operation),
            },
            { deposit_address: deposit.deposit_address, envelope: deposit.envelope },
          ),
        )
        return told_in_the_post_s_words(events)
      },
    },
    collect: async (mailbox) => {
      const caller = await the_interface({
        shows: 'a_collect_secret',
        secret: mailbox.collect_secret,
      })
      const stream = desk.holder
        .collect_the_envelopes(
          { caller, version: holder[zz.$Version], ...now() },
          { deposit_address: mailbox.deposit_address },
        )
        [Symbol.asyncIterator]()
      const first = await stream.next()
      await stream.return?.()
      if (first.done === true) throw new Error(`the collect at ${mailbox.deposit_address} ended`)
      if (first.value.event !== 'snapshot')
        throw new Error(`the collect at ${mailbox.deposit_address} began with ${first.value.event}`)
      return first.value.entries.map((entry) => ({
        deposit_id: entry.deposit_id,
        envelope: entry.envelope,
      }))
    },
  }
}

/**
 * The world of the stack's relay: its clock and the time that passes
 * (MBX-1, MBX-2, DOM-14), and the hash of its desk's interface, R into D,
 * the one the phones' safes draw D with (SEA-4).
 */
export interface TheStacksWorld {
  readonly clock: zz.Clock
  readonly elapsed: zz.Elapsed
  readonly hash: HashOfACollectSecret
}

/** A phone's world in the stack, but its transports, which the stack gives. */
export type APhonesWorld = Omit<PhoneWorld, 'mailbox' | 'collect'>

/**
 * A phone started over the stack's relay: its world but the transports;
 * its cell, a new phone's unless given; its release (TST-4, on Shed's
 * model); and the hook its transports pass through, the stack's in process
 * as they are unless it gives others.
 */
export interface APhoneOverTheRelay {
  readonly world: APhonesWorld
  readonly cell?: PhoneCell
  /** What the phone keeps, if not the oracle's cell: IndexedDB's (step 21). */
  readonly storage?: PhoneStorage
  readonly release?: PhoneRelease
  readonly transports?: (in_process: TheRelaysTransports) => TheRelaysTransports
}

/**
 * The `memory` stack (CFG-3): the relay over its cell, a new relay's unless
 * given, started in its world; the transports in process to its desk; and
 * phones started over it, each through the hook of its transports (CFG-2:
 * a phone's composition fault stops its start). Its waits' executor and
 * the phones' consumers are wired, not started: the caller runs them.
 */
export const a_stack =
  (relay_cell: Cell<RelayState> = cell({ initial: a_new_relay }), release: RelayRelease = {}) =>
  async (world: TheStacksWorld) => {
    const the_relay = await relay(
      relay_cell,
      release,
    )({
      clock: world.clock,
      elapsed: world.elapsed,
    })
    const in_process = the_relay_s_transports(the_relay, world)
    return {
      /** The relay, its desk's trees, its fact log and its waits' executor, a function that starts it (DOM-14). */
      relay: the_relay,
      /** The transports in process to the relay's desk, as every phone is given them before its hook. */
      transports: in_process,
      /** A phone started over the relay, its transports through its hook. */
      a_phone: (given: APhoneOverTheRelay): Promise<Phone<APhonesPartitions>> => {
        const transports =
          given.transports === undefined ? in_process : given.transports(in_process)
        return phone(
          given.storage ?? on_the_cell(given.cell ?? cell({ initial: a_new_phone })),
          given.release,
        )({
          ...given.world,
          mailbox: transports.mailbox,
          collect: transports.collect,
        })
      },
    }
  }

/** The `memory` stack, as it starts. */
export type Stack = Awaited<ReturnType<ReturnType<typeof a_stack>>>
