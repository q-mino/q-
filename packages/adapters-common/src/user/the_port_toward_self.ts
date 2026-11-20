import * as zz from '@q-mino/domains/library'
import type { persona } from '@q-mino/domains/persona/_node.ts'
import type * as self_usecase from '@q-mino/domains/persona/self/_usecase.ts'
import { self } from '@q-mino/domains/persona/self/_version.ts'
import type { end_an_activity_input } from '@q-mino/domains/user/activities/_command.ts'
import { how_a_closing_ends } from '@q-mino/domains/user/activities/_dsl.ts'
import type { carry_out_an_activity } from '@q-mino/domains/user/activities/_effect.ts'
import type * as activities_value from '@q-mino/domains/user/activities/_value.ts'
import type * as user_value from '@q-mino/domains/user/_value.ts'
import type { z } from 'zod'
import type { Composed } from '../extensions/composition.ts'
import type { Handed, Life } from '../extensions/hosting.ts'

// The port of `user` toward `self` (GR-7, USR-1..USR-4, USR-8; part 15.2):
// the delivery of `carry_out_an_activity`, the configurator's. For a
// gesture of the kernel's screens it invokes the leaf of `self` of the same
// name, her words parsed by `self`'s schemas, under the activity's id
// (`{ id, scope: 'self/the_user' }`, DOM-12, USR-4), follows its flow to
// its last event and links `self`'s words to hers with an exhaustive map
// (GR-3's form, `satisfies` over each leaf's events), so that a new leaf or
// event of `self` fails to compile here until the link decides what it is to
// her. For an extension's action it finds the leaf in the composed manifest
// (EXT-7, EXT-10) and invokes it on the extension's `self` through its
// hosting (`zz.mounted_leaf_ports`, EXT-2), its input the place's data
// (EXT-16). For a held letter, the executor's `redeliver` and `discard` by
// the user, or the boundary's for an extension's (DOM-14, EXT-2). A
// technical outcome thrown is no end: `transient`, tried again under the
// same id (USR-4).

/** The scope of the user's entry: the persona, and who asks (PER-3, PER-24). */
export const the_scope_of_the_user = 'self/the_user'

/** The leaves of `self` the kernel's gestures are carried out by, each by the activity of the same name (USR-2): every gesture has one. */
interface TheKernelsLeaves {
  readonly make_my_first_face: typeof self_usecase.make_my_first_face
  readonly prepare_a_ticket: typeof self_usecase.prepare_a_ticket
  readonly open_their_ticket: typeof self_usecase.open_their_ticket
  readonly rename_a_bond: typeof self_usecase.rename_a_bond
  readonly remove_a_bond: typeof self_usecase.remove_a_bond
  readonly activate_an_extension: typeof self_usecase.activate_an_extension
  readonly deactivate_an_extension: typeof self_usecase.deactivate_an_extension
  readonly withdraw_the_offer_from_a_bond: typeof self_usecase.withdraw_the_offer_from_a_bond
  readonly offer_an_extension_to_a_bond: typeof self_usecase.offer_an_extension_to_a_bond
  readonly ask_a_bond_for_the_extensions_in_common: typeof self_usecase.ask_a_bond_for_the_extensions_in_common
}

/** What is asked of the kernel's screens: every case of `what_is_asked` but an extension's action and the gestures on a held letter. */
type TheKernelsGesture = Exclude<
  activities_value.what_is_asked,
  { readonly activity: 'use_an_action' | 'send_a_held_letter_again' | 'put_a_held_letter_aside' }
>

/** A gesture's leaf of `self`, by name. */
type TheKernelsLeaf = TheKernelsGesture['activity']

/** The names of a leaf's own events (D72.1): the closed set its projection gives. */
type OwnEvents<leaf> = leaf extends { readonly [zz.$UseCase]: { readonly events: infer events } }
  ? keyof events & string
  : never

/** What a leaf's own event means to her (USR-3, D74.1): the contract's meaning, her name. */
type AMeaning = 'done' | 'done_already' | 'cannot_be_done'

/**
 * The link of `self`'s events to her words (USR-3), exhaustive: every own
 * event of every leaf the kernel's gestures invoke, a meaning each. A new
 * event, or a new leaf, fails to compile here.
 */
const the_link = {
  make_my_first_face: {
    your_face_is_being_made: 'done',
    you_have_a_face_already: 'done_already',
  },
  prepare_a_ticket: {
    your_ticket_is_being_prepared: 'done',
    the_ticket_cannot_be_prepared: 'cannot_be_done',
  },
  open_their_ticket: {
    you_are_bonded: 'done',
    you_met_in_person: 'done',
    your_introduction_is_sent: 'done',
    you_opened_their_ticket_already: 'done_already',
    their_ticket_cannot_be_opened: 'cannot_be_done',
  },
  rename_a_bond: {
    the_bond_is_renamed: 'done',
    there_is_no_such_bond: 'cannot_be_done',
  },
  remove_a_bond: {
    the_bond_is_removed: 'done',
    the_bond_was_removed_already: 'done_already',
    there_is_no_such_bond: 'cannot_be_done',
  },
  activate_an_extension: {
    the_extension_is_active: 'done',
    the_extension_was_active_already: 'done_already',
    the_manifest_is_not_the_installed_one: 'cannot_be_done',
  },
  deactivate_an_extension: {
    the_extension_is_deactivated: 'done',
    the_extension_was_not_active: 'done_already',
    the_extension_cannot_be_deactivated: 'cannot_be_done',
  },
  withdraw_the_offer_from_a_bond: {
    the_offer_is_withdrawn: 'done',
    the_offer_was_withdrawn_already: 'done_already',
    the_offer_cannot_be_withdrawn: 'cannot_be_done',
  },
  offer_an_extension_to_a_bond: {
    the_extension_is_offered_again: 'done',
    the_extension_was_offered_already: 'done_already',
    the_extension_cannot_be_offered: 'cannot_be_done',
  },
  ask_a_bond_for_the_extensions_in_common: {
    the_bond_is_asked: 'done',
    the_bond_cannot_be_asked: 'cannot_be_done',
  },
} as const satisfies {
  readonly [leaf in TheKernelsLeaf]: leaf extends keyof TheKernelsLeaves
    ? Readonly<Record<OwnEvents<TheKernelsLeaves[leaf]>, AMeaning>>
    : never
}

/** A gesture's leaf and its input in `self`'s words, from hers (USR-2): `self`'s schemas parse it. */
const the_invocation_of = (
  what: TheKernelsGesture,
  relays: readonly string[],
): { readonly leaf: TheKernelsLeaf; readonly input: unknown } => {
  switch (what.activity) {
    case 'make_my_first_face':
      return { leaf: what.activity, input: { face_id: what.face, name: what.name } }
    case 'prepare_a_ticket':
      return {
        leaf: what.activity,
        input: { bond_id: what.bond, face_id: what.face, relays: [...relays] },
      }
    case 'open_their_ticket':
      return {
        leaf: what.activity,
        input: {
          bond_id: what.bond,
          their_ticket: {
            ...what.their_ticket,
            mailbox: {
              deposit_address: what.their_ticket.mailbox.deposit_address,
              relays: [...what.their_ticket.mailbox.relays],
            },
          },
          name: what.name,
        },
      }
    case 'rename_a_bond':
      return { leaf: what.activity, input: { bond_id: what.bond, name: what.name } }
    case 'remove_a_bond':
      return { leaf: what.activity, input: { bond_id: what.bond } }
    case 'activate_an_extension':
      return { leaf: what.activity, input: { manifest: what.manifest } }
    case 'deactivate_an_extension':
      return { leaf: what.activity, input: { extension: what.extension } }
    case 'withdraw_the_offer_from_a_bond':
    case 'offer_an_extension_to_a_bond':
      return { leaf: what.activity, input: { extension: what.extension, bond_id: what.bond } }
    case 'ask_a_bond_for_the_extensions_in_common':
      return {
        leaf: what.activity,
        input: {
          bond_id: what.bond,
          offered: what.offered.map((each) => ({
            extension: each.extension,
            majors: [...each.majors],
          })),
        },
      }
  }
}

/** An event of a leaf's flow, as a tree's port gives it. */
type AnEvent = { readonly event: string } & Readonly<Record<string, unknown>>

/**
 * What a leaf said, as data (USR-3): its event's name and its payload; a
 * base event, which has none, with its other fields (the issues of an
 * invalid request). As JSON, so that the office keeps what it can read.
 */
const what_it_said_of = (event: AnEvent): user_value.what_it_said => {
  const { event: name, payload, ...rest } = event
  const given: unknown = payload ?? rest
  const as_json: unknown = JSON.parse(JSON.stringify(given ?? {}))
  return { event: name, payload: as_json }
}

/** The last event of a flow, followed to its end; none for a flow that said nothing. */
const the_last_event_of = async (events: AsyncIterable<AnEvent>): Promise<AnEvent | undefined> => {
  let last: AnEvent | undefined = undefined
  for await (const event of events) last = event
  return last
}

/** What the office makes of a carrying out: the input of its return, `end_an_activity`. */
type returned = z.input<typeof end_an_activity_input>

/** An extension as the port reaches it on `self` (EXT-2, EXT-15): its composition, whether active, its life, its leaves mounted on `self`, its letters held and the boundary's gestures on them. */
export interface AnExtensionOnSelf {
  readonly composed: Composed
  readonly is_active: () => Promise<boolean>
  readonly life: () => Life
  readonly on_self: zz.MountedLeafPort<zz.EntryOf<typeof persona>>
  /** The letters its notices tell held (EXT-2): a `dead_letter` not `released` since. */
  readonly held: () => readonly string[]
  readonly redeliver: (letter: string) => Handed
  readonly discard: (
    letter: string,
    trace: { readonly by: string; readonly reason: string },
  ) => Handed
}

/** The kernel's held letters, by their names (`<effect>/<entry id>`, DOM-15): whether held, and the executor's gestures on one by the user. */
export interface TheKernelsLetters {
  readonly held: () => Promise<readonly string[]>
  readonly redeliver: (letter: string) => Promise<'delivered' | 'held_again' | 'not_held'>
  readonly discard: (
    letter: string,
    trace: { readonly by: string; readonly reason: string },
  ) => Promise<'discarded' | 'not_held'>
}

/**
 * The wiring of the port (GR-7): the node's clock; `self`'s tree by path,
 * the kernel's; the version of `self` it speaks (its current, PER-17); the
 * relays of a ticket, the node's (stage 1: one relay, USR-2); the
 * extensions installed, by name; the kernel's held letters.
 */
export interface ThePortTowardSelf {
  readonly clock: zz.Clock
  readonly self: zz.TreePortByPath<zz.EntryOf<typeof persona>>
  readonly speaks?: zz.Semver
  readonly relays: readonly string[]
  readonly the_extension: (name: string) => AnExtensionOnSelf | undefined
  readonly the_kernels_letters: TheKernelsLetters
}

/** The user's trace of a discard (D67.3): by her, with her reason. */
const by_the_user = (because: string) => ({
  by: 'the_user',
  reason: because.length > 0 ? because : 'put aside by the user',
})

/**
 * The delivery of `carry_out_an_activity` (USR-2..USR-4, USR-8): what is
 * asked carried out under the activity's id, and how it ended, the input of
 * `end_an_activity`; a fall, `transient`; a leaf that says nothing,
 * exhausted (a held letter of `user`'s, DOM-15).
 */
export const the_delivery_of_an_activity = (wiring: ThePortTowardSelf) => {
  const the_context = (activity_id: string, version: zz.Semver) => ({
    now: zz.in_zone(wiring.clock.time_zone)(wiring.clock.now()),
    time_zone: wiring.clock.time_zone,
    caller: { is: 'the_user' as const },
    version,
    operation: { id: zz.operation_id.parse(activity_id), scope: the_scope_of_the_user },
    correlation: zz.correlation.parse(activity_id),
  })
  const ended = (activity_id: string, how_it_ended: activities_value.how_it_ended) => ({
    outcome: 'delivered' as const,
    returns: { activity_id, how_it_ended } satisfies returned,
  })
  /** A fault of the app's composition, never hers (USR-3): what was asked names nothing the node has. */
  const the_app_cannot = (activity_id: string, event: string, payload: object) =>
    ended(activity_id, { ended: 'the_app_cannot_do_it', said: { event, payload } })

  const a_kernels_gesture = async (activity_id: string, what: TheKernelsGesture) => {
    const invocation = the_invocation_of(what, wiring.relays)
    const last = await the_last_event_of(
      wiring.self(the_context(activity_id, wiring.speaks ?? self[zz.$Version]), {
        leaf: `usecase/${invocation.leaf}`,
        input: invocation.input,
      }),
    )
    if (last === undefined)
      return { outcome: 'exhausted' as const, reason: `${invocation.leaf} said nothing` }
    const said = what_it_said_of(last)
    const closing = how_a_closing_ends(said)
    if (closing !== undefined) return ended(activity_id, closing)
    const meanings: Readonly<Record<string, AMeaning>> = the_link[invocation.leaf]
    const meaning = meanings[said.event]
    return meaning === undefined
      ? ended(activity_id, { ended: 'the_app_cannot_do_it', said })
      : ended(activity_id, { ended: meaning, said })
  }

  const an_action = async (
    activity_id: string,
    what: Extract<activities_value.what_is_asked, { readonly activity: 'use_an_action' }>,
  ) => {
    const extension = wiring.the_extension(what.extension)
    if (extension === undefined)
      return the_app_cannot(activity_id, 'not_found', { extension: what.extension })
    const action = extension.composed.manifest.actions[what.action]
    const surface = extension.composed.surfaces.self
    if (action?.on !== what.on.place || surface === undefined)
      return the_app_cannot(activity_id, 'not_found', {
        extension: what.extension,
        action: what.action,
      })
    if (!(await extension.is_active()))
      return ended(activity_id, {
        ended: 'the_extension_cannot_be_reached',
        because: 'it_is_not_active',
      })
    if (extension.life().life === 'stopped')
      return ended(activity_id, {
        ended: 'the_extension_cannot_be_reached',
        because: 'it_has_stopped',
      })
    const last = await the_last_event_of(
      extension.on_self(the_context(activity_id, surface.version), {
        leaf: action.invokes,
        input: what.on.place === 'a_bond' ? { bond: what.on.bond } : {},
      }),
    )
    if (last === undefined)
      return { outcome: 'exhausted' as const, reason: `${what.action} said nothing` }
    const said = what_it_said_of(last)
    return ended(activity_id, how_a_closing_ends(said) ?? { ended: 'the_extension_answered', said })
  }

  const handed = { event: 'the_letter_is_handed', payload: {} }
  const no_longer_held = { event: 'the_letter_is_no_longer_held', payload: {} }

  const a_held_letter = async (
    activity_id: string,
    what: Extract<
      activities_value.what_is_asked,
      { readonly activity: 'send_a_held_letter_again' | 'put_a_held_letter_aside' }
    >,
  ) => {
    if (what.whose.of === 'the_kernel') {
      const letters = wiring.the_kernels_letters
      const outcome =
        what.activity === 'send_a_held_letter_again'
          ? await letters.redeliver(what.letter)
          : await letters.discard(what.letter, by_the_user(what.because))
      return ended(
        activity_id,
        outcome === 'not_held'
          ? { ended: 'done_already', said: no_longer_held }
          : { ended: 'done', said: handed },
      )
    }
    const extension = wiring.the_extension(what.whose.extension)
    if (extension === undefined)
      return the_app_cannot(activity_id, 'not_found', { extension: what.whose.extension })
    if (!extension.held().includes(what.letter))
      return ended(activity_id, { ended: 'done_already', said: no_longer_held })
    const outcome =
      what.activity === 'send_a_held_letter_again'
        ? extension.redeliver(what.letter)
        : extension.discard(what.letter, by_the_user(what.because))
    return outcome === 'handed'
      ? ended(activity_id, { ended: 'done', said: handed })
      : { outcome: 'transient' as const }
  }

  return async (entry: {
    readonly id: zz.entry_id
    readonly payload: carry_out_an_activity
  }): Promise<zz.Delivered<returned>> => {
    const { activity_id, what } = entry.payload
    try {
      switch (what.activity) {
        case 'use_an_action':
          return await an_action(activity_id, what)
        case 'send_a_held_letter_again':
        case 'put_a_held_letter_aside':
          return await a_held_letter(activity_id, what)
        default:
          return await a_kernels_gesture(activity_id, what)
      }
    } catch {
      // A fall of the node or of an extension (EXT-15): no end, tried again under the same id.
      return { outcome: 'transient' }
    }
  }
}

/** The reads of `self` her screens take through the port (USR-2: reads are free, D58), as `self` gives them. */
export type TheReadsOfSelf = Extract<
  keyof typeof self_usecase,
  | 'my_faces'
  | 'my_bonds'
  | 'a_bond'
  | 'my_ticket'
  | 'an_extension'
  | 'the_extensions_offered_to_a_bond'
>

/** A read of `self` through the port, as the user, at the version it speaks: passing through, `self`'s words unchanged. */
export const the_reads_of_self =
  (wiring: Pick<ThePortTowardSelf, 'clock' | 'self' | 'speaks'>) =>
  (read: TheReadsOfSelf, input: unknown) =>
    wiring.self(
      {
        now: zz.in_zone(wiring.clock.time_zone)(wiring.clock.now()),
        time_zone: wiring.clock.time_zone,
        caller: { is: 'the_user' as const },
        version: wiring.speaks ?? self[zz.$Version],
      },
      { leaf: `usecase/${read}`, input },
    )
