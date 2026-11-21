// Her node over the phone's ports (UI-1, USR-9, GR-3, WEB-19; part 22.1):
// the link the rendering writes once between what the composition root
// composed (`user`'s ports, `self`'s reads through the port toward `self`,
// the ticket shown, the news, the node's fact log) and the screens' view of
// it, `HerNode`, in `ui`'s words. `self`'s projections are parsed with the
// schemas of its read leaves' entries, linked to `ui`'s and `user`'s values
// field by field, every case by an exhaustive map, and parsed with their
// schemas: a field `self` adds fails nowhere, one it drops or a case it adds
// fails to compile here (GR-3's form). What a gesture asks is handed to the
// use case of `user` of its name, as the user (`self/the_user`), under an
// operation of its own, drawn before the first attempt (DOM-12); what `user`
// does not take is thrown, so that the screens tell it. A change is told at
// each fact the node's log records after it caught up (DOM-17), and at each
// news written beside it (F6). The phone's composition root gives it the
// phone it composed (step 25); the stories, a phone of the stack.

import {
  the_held_letters,
  the_scope_of_the_user,
  what_happened_in_a_tree,
  what_happened_in_the_kernel,
  type the_reads_of_self,
  type TheKernelsTraced,
} from '@q-mino/adapters-common'
import type { their_ticket } from '@q-mino/domains/bonds/address_book/_value.ts'
import * as zz from '@q-mino/domains/library'
import * as self_usecase from '@q-mino/domains/persona/self/_usecase.ts'
import * as ui_value from '@q-mino/domains/ui/_value.ts'
import { what_an_extension_asks } from '@q-mino/domains/user/_dsl.ts'
import * as user_value from '@q-mino/domains/user/_value.ts'
import type * as activities_usecase from '@q-mino/domains/user/activities/_usecase.ts'
import * as activities_value from '@q-mino/domains/user/activities/_value.ts'
import type * as choices_usecase from '@q-mino/domains/user/choices/_usecase.ts'
import type * as drafts_usecase from '@q-mino/domains/user/drafts/_usecase.ts'
import type * as drafts_value from '@q-mino/domains/user/drafts/_value.ts'
import { z } from 'zod'
import { the_link_of_a_ticket } from '../ticket_link/index.ts'
import type { HerNode, HerTicket } from './her_node.ts'

/** A command of `user`'s, as its use case types it (USR-1). */
type ACommand<use_case> = zz.CommandUseCasePort<use_case>

/** A read of `user`'s, as its use case types it (USR-1): its input in, its snapshot out, or its input refused. */
type ARead<use_case> =
  use_case extends zz.ReadUseCase<infer query>
    ? (
        ...read: Parameters<zz.ReadUseCasePort<query, never, false>>
      ) => ReturnType<zz.ReadUseCasePort<query, never, false>>
    : never

/** The ports of `user` the screens' gestures and reads reach (USR-1..USR-6), as the domain's use cases type them. */
export interface TheUsersPorts {
  readonly ask_for_an_activity: ACommand<typeof activities_usecase.ask_for_an_activity>
  readonly an_activity: ARead<typeof activities_usecase.an_activity>
  readonly the_activities_in_progress: ARead<typeof activities_usecase.the_activities_in_progress>
  readonly keep_a_draft: ACommand<typeof drafts_usecase.keep_a_draft>
  readonly drop_a_draft: ACommand<typeof drafts_usecase.drop_a_draft>
  readonly a_draft: ARead<typeof drafts_usecase.a_draft>
  readonly change_face: ACommand<typeof choices_usecase.change_face>
  readonly the_active_face: ARead<typeof choices_usecase.the_active_face>
}

/**
 * The news of her node (USR-8, F6), as `the_news.ts` tells it: what the
 * executors and the reactions hold, with the extensions' notices; the
 * kernel's trace and the trees'; and what tells that any of them is
 * written, which no fact records.
 */
export interface TheNewsOfHerNode {
  readonly held: () => Promise<Parameters<typeof the_held_letters>[0]>
  readonly traced: () => readonly TheKernelsTraced[]
  readonly tree_traced: () => readonly zz.Traced<unknown>[]
  /** Tell each time a letter is held, a notice told or a trace written; the function returned stops telling. */
  readonly when_written: (tell: () => void) => () => void
}

/**
 * What the composition root gives the link, from the phone it composed: the
 * node's clock; the ids of the operations, drawn before the first attempt
 * (`ids_drawn_at_random`, DOM-12); `user`'s ports; `self`'s reads through the
 * port toward `self` (`the_reads_of_self`); her ticket as her node shows it,
 * with its secret (BND-9), and the address of the phone's page, where its
 * link points (WEB-1); the extensions installed, by name (the
 * composition's, EXT-4); the news; the node's fact log (DOM-17).
 */
export interface HerNodesWiring {
  readonly clock: zz.Clock
  readonly draws_an_id: () => string
  readonly user: TheUsersPorts
  readonly self: ReturnType<typeof the_reads_of_self>
  readonly the_ticket_shown: (bond: string) => Promise<their_ticket | undefined>
  readonly the_page: string
  readonly the_extensions_installed: () => readonly string[]
  readonly the_news: TheNewsOfHerNode
  readonly the_log: zz.FactLog
}

// `self`'s words, as its read leaves declare their entries.
type MyFace = z.output<(typeof self_usecase.my_faces)[typeof zz.$UseCase]['entry']>
type MyBond = z.output<(typeof self_usecase.my_bonds)[typeof zz.$UseCase]['entry']>
type ABond = z.output<(typeof self_usecase.a_bond)[typeof zz.$UseCase]['entry']>
type MyTicket = z.output<(typeof self_usecase.my_ticket)[typeof zz.$UseCase]['entry']>
type AnExtension = z.output<(typeof self_usecase.an_extension)[typeof zz.$UseCase]['entry']>
type AnOffer = z.output<
  (typeof self_usecase.the_extensions_offered_to_a_bond)[typeof zz.$UseCase]['entry']
>

/** An event of a read of `self`, as the port toward `self` passes it: `self`'s words unchanged. */
type AnEventOfSelf = { readonly event: string } & Readonly<Record<string, unknown>>

/** The entries of a read of `self`, parsed with its leaf's schema; a read that closes, or says nothing, is a fault of the app's, never hers. */
const the_entries_of_self = async <entry extends z.ZodType>(
  entry: entry,
  events: AsyncIterable<AnEventOfSelf>,
): Promise<readonly z.output<entry>[]> => {
  for await (const event of events) {
    if (event.event !== 'snapshot') throw new Error(`a read of self closed: ${event.event}`)
    return z.array(entry).parse(event['entries'])
  }
  throw new Error('a read of self said nothing')
}

/** The entries of a read of `user`'s; an input it refused is a fault of the app's. */
const the_entries_of_user = async <entry>(
  events: AsyncIterable<zz.SnapshotEvent<entry> | zz.InputNotInSchema>,
): Promise<readonly entry[]> => {
  for await (const event of events) {
    if (event.event === 'snapshot') return event.entries
    throw new Error(`a read of user refused its input: ${event.reason}`)
  }
  throw new Error('a read of user said nothing')
}

/** How `user` answers a command (DOM-11), every case: taken, or not taken, which the screens tell. */
interface AnAnswer {
  readonly outcome: 'applied' | 'rejected' | 'identity_already_used' | 'invalid_request'
}

/** What `user` did with what was asked: resolved once it took it; thrown otherwise, or if it said nothing. */
const what_user_did = async (answers: AsyncIterable<AnAnswer>): Promise<void> => {
  let last: AnAnswer | undefined = undefined
  for await (const answer of answers) last = answer
  if (last === undefined) throw new Error('user said nothing of what was asked')
  switch (last.outcome) {
    case 'applied':
      return
    case 'rejected':
    case 'identity_already_used':
    case 'invalid_request':
      throw new Error(`user did not take what was asked: ${last.outcome}`)
  }
}

/** The paths of `user`'s commands a gesture is handed to, which their fingerprints name (DOM-11). */
const the_paths = {
  ask_for_an_activity: 'user/activities/usecase/ask_for_an_activity',
  keep_a_draft: 'user/drafts/usecase/keep_a_draft',
  drop_a_draft: 'user/drafts/usecase/drop_a_draft',
  change_face: 'user/choices/usecase/change_face',
} as const

/** Whether they have her yet, in the screens' words. */
const the_confirmation_of = (confirmation: MyBond['confirmation']): ui_value.the_confirmation => {
  switch (confirmation.state) {
    case 'awaited':
      return { state: 'awaited' }
    case 'received':
      return { state: 'received', at: confirmation.at }
  }
}

/** How they shook hands, in the screens' words. */
const the_ways = {
  in_person: 'in_person',
  at_a_distance: 'at_a_distance',
} as const satisfies Record<ABond['handshake']['way'], ui_value.a_contact_card['handshake']['way']>

/** Whether an extension is active, in the screens' words (EXT-7, EXT-10). */
const what_it_is = {
  active: 'active',
  not_active: 'not_active',
  waiting_for_the_new_manifest: 'waiting_for_the_new_manifest',
} as const satisfies Record<AnExtension['state']['is'], ui_value.an_extension_seen['is']>

/** An extension point of a manifest, in her words (EXT-16). */
const the_points = {
  action: 'action',
  slot: 'slot',
  page: 'page',
} as const satisfies Record<
  AnExtension['manifest']['extension_points'][number]['point'],
  user_value.a_manifest['extension_points'][number]['point']
>

/** A manifest as she is shown it (EXT-7): `self`'s, in `user`'s words, which name what it sees and touches; one she cannot be told is not shown. */
const the_manifest_she_is_shown = (manifest: AnExtension['manifest']): user_value.a_manifest =>
  user_value.a_manifest.parse({
    name: manifest.name,
    version: manifest.version,
    sees: { known: manifest.sees.known },
    touches: manifest.touches,
    extension_points: manifest.extension_points.map((point) => ({
      point: the_points[point.point],
      name: point.name,
      place: point.place,
    })),
    leaves_on_known: manifest.leaves_on_known,
    majors: { self: manifest.majors.self, known: manifest.majors.known },
  })

/** What a draft of the screens is for, in `user`'s words (USR-5). */
const the_purpose_of = (purpose: ui_value.a_draft_for): drafts_value.what_it_is_for => {
  switch (purpose.for) {
    case 'the_name_of_my_first_face':
      return { for: 'the_name_of_my_first_face' }
    case 'the_name_i_give_a_bond':
      return { for: 'the_name_i_give_a_bond', bond: purpose.bond }
  }
}

/** A face of hers, as the screens show it. */
const a_face_seen = (face: MyFace): ui_value.a_face_seen =>
  ui_value.a_face_seen.parse({ face: face.face_id, name: face.name })

/** A contact in her list, as the screens show it. */
const a_contact_seen = (bond: MyBond): ui_value.a_contact_seen =>
  ui_value.a_contact_seen.parse({
    bond: bond.bond_id,
    name: bond.name,
    introduced_as: bond.their_face.introduced_as,
    confirmation: the_confirmation_of(bond.confirmation),
  })

/** A contact's card, as the screens show it. */
const a_contact_card = (bond: ABond): ui_value.a_contact_card =>
  ui_value.a_contact_card.parse({
    bond: bond.bond_id,
    name: bond.name,
    introduced_as: bond.their_face.introduced_as,
    confirmation: the_confirmation_of(bond.confirmation),
    handshake: { way: the_ways[bond.handshake.way], at: bond.handshake.at },
    their_relays: bond.their_mailbox.relays,
  })

/** Her ticket ready, as the screens show it. */
const a_ticket_ready = (ticket: MyTicket): ui_value.a_ticket_ready =>
  ui_value.a_ticket_ready.parse({ bond: ticket.bond_id, expires_at: ticket.expires_at })

/** An extension, as the screens show it, with what it asks (USR-7). */
const an_extension_seen = (extension: AnExtension): ui_value.an_extension_seen => {
  const manifest = the_manifest_she_is_shown(extension.manifest)
  return ui_value.an_extension_seen.parse({
    extension: extension.extension,
    version: manifest.version,
    is: what_it_is[extension.state.is],
    manifest,
    what_it_asks: what_an_extension_asks(manifest),
  })
}

/** What her node offers a bond, in `user`'s words (EXT-8). */
const what_is_offered = (offers: readonly AnOffer[]): activities_value.offered =>
  activities_value.offered.parse(
    offers.map((offer) => ({ extension: offer.extension, majors: offer.majors })),
  )

/** Her node, as the screens see it, over the phone's ports. */
export const her_node_over = (wiring: HerNodesWiring): HerNode => {
  const now = (): zz.RootContext => ({
    now: zz.in_zone(wiring.clock.time_zone)(wiring.clock.now()),
    time_zone: wiring.clock.time_zone,
  })
  /** The context of a command of the user's (DOM-11): now, under an operation drawn for it, in the user's scope. */
  const as_the_user = (path: string, input: unknown): zz.CommandRootContext => {
    const id = wiring.draws_an_id()
    return {
      ...now(),
      operation: { id: zz.operation_id.parse(id), scope: the_scope_of_the_user },
      correlation: zz.correlation.parse(id),
      fingerprint: zz.fingerprint_of({ path, input }),
    }
  }

  const her_contacts = async (): Promise<readonly ui_value.a_contact_seen[]> =>
    (
      await the_entries_of_self(
        self_usecase.my_bonds[zz.$UseCase].entry,
        wiring.self('my_bonds', {}),
      )
    ).map(a_contact_seen)

  const offered_to = async (bond: string): Promise<activities_value.offered> =>
    what_is_offered(
      await the_entries_of_self(
        self_usecase.the_extensions_offered_to_a_bond[zz.$UseCase].entry,
        wiring.self('the_extensions_offered_to_a_bond', { bond_id: bond }),
      ),
    )

  const her_ticket = async (bond: string): Promise<HerTicket | undefined> => {
    const [ready] = await the_entries_of_self(
      self_usecase.my_ticket[zz.$UseCase].entry,
      wiring.self('my_ticket', { bond_id: bond }),
    )
    if (ready === undefined) return undefined
    const shown = await wiring.the_ticket_shown(bond)
    if (shown === undefined) return undefined
    return { ready: a_ticket_ready(ready), link: the_link_of_a_ticket(wiring.the_page)(shown) }
  }

  /** The bonds each extension is offered to (EXT-7): what her node offers each of her bonds, by extension, in the order met. */
  const the_offers = async (): Promise<ui_value.the_offers> => {
    const offers = await Promise.all(
      (await her_contacts()).map(async (contact) => ({
        bond: contact.bond,
        offered: await offered_to(contact.bond),
      })),
    )
    const extensions = [
      ...new Set(offers.flatMap((offer) => offer.offered.map((each) => each.extension))),
    ]
    return ui_value.the_offers.parse(
      extensions.map((extension) => ({
        extension,
        bonds: offers
          .filter((offer) => offer.offered.some((each) => each.extension === extension))
          .map((offer) => offer.bond),
      })),
    )
  }

  /** The extensions the app carries, in its order, each as the office reads it (`an_extension`); one the office does not know is not shown. */
  const the_extensions = async (): Promise<readonly ui_value.an_extension_seen[]> =>
    (
      await Promise.all(
        wiring
          .the_extensions_installed()
          .map((name) =>
            the_entries_of_self(
              self_usecase.an_extension[zz.$UseCase].entry,
              wiring.self('an_extension', { extension: name }),
            ),
          ),
      )
    )
      .flat()
      .map(an_extension_seen)

  const asks = (what: ui_value.what_it_asks): Promise<void> => {
    switch (what.asks) {
      case 'an_activity': {
        const input = { activity_id: what.activity_id, what: what.what }
        return what_user_did(
          wiring.user.ask_for_an_activity(as_the_user(the_paths.ask_for_an_activity, input), input),
        )
      }
      case 'to_keep_a_draft': {
        const input = { for: the_purpose_of(what.for), text: what.text }
        return what_user_did(
          wiring.user.keep_a_draft(as_the_user(the_paths.keep_a_draft, input), input),
        )
      }
      case 'to_drop_a_draft': {
        const input = { for: the_purpose_of(what.for) }
        return what_user_did(
          wiring.user.drop_a_draft(as_the_user(the_paths.drop_a_draft, input), input),
        )
      }
      case 'to_change_face': {
        const input = { face: what.face }
        return what_user_did(
          wiring.user.change_face(as_the_user(the_paths.change_face, input), input),
        )
      }
    }
  }

  /**
   * Tell each fact the log records once it caught up, and each news
   * written, until stopped: one iteration of the log, each step its next
   * event or the stop (as the office's follower, EXT-15). A position the
   * log keeps no longer, or a log that fails, ends it, told once: the
   * screens read her node again, whose reads tell what is wrong.
   */
  const when_it_changes = (tell: () => void): (() => void) => {
    let following = true
    let stop_now = (): void => undefined
    const stopped = new Promise<'stopped'>((resolve) => {
      stop_now = () => {
        resolve('stopped')
      }
    })
    const told = (): void => {
      if (following) tell()
    }
    const log = wiring.the_log(undefined)[Symbol.asyncIterator]()
    const follows = async (): Promise<void> => {
      let caught_up = false
      while (following) {
        const woke = await Promise.race([stopped, log.next()])
        if (woke === 'stopped' || woke.done === true) return
        switch (woke.value.event) {
          case 'position_unavailable':
            told()
            return
          case 'caught_up':
            caught_up = true
            break
          case 'fact':
            if (caught_up) told()
            break
        }
      }
    }
    void follows().catch(told)
    const stop_the_news = wiring.the_news.when_written(told)
    return () => {
      following = false
      stop_now()
      stop_the_news()
      void log.return?.().catch(() => undefined)
    }
  }

  return {
    her_faces: async () =>
      (
        await the_entries_of_self(
          self_usecase.my_faces[zz.$UseCase].entry,
          wiring.self('my_faces', {}),
        )
      ).map(a_face_seen),
    the_active_face: async () =>
      (await the_entries_of_user(wiring.user.the_active_face(now(), {})))[0]?.face,
    her_contacts,
    a_contact: async (bond) => {
      const [card] = await the_entries_of_self(
        self_usecase.a_bond[zz.$UseCase].entry,
        wiring.self('a_bond', { bond_id: bond }),
      )
      return card === undefined ? undefined : a_contact_card(card)
    },
    her_ticket,
    the_extensions,
    the_offers,
    offered_to,
    an_activity: async (activity_id) =>
      (await the_entries_of_user(wiring.user.an_activity(now(), { activity_id })))[0],
    the_activities_in_progress: () =>
      the_entries_of_user(wiring.user.the_activities_in_progress(now(), {})),
    a_draft: async (purpose) =>
      (await the_entries_of_user(wiring.user.a_draft(now(), { for: the_purpose_of(purpose) })))[0]
        ?.text,
    the_held_letters: async () => the_held_letters(await wiring.the_news.held()),
    what_happened: () =>
      Promise.resolve([
        ...wiring.the_news.traced().map(what_happened_in_the_kernel),
        ...wiring.the_news.tree_traced().flatMap((entry) => what_happened_in_a_tree(entry) ?? []),
      ]),
    asks,
    when_it_changes,
  }
}
