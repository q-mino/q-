// The relay's configurator (CFG-1, CFG-3, PER-19): the desk's trees wired
// over the ports of `mailbox/deposits` on the relay's storage (SQLite,
// `adapters-node`), the effect executor of the deposits' waits, and the HTTP
// interface through the desk, all checked when the relay starts, before any
// request (CFG-2), as the `memory` stack wires the relay over the oracle
// (`packages/memory/src/relay/`). Since step 19 the wiring, which the
// relay's stories run on (TST-1); the main that opens the database, serves
// the interface and starts the executor is step 24's.
//
// No access logs, declared (CFG-3): the trees' trace, the record of the
// requests a node answered with no fact (F6, PER-14), goes nowhere, since
// the relay has no user to show it to and keeps nothing of who came.

import * as zz from '@q-mino/domains/library'
import { desk } from '@q-mino/domains/desk/_node.ts'
import { registry as desk_registry } from '@q-mino/domains/desk/_registry.ts'
import { registry as depositor_registry } from '@q-mino/domains/desk/depositor/_registry.ts'
import { majors as depositor_majors } from '@q-mino/domains/desk/depositor/_majors.ts'
import { deposit_an_envelope } from '@q-mino/domains/desk/depositor/_usecase.ts'
import { registry as holder_registry } from '@q-mino/domains/desk/holder/_registry.ts'
import { majors as holder_majors } from '@q-mino/domains/desk/holder/_majors.ts'
import { collect_the_envelopes } from '@q-mino/domains/desk/holder/_usecase.ts'
import { registry as deposits_registry } from '@q-mino/domains/mailbox/deposits/_registry.ts'
import { majors as deposits_majors } from '@q-mino/domains/mailbox/deposits/_majors.ts'
import { discard_an_envelope } from '@q-mino/domains/mailbox/deposits/_usecase.ts'
import {
  the_desks_http_interface,
  type HashOfACollectSecret,
  type TheRelaysStorage,
} from '@q-mino/adapters-node'

/**
 * The world outside the relay: its clock, by which it keeps the time of a
 * deposit and its seven days (MBX-1, MBX-2), and the time that passes, which
 * wakes the executor when a wait comes due (DOM-14); the hash of a collect
 * secret (MBX-6), the primitives' (SEA-4).
 */
export interface World {
  readonly clock: zz.Clock
  readonly elapsed: zz.Elapsed
  readonly hash: HashOfACollectSecret
}

/** The relay keeps no trace of the requests it answered with no fact (CFG-3). */
const no_trace: zz.Trace<unknown> = () => undefined

export const relay = (storage: TheRelaysStorage) => async (world: World) => {
  // The versions of the store, from the majors of the domain whose facts and
  // effects it keeps, checked against what it keeps (DOM-22).
  const versions = await zz.versions([deposits_majors])({ stored: storage.stored_versions })
  const deposits = storage.deposits(versions)
  // The ports the trees invoke, by the folder of what they serve (PER-6).
  const invoked = { 'mailbox/deposits': deposits }
  const wired = { invoked, log: storage.log, trace: no_trace, elapsed: world.elapsed }
  const depositor = zz.tree_ports({
    registry: { ...desk_registry, ...depositor_registry },
    versions,
    majors: depositor_majors,
    top: desk,
    use_cases: { deposit_an_envelope },
  })(wired)
  const holder = zz.tree_ports({
    registry: { ...desk_registry, ...holder_registry },
    versions,
    majors: holder_majors,
    top: desk,
    use_cases: { collect_the_envelopes },
  })(wired)
  // The seven days of a deposit (MBX-2): a wait with no world, whose payload
  // goes back to its return, which discards the envelope.
  const waits = zz.effect_executor({
    registry: deposits_registry,
    versions,
    returns: { discard_an_envelope },
  })({
    'mailbox/deposits/effect/wait_seven_days_from_the_deposit': zz.returns_the_payload,
  })
  return {
    /** The versions of the store, as its readers meet its data (DOM-22). */
    versions,
    /** The ports the trees invoke, by folder: the business's use cases. */
    invoked,
    /** The fact log of the store (DOM-17). */
    log: storage.log,
    depositor,
    holder,
    /** The HTTP interface through the desk (MBX-9), to serve. */
    http: the_desks_http_interface({ depositor, holder, hash: world.hash, clock: world.clock }),
    /** The effect executor of the deposits' waits, started (DOM-14). */
    waits: () =>
      waits({
        outbox: storage.outbox,
        returns: deposits,
        state: storage.executor,
        clock: world.clock,
        elapsed: world.elapsed,
      }),
  }
}

/** The relay, as its configurator wires it. */
export type Relay = Awaited<ReturnType<ReturnType<typeof relay>>>
