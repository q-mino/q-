// The harness of the safe's stories (TST-2, TST-3; README of `seals`, §
// Stories to prove): one cell of q-'s oracle with the ports of `seals/safe`
// over it, the effect executor of the safe's draws, its deliveries the
// domain's `dsl` over the primitives port the story runs on, and the
// requests sent as a reaction and the executor send them (PER-21): no
// persona reaches the safe. A story observes only what the ports give
// (TST-3): the events of a command, the entries of a read, the facts of the
// log, the executor's letters; never the cell's state. The world's random
// bytes are the story's (`will_draw`); every fact and every entry can be
// given twice (`redelivered`, TST-4).

import * as zz from '@q-mino/domains/library'
import { registry } from '@q-mino/domains/seals/safe/_registry.ts'
import { majors } from '@q-mino/domains/seals/safe/_majors.ts'
import {
  a_new_mailbox_key,
  a_new_seed_and_its_first_face,
  type Bytes,
  type Primitives,
} from '@q-mino/domains/seals/safe/_dsl.ts'
import {
  keep_a_mailbox_key,
  keep_a_new_seed_and_its_face,
} from '@q-mino/domains/seals/safe/_usecase.ts'
import { cell, log, no_secret, seals_ports, type SealsState } from '../../src/index.ts'
import { drawn_from, recording } from './primitives.ts'

/** The zone of the phone's clock: the safe reads no time, its context has one all the same. */
export const time_zone = zz.time_zone.parse('UTC')

/** How a safe starts: whether its cell gives every fact and every entry twice (TST-4). */
export interface Start {
  readonly redelivered?: boolean
}

/** A request's operation, if the story names it, and its scope: a reaction's, by default. */
export interface Sent {
  readonly operation?: string
  readonly scope?: string
}

/** The scope of the reaction that asks the safe, in the stories: `bonds`' process, step 11. */
export const the_scope_of_a_reaction = 'bonds/reaction/a_face_for_a_bond'

/** The scope under which the executor returns from an effect (D91.3): the effect's path. */
export const the_scope_of_the_executor = (effect: string): string => effect

/**
 * What the safe's machine gives back for its effects (SEA-5, ADP-1): the
 * domain's deliveries over the primitives port, which an adapter only calls.
 * The configurator's in a stack; the harness's here.
 */
const the_safe_s_machine = (primitives: Primitives) => ({
  'seals/safe/effect/draw_a_seed_for_the_face': (entry: {
    readonly payload: { readonly face_id: string }
  }) =>
    Promise.resolve({
      outcome: 'delivered' as const,
      returns: { face_id: entry.payload.face_id, ...a_new_seed_and_its_first_face(primitives) },
    }),
  'seals/safe/effect/draw_the_mailbox_key': (entry: {
    readonly payload: { readonly mailbox_key_id: string }
  }) =>
    Promise.resolve({
      outcome: 'delivered' as const,
      returns: { mailbox_key_id: entry.payload.mailbox_key_id, ...a_new_mailbox_key(primitives) },
    }),
})

/** Every event of a port's stream, until it ends. */
export const all = async <event>(events: AsyncIterable<event>): Promise<readonly event[]> => {
  const every: event[] = []
  for await (const event of events) every.push(event)
  return every
}

/**
 * Everything already set going has run its course, up to its next wait: the
 * oracle and the harness wait on nothing but promises.
 */
export const quiet = async (): Promise<void> => {
  for (let turn = 0; turn < 5; turn += 1) {
    await new Promise<void>((done) => {
      setTimeout(done, 0)
    })
  }
}

/** The safe of a story, over a primitives port, as the oracle starts it. */
export const a_safe = async (given: Primitives, start: Start = {}) => {
  const made = cell<SealsState>({
    initial: no_secret,
    ...(start.redelivered === undefined ? {} : { redelivered: start.redelivered }),
  })
  const world = drawn_from(given)
  const calls = recording(world.primitives)
  const primitives = calls.primitives
  const versions = await zz.versions([majors])({ stored: made.stored_versions })
  const ports = seals_ports(made, primitives)(versions)
  const instant = zz.date_time.parse('2026-11-20T09:00:00.000Z')
  let operations = 0
  /** The context of a command sent under an operation (DOM-11), its fingerprint over its use case's path and its input. */
  const sent_as =
    (path: string, input: unknown) =>
    (sent: Sent = {}): zz.CommandRootContext => {
      operations += 1
      const id = sent.operation ?? `op-${String(operations)}`
      return {
        now: instant,
        time_zone,
        operation: { id: zz.operation_id.parse(id), scope: sent.scope ?? the_scope_of_a_reaction },
        correlation: zz.correlation.parse(`correlation-${id}`),
        fingerprint: zz.fingerprint_of({ path, input }),
      }
    }
  const when = { now: instant, time_zone }
  const executor = zz.effect_executor({
    registry,
    versions,
    returns: { keep_a_new_seed_and_its_face, keep_a_mailbox_key },
  })(the_safe_s_machine(primitives))
  const facts = log(made)
  return {
    /** The world draws these bytes next, in order (TST-3). */
    will_draw: (...bytes: readonly Bytes[]) => {
      world.will_draw(...bytes)
    },
    /** Every call to the primitives port, in order, and what it gave. */
    calls: calls.calls,
    /** A reaction asks the safe for a face (PER-21). */
    makes_a_face: (face_id: string, sent?: Sent) => {
      const input = { face_id }
      return all(
        ports.make_a_face_from_a_new_seed(
          sent_as('seals/safe/usecase/make_a_face_from_a_new_seed', input)(sent),
          input,
        ),
      )
    },
    /** The executor's return of a seed drawn, as it would send it, under the effect's scope (D91.3). */
    keeps_a_seed: (
      input: {
        readonly face_id: string
        readonly seed_secret: string
        readonly first_face: {
          readonly public_key: string
          readonly private_key: string
          readonly chain_code: string
        }
      },
      sent: Sent = {},
    ) =>
      all(
        ports.keep_a_new_seed_and_its_face(
          sent_as(
            'seals/safe/usecase/keep_a_new_seed_and_its_face',
            input,
          )({
            scope: the_scope_of_the_executor('seals/safe/effect/draw_a_seed_for_the_face'),
            ...sent,
          }),
          input,
        ),
      ),
    /** A reaction asks the safe for a mailbox key (PER-21). */
    draws_a_mailbox_key: (mailbox_key_id: string, sent?: Sent) => {
      const input = { mailbox_key_id }
      return all(
        ports.draw_a_mailbox_key(
          sent_as('seals/safe/usecase/draw_a_mailbox_key', input)(sent),
          input,
        ),
      )
    },
    /** `post` asks the safe for a content signed by a face (SEA-6). */
    signs: (face_id: string, content: string) =>
      all(ports.a_content_signed_by_a_face(when, { face_id, content })),
    /** `post` asks the safe for a sealed content opened by a face (SEA-6). */
    opens: (face_id: string, sealed_content: string) =>
      all(ports.a_sealed_content_opened_by_a_face(when, { face_id, sealed_content })),
    /** Who collects from the relay asks the safe for a mailbox's key (SEA-4, V5). */
    the_key_of: (mailbox_key_id: string) =>
      all(ports.the_key_of_a_mailbox(when, { mailbox_key_id })),
    /** The effect executor of the safe's draws, started (DOM-14): it delivers what is queued, then waits. */
    the_machine_runs: () =>
      executor({
        outbox: made.outbox,
        returns: ports,
        state: made.executor,
        clock: { now: () => instant, time_zone },
        elapsed: () =>
          new Promise<void>(() => {
            // no pause ends in a story: nothing of the safe's is transient
          }),
      }),
    /** Every fact the cell recorded, in order, as its log gives them (DOM-17), each once by its position. */
    recorded: async (): Promise<readonly zz.StoredEnvelope[]> => {
      const kept = new Map<zz.position, zz.StoredEnvelope>()
      for await (const event of facts(undefined)) {
        if (event.event !== 'fact') break
        kept.set(event.position, event.fact)
      }
      return [...kept.values()]
    },
    /** The entries queued with the facts, in order (DOM-14). */
    queued: made.entries,
    /** The entries the executor holds: its dead letters (DOM-15). */
    held: made.held,
  }
}

/** The safe under the stories: the oracle's, over the port a suite gives (TST-1). */
export type SafeUnderTest = Awaited<ReturnType<typeof a_safe>>
