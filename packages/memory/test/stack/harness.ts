// The harness of the stack's scenarios (TST-1, TST-2, TST-3, TST-4, CFG-3;
// step 17; `README.md` here): the `memory` stack (`src/stack/`), one relay
// and the phones of a story over it, each phone the composition root of
// `src/phone/` over a cell of its own, with ping pong preinstalled (PNG-1).
// The suite is parametrized by a factory (TST-1): the phones' primitives,
// and their transports from the stack's in process, which an adapter's step
// puts its own in place of (20: HTTP; 21, 25: the phone's). The faults of
// the mailbox are injected (TST-4) by decorators of the transports (ADP-5),
// under a plan: none, or a deterministic lossy schedule per phone.
//
// A phone is on or off. On, her app is open (`the_app`), the kernel's
// executors and the reactions run, the extensions follow the office; off,
// they are stopped, its extensions unloaded, and it collects nothing. The
// story's clock is the phones' and the relay's: moved (`at`), it ends every
// wait asked for. `settles` is the time a story lets pass without moving
// the clock: rounds of the executors' pauses over (a transient delivery
// tried again, DOM-14), a fallen executor started again (an abort, PST-10),
// every phone on collecting once, then the event loop quiet; over when two
// rounds in a row change nothing the ports show, at most 60 rounds. Every
// wait is bounded and turns on real timers (A, 20 Nov 2026).
//
// The gestures are the user's activities (USR-2), asked with an id the
// story draws and read back as her screens read them: never the address
// book's commands. A story observes what the ports give (TST-3): the
// activities, the reads of the address book and the office, the facts of
// the log, the post's answers, the kernel's trace, the letters held, the
// extension's partition, what the transports carried.

import {
  the_held_letters,
  the_manifest_to_accept,
  type AnEnvelopeCollected,
  type TheKernelsTraced,
} from '@q-mino/adapters-common'
import * as boundary from '@q-mino/boundary'
import * as zz from '@q-mino/domains/library'
import { the_identity_of_a_request, type Deposited } from '@q-mino/domains/post/_dsl.ts'
import {
  the_deposit_address_of,
  type Bytes,
  type Primitives,
} from '@q-mino/domains/seals/safe/_dsl.ts'
import type * as activities_value from '@q-mino/domains/user/activities/_value.ts'
import { a_manifest } from '@q-mino/domains/user/_value.ts'
import type * as user_value from '@q-mino/domains/user/_value.ts'
import { ping_pong } from '@q-mino/ping_pong'
import ping_pong_manifest_json from '@q-mino/ping_pong/manifest.json' with { type: 'json' }
import {
  a_new_phone,
  a_stack,
  cell,
  type Phone,
  type PhoneState,
  no_deposit,
  type MailboxState,
  type Stack,
  type TheRelaysTransports,
} from '../../src/index.ts'

/** The zone of the story's clock. */
export const time_zone = zz.time_zone.parse('UTC')

/** The relay of the stack (BND-4): one, in stage 1. */
export const the_relay = 'https://relay.q-mino.test'

/** What a run of the suite is given (TST-1): the phones' primitives, and their transports from the stack's in process. */
export interface AFactory {
  readonly primitives: Primitives
  readonly transports: (in_process: TheRelaysTransports) => TheRelaysTransports
}

/** The oracle's factory over a primitives port: the stack's transports in process, as they are. */
export const on_the_oracle = (primitives: Primitives): AFactory => ({
  primitives,
  transports: (in_process) => in_process,
})

/** The faults a run injects on the mailbox (TST-4): none, or the lossy schedule. */
export type AFaultPlan = 'none' | 'lossy'

/**
 * A fault of a deposit (TST-4): lost on its way, the relay never sees it
 * (`unreachable`); kept and its answer lost (`unreachable`); deposited
 * twice; aborted, the transport throwing.
 */
export type AFaultOfADeposit = 'lost' | 'answer_lost' | 'doubled' | 'aborted'

/** A fault of a collect (TST-4): lost, the collect throwing; every envelope of the snapshot given twice. */
export type AFaultOfACollect = 'lost' | 'doubled'

/**
 * The lossy schedule, per phone and per transport (deterministic): each
 * deposit meets the next fault of its cycle, each collect the next of its
 * own, so that every letter of a scenario, request or response, meets one
 * on its way. A loss is always followed by a duplication, which reaches the
 * relay: a letter tried again gets there, and a response lost is lost once
 * (the asker's next sending finds it, PST-6).
 */
const the_lossy_schedule: {
  readonly deposits: readonly (AFaultOfADeposit | 'none')[]
  readonly collects: readonly (AFaultOfACollect | 'none')[]
} = {
  deposits: ['lost', 'doubled', 'answer_lost', 'aborted', 'doubled'],
  collects: ['doubled', 'lost', 'doubled', 'none'],
}

/** A fault the transports injected, on whose phone. */
export type AFaultMet =
  | { readonly phone: string; readonly on: 'a_deposit'; readonly fault: AFaultOfADeposit }
  | { readonly phone: string; readonly on: 'a_collect'; readonly fault: AFaultOfACollect }

/** What a transport throws when the plan aborts it, or loses a collect: told apart from any other fault. */
const the_transport_aborted = new Error('the transport aborted (TST-4)')
const the_collect_was_lost = new Error('the collect was lost (TST-4)')

/** Whether a fault is one the plan injected, itself or as the cause of a fall. */
const is_injected = (fault: unknown): boolean =>
  fault === the_transport_aborted ||
  fault === the_collect_was_lost ||
  (fault instanceof Error && fault.cause !== undefined && is_injected(fault.cause))

/** A deposit a phone's transport was asked for, as the story reads it: on which D, with which fault, and what it answered. */
export interface ACarriedDeposit {
  readonly deposit_address: string
  readonly fault: AFaultOfADeposit | 'none'
  readonly answered: Deposited | 'aborted'
}

/**
 * The transports of a phone under the plan (TST-4, ADP-5): decorators of
 * the ones the factory gives, which inject the fault of each call, in the
 * schedule's order, and keep what was asked; nothing else.
 */
const under_the_plan = (
  plan: AFaultPlan,
  whose: string,
  told: { readonly met: (fault: AFaultMet) => void; readonly aborted: () => void },
  carried: ACarriedDeposit[],
) => {
  let deposits = 0
  let collects = 0
  const next = <fault>(cycle: readonly (fault | 'none')[], count: number): fault | 'none' =>
    plan === 'none' ? 'none' : (cycle[count % cycle.length] ?? 'none')
  return (transports: TheRelaysTransports): TheRelaysTransports => ({
    mailbox: {
      deposit: async (deposit) => {
        const fault = next(the_lossy_schedule.deposits, deposits)
        deposits += 1
        const kept = (answered: ACarriedDeposit['answered']) => {
          carried.push({ deposit_address: deposit.deposit_address, fault, answered })
        }
        if (fault !== 'none') told.met({ phone: whose, on: 'a_deposit', fault })
        if (fault === 'aborted') {
          kept('aborted')
          told.aborted()
          throw the_transport_aborted
        }
        if (fault === 'lost') {
          kept({ outcome: 'unreachable' })
          return { outcome: 'unreachable' }
        }
        const first = await transports.mailbox.deposit(deposit)
        const answered = fault === 'doubled' ? await transports.mailbox.deposit(deposit) : first
        const told_back: Deposited = fault === 'answer_lost' ? { outcome: 'unreachable' } : answered
        kept(told_back)
        return told_back
      },
    },
    collect: async (mailbox) => {
      const fault = next(the_lossy_schedule.collects, collects)
      collects += 1
      if (fault !== 'none') told.met({ phone: whose, on: 'a_collect', fault })
      if (fault === 'lost') throw the_collect_was_lost
      const deposited = await transports.collect(mailbox)
      return fault === 'doubled' ? deposited.flatMap((each) => [each, each]) : deposited
    },
  })
}

/** A real timer of so many milliseconds. */
const a_timer = (milliseconds: number) => (): Promise<void> =>
  new Promise<void>((done) => {
    setTimeout(done, milliseconds)
  })

/**
 * Everything already set going has run its course, up to its next wait: a
 * delivery goes through the safe's reads, the relay's tree and the
 * extension's realm, so it takes many turns of the runtime's timers.
 */
const quiet = async (): Promise<void> => {
  for (let turn = 0; turn < 25; turn += 1) await a_timer(0)()
}

/** Turns of the event loop, each a real timer, until a condition holds: at most about two seconds, else the story fails. */
export const until = async (
  holds: () => boolean | Promise<boolean>,
  what: string,
): Promise<void> => {
  for (let round = 0; round < 1000; round += 1) {
    if (await holds()) return
    await a_timer(2)()
  }
  throw new Error(`${what}: it did not come to pass`)
}

/**
 * The story's clock, the phones' and the relay's: moved, it ends every wait
 * asked for, so that the executors look again; its pauses over, every wait
 * ends where it is, the clock unmoved.
 */
const a_clock = (start: string) => {
  let instant = zz.date_time.parse(start)
  const waits: (() => void)[] = []
  const every_wait_over = (): void => {
    for (const over of waits.splice(0)) over()
  }
  return {
    clock: { now: () => instant, time_zone } satisfies zz.Clock,
    elapsed: (): Promise<void> =>
      new Promise<void>((over) => {
        waits.push(over)
      }),
    at: (to: string): void => {
      instant = zz.date_time.parse(to)
      every_wait_over()
    },
    pauses_over: every_wait_over,
  }
}

/** The story's clock. */
type AClock = ReturnType<typeof a_clock>

/**
 * The time that passes in an extension's realm (DOM-3): a screen's wait of
 * a minute or more over once the story's clock has moved that far from
 * when it began (a ping followed for its 70 seconds); a shorter one, a real
 * timer of 2 ms.
 */
const the_realm_s_time =
  (time: AClock): zz.Elapsed =>
  async (milliseconds) => {
    if (milliseconds < 60_000) return a_timer(2)()
    const from = Date.parse(time.clock.now())
    while (Date.parse(time.clock.now()) - from < milliseconds) await time.elapsed()
  }

/**
 * The world's random bytes for a phone: each draw new, of the length asked,
 * from a number the story gives each phone, so that two phones never draw
 * the same seed nor the same R (TST-3).
 */
const a_world_of = (primitives: Primitives, phone: number): Primitives => {
  let draws = 0
  return {
    ...primitives,
    random_bytes: (length): Bytes => {
      draws += 1
      return Uint8Array.from({ length }, (_, at) => (phone * 71 + draws * 29 + at * 17) & 255)
    },
  }
}

/** Ping pong's manifest as its build writes it (EXT-10, PNG-5). */
const ping_pong_manifest: unknown = ping_pong_manifest_json

/** A consumer the phone runs while it is on. */
interface Running {
  readonly stop: () => Promise<void>
}

/** A consumer stopped: a fall the plan injected is borne, any other thrown. */
const stopped = async (running: Running): Promise<void> => {
  try {
    await running.stop()
  } catch (fault) {
    if (!is_injected(fault)) throw fault
  }
}

/** The effect of the address book whose deliveries are the introductions (BND-10). */
export const send_my_introduction = 'bonds/address_book/effect/send_my_introduction'

/** What a round of `settles` needs of a phone: whether it is on, what its ports show, its round, its going off. */
interface APhoneInTheRounds {
  readonly is_on: () => boolean
  readonly shows: () => string
  readonly a_round: () => Promise<void>
  readonly off: () => Promise<void>
}

/** How a phone of the story starts: its number for the world's draws, its user's name. */
export interface Start {
  readonly phone: number
  readonly name: string
}

/**
 * The stack of a story under a factory and a plan (TST-1, TST-4): the
 * relay, its waits' executor running, the clock at 10:00 UTC on Friday 20
 * November 2026; phones started over it (`a_phone`), on; `settles`; the
 * faults met; `stops`, every consumer stopped at the story's end.
 */
export const a_story = async (factory: AFactory, plan: AFaultPlan) => {
  const time = a_clock('2026-11-20T10:00:00.000Z')
  const relay_cell = cell<MailboxState>({ initial: no_deposit })
  const stack: Stack = await a_stack(relay_cell)({
    clock: time.clock,
    elapsed: time.elapsed,
    hash: (secret) => Promise.resolve(the_deposit_address_of(factory.primitives)(secret)),
  })
  const the_relay_s_waits = stack.relay.waits()
  const met: AFaultMet[] = []
  const phones: APhoneInTheRounds[] = []

  /** A phone of the story over the stack, on, with no face yet: what it gives a story is below. */
  const a_phone = async (start: Start) => {
    const made = cell<PhoneState>({ initial: a_new_phone })
    const carried: ACarriedDeposit[] = []
    let aborted = false
    const node: Phone = await stack.a_phone({
      cell: made,
      world: {
        clock: time.clock,
        elapsed: time.elapsed,
        primitives: a_world_of(factory.primitives, start.phone),
        extensions: [{ manifest: ping_pong_manifest, realm: ping_pong }],
        relays: [the_relay],
      },
      release: { the_realm_s_time: the_realm_s_time(time), a_while: a_timer(5) },
      transports: (in_process) =>
        under_the_plan(
          plan,
          start.name,
          {
            met: (fault) => {
              met.push(fault)
            },
            aborted: () => {
              aborted = true
            },
          },
          carried,
        )(factory.transports(in_process)),
    })
    const when = (): zz.RootContext => ({
      now: time.clock.now(),
      time_zone,
    })
    /** Every event of a port's stream, until it ends. */
    const all = async <event>(events: AsyncIterable<event>): Promise<readonly event[]> => {
      const every: event[] = []
      for await (const event of events) every.push(event)
      return every
    }
    /** The entries of a read's snapshot, its first event. */
    const entries_of = async <entry>(
      events: AsyncIterable<
        | { readonly event: 'snapshot'; readonly entries: readonly entry[] }
        | { readonly event: 'invalid_request' }
      >,
    ): Promise<readonly entry[]> => {
      const [first] = await all(events)
      if (first?.event !== 'snapshot')
        throw new Error(`a read of ${start.name}'s began with no snapshot`)
      return first.entries
    }

    // The phone on: its consumers, by what they are, while it runs.
    let the_post: Running | undefined = undefined
    let running: readonly Running[] = []
    const on = (): void => {
      if (running.length > 0 || the_post !== undefined) return
      the_post = node.the_executors['post/requests']()
      running = [
        node.the_reactions['reaction/first_face'](),
        node.the_reactions['reaction/ticket'](),
        node.the_executors['seals/safe'](),
        node.the_executors['bonds/address_book'](),
        node.the_executors['extensions/activations'](),
        node.the_extensions_follow_the_office(),
        node.the_app(),
      ]
    }
    const off = async (): Promise<void> => {
      const post = the_post
      const others = running
      the_post = undefined
      running = []
      for (const each of [...others].reverse()) await stopped(each)
      if (post !== undefined) await stopped(post)
      for (const extension of node.extensions()) await extension.hosted.unload()
    }

    let operations = 0
    const the_phone = {
      name: start.name,
      node,
      /** Whether the phone is on. */
      is_on: (): boolean => the_post !== undefined,
      /** The phone off (its app closed, its consumers stopped, its extensions unloaded), or on again. */
      off,
      on,
      /**
       * The post's executor started again if a deposit aborted since (PST-10:
       * the effect stopped unadvanced, met again when it starts), as the
       * phone will; then the phone's collector passes once, a fault the plan
       * injected borne (the mailbox left for the next pass).
       */
      a_round: async (): Promise<void> => {
        if (the_post === undefined) return
        if (aborted) {
          aborted = false
          await stopped(the_post)
          the_post = node.the_executors['post/requests']()
        }
        try {
          await node.collects()
        } catch (fault) {
          if (!is_injected(fault)) throw fault
        }
      },
      /** What the ports show of the phone, compared between two rounds: its facts, the deposits it asked for, what it collected, its trace, its letters, the extension's partition and life. */
      shows: (): string =>
        JSON.stringify([
          made.position(),
          carried.length,
          node.collected().length,
          node.traced.length,
          node.notices.length,
          made.held().length,
          made.held_parts().length,
          node
            .extensions()
            .map((each) => [
              each.hosted.life().life,
              [...node.partitions.kept(each.name).keys()].length,
            ]),
        ]),
      /** Her screen asks for an activity, with the id the story drew (USR-2, DOM-12): its events. */
      asks: (
        activity_id: string,
        what: activities_value.what_is_asked,
      ): Promise<readonly unknown[]> => {
        operations += 1
        const input = { activity_id, what }
        const id = `${start.name}-op-${String(operations)}`
        return all(
          node.user.ask_for_an_activity(
            {
              ...when(),
              operation: { id: zz.operation_id.parse(id), scope: 'self/the_user' },
              correlation: zz.correlation.parse(id),
              fingerprint: zz.fingerprint_of({
                path: 'user/activities/usecase/ask_for_an_activity',
                input,
              }),
            },
            input,
          ),
        )
      },
      /** How an activity ended, as her screens read it; none while it is in progress. */
      the_end_of: async (
        activity_id: string,
      ): Promise<activities_value.how_it_ended | undefined> => {
        const [activity] = await entries_of(node.user.an_activity(when(), { activity_id }))
        return activity?.stage.stage === 'ended' ? activity.stage.how_it_ended : undefined
      },
      /** Her faces, as the address book keeps them. */
      my_faces: () => entries_of(node.address_book.my_faces(when(), {})),
      /** The key of a face as the safe made it (SEA-6): what its signatures are checked with. */
      the_key_in_the_safe: async (face_id: string): Promise<string | undefined> =>
        (
          await entries_of(node.safe.a_content_signed_by_a_face(when(), { face_id, content: 'AA' }))
        )[0]?.public_key,
      /** A bond's card, as the address book keeps it; none for one not kept. */
      a_bond: async (bond_id: string) =>
        (await entries_of(node.address_book.a_bond(when(), { bond_id })))[0],
      /** My ticket of a bond to be, as the address book keeps it. */
      my_ticket: async (bond_id: string) =>
        (await entries_of(node.address_book.my_ticket(when(), { bond_id })))[0],
      /** The ticket of a bond as the phone shows it, in a QR or after `#` in a link (BND-8, BND-9); none for one not ready. */
      the_ticket_shown: (bond_id: string) => node.the_ticket_shown(bond_id),
      /** The identity of a request of the kernel's (F7, PST-2), as this phone's kernel composes it from its face's machine. */
      the_kernels_request: (face_id: string, effect: string, id: string): string =>
        the_identity_of_a_request(node.machine_of(face_id))({ of: 'the_kernel', effect, id }),
      /** The answer the post keeps under a request's identity (PST-8). */
      the_answer_to: async (request_id: string) =>
        (await entries_of(node.post.the_answer_to_a_request(when(), { request_id })))[0]?.answer,
      /** Ping pong's manifest in the office's words, as the user is shown it before activating it (EXT-7). */
      the_manifest_shown: (): user_value.a_manifest => {
        const extension = node.the_extension('ping_pong')
        if (extension === undefined) throw new Error(`no ping pong on ${start.name}'s phone`)
        return a_manifest.parse(the_manifest_to_accept(extension.composed.manifest))
      },
      /** The life of ping pong hosted (EXT-15). */
      ping_pong_s_life: (): string => node.the_extension('ping_pong')?.hosted.life().life ?? 'none',
      /** Whether ping pong is offered to a bond (EXT-7), as the kernel reads its office. */
      offers_ping_pong_to: (bond_id: string): Promise<boolean> =>
        node.reads.is_offered('ping_pong', boundary.bond.parse(bond_id)),
      /** The pongs ping pong gave back, as its partition keeps them. */
      pongs: (): readonly unknown[] =>
        [...node.partitions.kept('ping_pong')]
          .filter(([at]) => at.startsWith('state/pong/'))
          .map(([, value]) => value),
      /** The facts the cell recorded, each part by its path and payload, those whose path begins so. */
      facts_of: async (
        begins: string,
      ): Promise<readonly { readonly path: string; readonly payload: unknown }[]> => {
        const kept = new Map<zz.position, zz.StoredEnvelope>()
        for await (const each of node.log(undefined)) {
          if (each.event !== 'fact') break
          kept.set(each.position, each.fact)
        }
        return [...kept.values()].flatMap((fact) =>
          fact.parts
            .filter((part) => part.path.startsWith(begins))
            .map((part) => ({ path: part.path, payload: part.payload })),
        )
      },
      /** The kernel's trace (EXT-6), in order. */
      traced: (): readonly TheKernelsTraced[] => [...node.traced],
      /** What the collector handed the entry, in order. */
      collected: (): readonly AnEnvelopeCollected[] => node.collected(),
      /** Every deposit the phone's transport was asked for, in order. */
      deposited: (): readonly ACarriedDeposit[] => [...carried],
      /** The letters held on the phone, as she is told them (USR-8). */
      held_letters: (): readonly user_value.a_held_letter[] =>
        the_held_letters({ entries: made.held(), parts: made.held_parts(), notices: node.notices }),
    }
    phones.push(the_phone)
    on()
    return the_phone
  }

  /** The ports of the stack, compared between two rounds: the relay's facts and each phone's. */
  const shows = (): string =>
    JSON.stringify([relay_cell.position(), ...phones.map((each) => [each.is_on(), each.shows()])])

  /**
   * Time passes and the clock stays (DOM-14, DOM-17): rounds of the
   * executors' pauses over, every phone on collecting once, then the event
   * loop quiet; over when two rounds in a row change nothing the ports
   * show (a deposit asked for, lost or not, is a change: it is tried again
   * after the next pause), else the story fails after 60 rounds.
   */
  const settles = async (): Promise<void> => {
    let still = 0
    for (let round = 0; round < 60; round += 1) {
      const before = shows()
      time.pauses_over()
      for (const each of phones) await each.a_round()
      await quiet()
      still = shows() === before ? still + 1 : 0
      if (still >= 2) return
    }
    throw new Error('the stack did not settle in 60 rounds')
  }

  return {
    stack,
    a_phone,
    settles,
    /** The phones' clock and the relay's reads this instant, every wait over; then the stack settles. */
    at: async (instant: string): Promise<void> => {
      time.at(instant)
      await settles()
    },
    /** The clock reads this time of Friday 20 November (10:00:15 is `at_the_time('10:00:15')`). */
    at_the_time: async (time_of_day: string): Promise<void> => {
      time.at(`2026-11-20T${time_of_day}.000Z`)
      await settles()
    },
    /**
     * The story settles; then, while a condition does not hold, the clock
     * moves on by a quarter of a request's time, and the story settles
     * again (PST-6: a request sent again at each quarter while it waits):
     * up to its last sending, the third quarter, or to its end, the fourth.
     */
    settles_through_the_quarters: async (
      quarter_in_seconds: number,
      up_to: 'its_last_sending' | 'its_end',
      holds: () => Promise<boolean>,
    ): Promise<void> => {
      const from = Date.parse(time.clock.now())
      await settles()
      for (const quarter of up_to === 'its_end' ? [1, 2, 3, 4] : [1, 2, 3]) {
        if (await holds()) return
        time.at(new Date(from + quarter * quarter_in_seconds * 1000).toISOString())
        await settles()
      }
    },
    /** The faults the plan injected, in order. */
    the_faults_met: (): readonly AFaultMet[] => [...met],
    /** Every phone off and the relay's executor stopped, at the story's end: nothing outlives it. */
    stops: async (): Promise<void> => {
      for (const each of phones) await each.off()
      await the_relay_s_waits.stop()
    },
  }
}

/** A story of the stack. */
export type AStory = Awaited<ReturnType<typeof a_story>>

/** A phone of a story. */
export type APhoneOfTheStory = Awaited<ReturnType<AStory['a_phone']>>
