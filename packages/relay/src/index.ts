// The relay's configurator (CFG-1, CFG-3, PER-19): the desk's trees wired
// over the ports of `mailbox/deposits` and `stand/invitations` (INV-1) on the
// relay's storage (SQLite, `adapters-node`), the effect executor of their
// waits, the HTTP interface through the desk, with the stands of its
// settings, their inviters' keys and their page (INV-5..INV-7), all checked
// when the relay starts, before any
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
import { registry as inviter_registry } from '@q-mino/domains/desk/inviter/_registry.ts'
import { majors as inviter_majors } from '@q-mino/domains/desk/inviter/_majors.ts'
import { leave_an_invitation } from '@q-mino/domains/desk/inviter/_usecase.ts'
import { registry as passer_by_registry } from '@q-mino/domains/desk/passer_by/_registry.ts'
import { majors as passer_by_majors } from '@q-mino/domains/desk/passer_by/_majors.ts'
import {
  take_an_invitation,
  the_invitation_taken,
  the_invitations_on_a_stand,
} from '@q-mino/domains/desk/passer_by/_usecase.ts'
import { registry as deposits_registry } from '@q-mino/domains/mailbox/deposits/_registry.ts'
import { majors as deposits_majors } from '@q-mino/domains/mailbox/deposits/_majors.ts'
import { discard_an_envelope } from '@q-mino/domains/mailbox/deposits/_usecase.ts'
import { registry as invitations_registry } from '@q-mino/domains/stand/invitations/_registry.ts'
import { majors as invitations_majors } from '@q-mino/domains/stand/invitations/_majors.ts'
import { take_away_an_invitation } from '@q-mino/domains/stand/invitations/_usecase.ts'
import { bytes_of } from '@q-mino/domains/seals/safe/_dsl.ts'
import {
  the_desks_http_interface,
  type HashOfACollectSecret,
  type RoomForADeposit,
  type TheInviterSigned,
  type TheRelaysStorage,
} from '@q-mino/adapters-node'
import { about, the_build } from './build_info.ts'
import { the_page_of_a_stand } from './page/index.ts'
import type { Stand } from './settings.ts'

/** Whether an Ed25519 signature is a public key's over a content: the primitives' (SEA-5), libsodium's. */
export type SignatureHolds = (
  public_key: Uint8Array,
  content: Uint8Array,
  signature: Uint8Array,
) => boolean

/** An Ed25519 signature in base64url: 64 bytes, 86 characters. */
const a_signature = /^[A-Za-z0-9_-]{86}$/

/**
 * The check of a stand's inviter's signature (INV-5): the key the settings
 * name for the stand verifies it, over the primitives; a stand with no key,
 * or none of that name, or a signature out of form, verifies nothing.
 */
const the_inviter_signed =
  (stands: readonly Stand[], holds: SignatureHolds): TheInviterSigned =>
  (stand, signed, signature) => {
    const key = stands.find((each) => each.name === stand)?.inviter
    return key !== undefined && a_signature.test(signature)
      ? holds(bytes_of(key), signed, bytes_of(signature))
      : false
  }

/**
 * The world outside the relay: its clock, by which it keeps the time of a
 * deposit and its seven days (MBX-1, MBX-2), and the time that passes, which
 * wakes the executor when a wait comes due (DOM-14); the hash of a collect
 * secret (MBX-6), the primitives' (SEA-4); the room on its disk for a
 * deposit (REL-3).
 */
export interface World {
  readonly clock: zz.Clock
  readonly elapsed: zz.Elapsed
  readonly hash: HashOfACollectSecret
  readonly room: RoomForADeposit
  /** The stands of its settings (INV-6); none if not given. */
  readonly stands?: readonly Stand[]
  /** The check of a signature (SEA-5), libsodium's; none given, none holds. */
  readonly signature_holds?: SignatureHolds
}

/** The relay keeps no trace of the requests it answered with no fact (CFG-3). */
const no_trace: zz.Trace<unknown> = () => undefined

export const relay = (storage: TheRelaysStorage) => async (world: World) => {
  // The versions of the store, from the majors of the domain whose facts and
  // effects it keeps, checked against what it keeps (DOM-22).
  const versions = await zz.versions([deposits_majors, invitations_majors])({
    stored: storage.stored_versions,
  })
  const deposits = storage.deposits(versions)
  const invitations = storage.invitations(versions)
  // The ports the trees invoke, by the folder of what they serve (PER-6).
  const invoked = { 'mailbox/deposits': deposits, 'stand/invitations': invitations }
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
  const inviter = zz.tree_ports({
    registry: { ...desk_registry, ...inviter_registry },
    versions,
    majors: inviter_majors,
    top: desk,
    use_cases: { leave_an_invitation },
  })(wired)
  const passer_by = zz.tree_ports({
    registry: { ...desk_registry, ...passer_by_registry },
    versions,
    majors: passer_by_majors,
    top: desk,
    use_cases: { the_invitations_on_a_stand, take_an_invitation, the_invitation_taken },
  })(wired)
  // The seven days of a deposit (MBX-2) and the time an invitation can be
  // taken (INV-4): waits with no world, whose payload goes back to their
  // returns, which discard the envelope and take the invitation away.
  const waits = zz.effect_executor({
    registry: { ...deposits_registry, ...invitations_registry },
    versions,
    returns: { discard_an_envelope, take_away_an_invitation },
  })({
    'mailbox/deposits/effect/wait_seven_days_from_the_deposit': zz.returns_the_payload,
    'stand/invitations/effect/wait_until_it_can_no_longer_be_taken': zz.returns_the_payload,
  })
  const stands = world.stands ?? []
  return {
    /** The versions of the store, as its readers meet its data (DOM-22). */
    versions,
    /** The ports the trees invoke, by folder: the business's use cases. */
    invoked,
    /** The fact log of the store (DOM-17). */
    log: storage.log,
    depositor,
    holder,
    inviter,
    passer_by,
    /**
     * The HTTP interface through the desk (MBX-9), to serve (REL-2), what it
     * says of itself (REL-4), and the pages of its stands (INV-7).
     */
    http: the_desks_http_interface({
      depositor,
      holder,
      inviter,
      passer_by,
      hash: world.hash,
      clock: world.clock,
      room: world.room,
      about: about(the_build),
      stands: stands.map((stand) => ({
        name: stand.name,
        has_an_inviter: stand.inviter !== undefined,
        app: stand.app,
      })),
      the_inviter_signed: the_inviter_signed(stands, world.signature_holds ?? (() => false)),
      the_page: the_page_of_a_stand,
    }),
    /** The effect executor of the deposits' and the invitations' waits, started (DOM-14). */
    waits: () =>
      waits({
        outbox: storage.outbox,
        returns: { ...deposits, ...invitations },
        state: storage.executor,
        clock: world.clock,
        elapsed: world.elapsed,
      }),
  }
}

/** The relay, as its configurator wires it. */
export type Relay = Awaited<ReturnType<ReturnType<typeof relay>>>
