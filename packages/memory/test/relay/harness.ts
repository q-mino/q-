// The harness of the relay's stories (TST-2, TST-3, MBX-7): one cell of q-'s
// oracle and the relay the `memory` stack wires over it (`src/relay/`), the
// relay's clock and the operations injected, so that a story says when each
// request is sent and under which operation. The desk's trees are entered as
// the desk's interface enters them (MBX-6): a depositor who shows nothing, a holder
// who shows a collect secret R, hashed into D by a hash the harness fakes
// (`hash`). A story observes only what the ports give (TST-3), never the
// cell's state. The deviations a stream and the executor must bear are
// injected (TST-4): a position the cell keeps no longer (`forget`), every
// fact and every entry given twice (`redelivered`). On the model of Shed's
// (`packages/domains/test/shed/scenarios/oracle.ts`).
//
// The stories take the relay through this harness's type (`RelayUnderTest`),
// so that an adapter of `mailbox` runs them as its conformance suite
// (TST-1): its own factory, the same stories (`stories.ts`).

import * as zz from '@q-mino/domains/library'
import {
  cell,
  no_deposit,
  relay,
  the_desks_interface,
  the_scope_of_a_deposit,
  type HashOfACollectSecret,
  type MailboxState,
  type Relay,
  type Shown,
  type Strategy,
} from '../../src/index.ts'

/** The zone of the relay's clock: it keeps time, not a calendar (MBX-1). */
export const time_zone = zz.time_zone.parse('UTC')

/**
 * The hash the harness fakes for the desk's interface (TST-3): a collect secret's D,
 * told apart from R so that a story never mistakes one for the other. The
 * real hash is an adapter's (step 18).
 */
export const hash = (secret: string): Promise<string> => Promise.resolve(`hash-of-${secret}`)

/**
 * How a relay starts: how its read streams, natively or composed (DOM-2);
 * whether its cell gives everything twice (TST-4); the hash of its desk's
 * interface, the harness's fake unless a story gives the one its phones'
 * safes draw D with (the nodes of `../node/harness.ts`).
 */
export interface Start {
  readonly streams?: Strategy
  readonly redelivered?: boolean
  readonly hash?: HashOfACollectSecret
}

/** A request's operation, if the story names it, and its correlation. */
export interface Sent {
  readonly operation?: string
  readonly correlation?: string
}

/** Who comes to the desk: nobody in particular, or who shows the collect secret R. */
export const nobody: Shown = { shows: 'nothing' }
export const showing = (secret: string): Shown => ({ shows: 'a_collect_secret', secret })

/** What the harness needs of a relay started: the desk's trees, the executor of the waits, the fact log. */
export interface Started {
  readonly depositor: Relay['depositor']
  readonly holder: Relay['holder']
  readonly waits: () => zz.EffectExecutor
  readonly log: zz.FactLog
}

/** What a store under a relay lets a story inject or read (TST-4): the trees' trace, the positions it forgets. */
export interface Injected {
  readonly traced: () => readonly zz.Traced<unknown>[]
  readonly forget: (before: zz.position) => void
}

/**
 * The world of a story: the relay's clock, which a story sets (`pass`); the
 * time that passes, every wait asked for, ended when the story says (TST-3).
 */
export const a_world = () => {
  let instant = zz.date_time.parse('2026-11-16T00:00:00.000Z')
  const waits: (() => void)[] = []
  return {
    clock: { now: () => instant, time_zone },
    elapsed: () =>
      new Promise<void>((over) => {
        waits.push(over)
      }),
    /** The relay's clock at an instant. */
    at: (at: string) => {
      instant = zz.date_time.parse(at)
    },
    /** Every wait asked for, over. */
    over: () => {
      for (const over of waits.splice(0)) over()
    },
  }
}

/** A story's world. */
export type StoryWorld = ReturnType<typeof a_world>

/**
 * The harness over a relay started in a story's world, whatever its store
 * (TST-1): the desk's trees entered as the desk's interface enters them.
 */
export const harnessed = (
  the_relay: Started,
  world: StoryWorld,
  injected: Injected,
  hash_of_a_secret: HashOfACollectSecret = hash,
) => {
  const the_interface = the_desks_interface(hash_of_a_secret)
  let operations = 0
  /**
   * What the desk's interface gives a tree for who comes (MBX-6): the `Caller`, the
   * version the phone was built at; for a deposit at an instant its
   * operation, in the depositor's scope, and its correlation; for a collect
   * the context of `when`.
   */
  const as = async <const version extends zz.Semver>(shown: Shown, version: version) => {
    const caller = await the_interface(shown)
    return {
      at: (at: string, sent: Sent = {}) => {
        operations += 1
        const id = sent.operation ?? `op-${String(operations)}`
        return {
          caller,
          version,
          now: zz.date_time.parse(at),
          time_zone,
          operation: { id: zz.operation_id.parse(id), scope: the_scope_of_a_deposit },
          correlation: zz.correlation.parse(sent.correlation ?? `correlation-${id}`),
        }
      },
      when: (at: string) => ({
        caller,
        version,
        now: zz.date_time.parse(at),
        time_zone,
      }),
    }
  }
  return {
    depositor: the_relay.depositor,
    holder: the_relay.holder,
    as,
    /** The effect executor of the deposits' waits started (DOM-14), the relay's clock at an instant. */
    waits: (at: string): zz.EffectExecutor => {
      world.at(at)
      return the_relay.waits()
    },
    /**
     * Time passes up to an instant: the clock reads it, and every wait asked
     * for is over, so that the executor delivers what has come; then its
     * deliveries run their course (TST-3).
     */
    pass: async (to: string) => {
      world.at(to)
      world.over()
      await quiet()
    },
    /** Every fact the store recorded, in order, as its log gives them (DOM-17), each once by its position. */
    recorded: async (): Promise<readonly zz.StoredEnvelope[]> => {
      const facts = new Map<zz.position, zz.StoredEnvelope>()
      for await (const event of the_relay.log(undefined)) {
        if (event.event !== 'fact') break
        facts.set(event.position, event.fact)
      }
      return [...facts.values()]
    },
    /** What the trees' trace holds, in the order handed (F6, PER-14). */
    traced: injected.traced,
    /** The positions before this one, which the store keeps no longer (TST-4). */
    forget: injected.forget,
  }
}

/** The relay of a story, as the oracle starts it. */
export const a_relay = async (start: Start = {}) => {
  const made = cell<MailboxState>({
    initial: no_deposit,
    ...(start.redelivered === undefined ? {} : { redelivered: start.redelivered }),
  })
  const world = a_world()
  const the_relay = await relay(
    made,
    start.streams === undefined ? {} : { streams: start.streams },
  )(world)
  return harnessed(
    the_relay,
    world,
    { traced: made.traced, forget: made.forget },
    start.hash ?? hash,
  )
}

/** The relay under the stories: the oracle's, or an adapter's with the same harness (TST-1). */
export type RelayUnderTest = Awaited<ReturnType<typeof a_relay>>

/**
 * Everything already set going has run its course, up to its next wait: the
 * oracle and the harness wait on nothing but promises, so a turn of the
 * runtime's timers comes after them all.
 */
export const quiet = async (): Promise<void> => {
  for (let turn = 0; turn < 3; turn += 1) {
    await new Promise<void>((done) => {
      setTimeout(done, 0)
    })
  }
}

/** Every event of a port's stream, until it ends. */
export const all = async <event>(events: AsyncIterable<event>): Promise<readonly event[]> => {
  const every: event[] = []
  for await (const event of events) every.push(event)
  return every
}

/** The next events of a stream that stays open, so many, as the consumer pulls them. */
export const pull = async <event>(
  stream: AsyncIterator<event>,
  count: number,
): Promise<readonly event[]> => {
  const pulled: event[] = []
  while (pulled.length < count) {
    const next = await stream.next()
    if (next.done === true) throw new Error('the stream ended')
    pulled.push(next.value)
  }
  return pulled
}

/** The events of a stream that stays open, up to `caught_up` or a terminal event, included. */
export const until_caught_up = async <event extends { readonly event: string }>(
  stream: AsyncIterator<event>,
): Promise<readonly event[]> => {
  const pulled: event[] = []
  for (;;) {
    const next = await stream.next()
    if (next.done === true) return pulled
    pulled.push(next.value)
    if (next.value.event === 'caught_up' || next.value.event === 'position_unavailable')
      return pulled
  }
}
