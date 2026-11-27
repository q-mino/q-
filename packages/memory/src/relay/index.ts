// The relay in the `memory` stack (CFG-3, PER-19, MBX-6, MBX-7, INV-5): the
// trees of the desk's personas wired over the ports of `mailbox/deposits`
// and `stand/invitations` on q-'s oracle, the effect executor of their waits,
// and the desk's interface, which turns what a request shows into the
// `Caller`: nothing, a collect secret R hashed into its deposit address D,
// the hash behind a port, or the signature of a stand's inviter, which the
// interface verified (the HTTP interface's, MBX-9, INV-5). On the
// model of Shed's configurator (`test/shed/configurator.ts`): everything is
// wired, and checked (CFG-2), when the relay starts, before any request.

import * as zz from '@q-mino/domains/library'
import { desk } from '@q-mino/domains/desk/_node.ts'
import { caller } from '@q-mino/domains/desk/_value.ts'
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
import { deposit_address } from '@q-mino/domains/mailbox/deposits/_id.ts'
import { discard_an_envelope } from '@q-mino/domains/mailbox/deposits/_usecase.ts'
import { registry as invitations_registry } from '@q-mino/domains/stand/invitations/_registry.ts'
import { majors as invitations_majors } from '@q-mino/domains/stand/invitations/_majors.ts'
import { stand } from '@q-mino/domains/stand/invitations/_id.ts'
import { take_away_an_invitation } from '@q-mino/domains/stand/invitations/_usecase.ts'
import {
  log,
  mailbox_ports,
  no_deposit,
  no_invitation,
  seen_by,
  stand_ports,
  type Cell,
  type MailboxState,
  type StandState,
  type Strategy,
} from '../oracle/index.ts'

/** What the relay's cell keeps: the deposits of its mailboxes and the invitations of its stands. */
export type RelayState = MailboxState & StandState

/** A relay that has kept nothing yet. */
export const a_new_relay: RelayState = { ...no_deposit, ...no_invitation }

/**
 * The hash of a collect secret, behind a port (PER-19, V5): D = hash(R). The
 * domains compute no hash (GR-8); the primitives are an adapter's (step 18).
 */
export type HashOfACollectSecret = (secret: string) => Promise<string>

/**
 * What a request shows the desk's interface: nothing, the collect secret R
 * of a mailbox, or a signature that the stand's key verified (INV-5: over
 * HTTP the interface verifies it; one that does not verify shows nothing).
 */
export type Shown =
  | { readonly shows: 'nothing' }
  | { readonly shows: 'a_collect_secret'; readonly secret: string }
  | { readonly shows: 'the_signature_of_a_stand_s_inviter'; readonly stand: string }

/**
 * The desk's interface (MBX-6, PER-19): the `Caller` the node `desk` takes, from what
 * the request shows. With nothing, anyone; with a collect secret, its D:
 * R never enters the tree (V5). A hash not in D's form is a fault of the
 * port, which throws.
 */
export const the_desks_interface =
  (hash: HashOfACollectSecret) =>
  async (shown: Shown): Promise<caller> =>
    shown.shows === 'nothing'
      ? caller.parse({ shows: 'nothing' })
      : shown.shows === 'the_signature_of_a_stand_s_inviter'
        ? caller.parse({ shows: shown.shows, stand: stand.parse(shown.stand) })
        : caller.parse({
            shows: 'a_collect_secret',
            id: deposit_address.parse(await hash(shown.secret)),
          })

/**
 * The scope of a depositor's operation (DOM-11, MBX-6): the persona alone,
 * since a depositor is anyone and has no id (PER-19). Two deposits are told
 * apart by their operations' ids, which the phones draw at random (D62).
 */
export const the_scope_of_a_deposit = 'depositor'

/**
 * The scope of a passer-by's take (DOM-11, INV-3): the persona alone, as a
 * depositor's, since a passer-by has no id; its operation drawn at random
 * by the page.
 */
export const the_scope_of_a_take = 'passer_by'

/** The scope of an inviter's leave (DOM-11, INV-5): the persona and the stand it is the inviter of. */
export const the_scope_of_a_leave = (of: string): string => `inviter/${of}`

/**
 * The world outside the relay: its clock, by which it keeps the time of a
 * deposit and its seven days (MBX-1, MBX-2), and the time that passes, which
 * wakes the executor when a wait comes due (DOM-14).
 */
export interface World {
  readonly clock: zz.Clock
  readonly elapsed: zz.Elapsed
}

/** The release of the relay's adapter: its read streaming natively, the oracle's, or composed by the library (DOM-2). */
export interface Release {
  readonly streams?: Strategy
}

export const relay =
  (cell: Cell<RelayState>, release: Release = {}) =>
  async (world: World) => {
    // The versions of the cell, from the majors of the domains whose facts and
    // effects it keeps, checked against what it keeps (DOM-22).
    const versions = await zz.versions([deposits_majors, invitations_majors])({
      stored: cell.stored_versions,
    })
    // Each domain's module sees its part of the relay's cell (MBX-7).
    const deposits = mailbox_ports(
      seen_by<MailboxState, RelayState>(cell),
      release.streams,
    )(versions)
    const invitations = stand_ports(seen_by<StandState, RelayState>(cell))(versions)
    const facts = log(cell)
    // The ports the trees invoke, by the folder of what they serve (PER-6).
    const invoked = { 'mailbox/deposits': deposits, 'stand/invitations': invitations }
    const wired = { invoked, log: facts, trace: cell.trace, elapsed: world.elapsed }
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
    return {
      /** The versions of the store, as its readers meet its data (DOM-22). */
      versions,
      /** The ports the trees invoke, by folder: the business's use cases. */
      invoked,
      /** The fact log of the cell (DOM-17). */
      log: facts,
      depositor,
      holder,
      inviter,
      passer_by,
      /** The effect executor of the deposits' and the invitations' waits, started (DOM-14). */
      waits: () =>
        waits({
          outbox: cell.outbox,
          returns: { ...deposits, ...invitations },
          state: cell.executor,
          clock: world.clock,
          elapsed: world.elapsed,
        }),
    }
  }

/** The relay, as the `memory` stack starts it. */
export type Relay = Awaited<ReturnType<ReturnType<typeof relay>>>
