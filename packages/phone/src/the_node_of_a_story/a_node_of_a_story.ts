// The node of a story (WEB-21, WEB-29): a node of test, which keeps in
// memory what her node would read and records what the screens hand it,
// its activities in progress until a story ends them; and the device's
// sources, ids drawn in the order a story gives them and Saturday 21
// November 2026, 10:00 in Rome. The same for the screens' stories in a DOM
// of test (`phone/test/screens`) and in the gallery (WEB-28), so that the
// gallery draws each case as the tests prove it. Moved here from the tests'
// harness in the MVP's part 2. [Q, C, 24 Nov 2026]

import type { TheKernelsTraced } from '@q-mino/adapters-common'
import type {
  AnEventOfALeaf,
  APartServed,
  HerNode,
  HerTicket,
  TheDevice,
} from '@q-mino/adapters-web/screens'
import * as zz from '@q-mino/domains/library'
import type * as ui_value from '@q-mino/domains/ui/_value.ts'
import type * as user_value from '@q-mino/domains/user/_value.ts'
import * as activities_value from '@q-mino/domains/user/activities/_value.ts'

/** What the node of test reads, in the screens' words. */
export interface WhatTheNodeHolds {
  readonly faces: readonly ui_value.a_face_seen[]
  readonly the_active_face: string | undefined
  readonly contacts: readonly ui_value.a_contact_seen[]
  readonly cards: readonly ui_value.a_contact_card[]
  readonly tickets: readonly HerTicket[]
  readonly extensions: readonly ui_value.an_extension_seen[]
  readonly offers: ui_value.the_offers
  readonly offered: readonly { readonly bond: string; readonly offered: activities_value.offered }[]
  readonly activities: readonly activities_value.activity_card[]
  readonly drafts: readonly { readonly for: ui_value.a_draft_for; readonly text: string }[]
  readonly held_letters: readonly user_value.a_held_letter[]
  readonly happened: readonly user_value.what_happened_without_a_fact[]
  /** What came back of the last question asked of each bond about the extensions in common (UI-5). */
  readonly in_common: readonly {
    readonly bond: string
    readonly answer: ui_value.the_extensions_in_common
  }[]
  /** The relay of the configuration, and how her node last met it (UI-5). */
  readonly the_relay: { readonly address: string; readonly met: ui_value.the_relay_met }
  /** The device's network, as her phone tells it (UI-5). */
  readonly the_network: ui_value.the_device_s_network
}

export const nothing_held: WhatTheNodeHolds = {
  faces: [],
  the_active_face: undefined,
  contacts: [],
  cards: [],
  tickets: [],
  extensions: [],
  offers: [],
  offered: [],
  activities: [],
  drafts: [],
  held_letters: [],
  happened: [],
  in_common: [],
  the_relay: { address: 'https://relay.cumino.test', met: 'answered' },
  the_network: 'not_told',
}

/** Saturday 21 November 2026, 10:00 in Rome, as the clock writes it (UTC). */
export const ten_in_rome = zz.date_time.parse('2026-11-21T09:00:00.000Z')

const the_same = (one: unknown, other: unknown): boolean =>
  JSON.stringify(one) === JSON.stringify(other)

/** A node of test: what it holds, what the screens handed it, and the story's hand on it. */
export interface ANodeOfTest {
  readonly node: HerNode
  /** Everything the screens handed it, in order. */
  readonly handed: () => readonly ui_value.what_it_asks[]
  /** The activities asked, in order. */
  readonly activities_asked: () => readonly activities_value.what_is_asked[]
  /** What it holds now. */
  readonly holds: () => WhatTheNodeHolds
  /** The story changes what it holds; the screens are told. */
  readonly comes_to_hold: (change: (now: WhatTheNodeHolds) => WhatTheNodeHolds) => void
  /** An activity in progress ends, how in her words; the screens are told. */
  readonly ends: (activity_id: string, how: activities_value.how_it_ended) => void
  /** What the parts asked of it, as the kernel's fence served it, in order (K-3). */
  readonly asked_by_the_parts: () => readonly APartServed[]
  /** What the kernel's fence refused of the parts, traced (EXT-4). */
  readonly fenced: () => readonly TheKernelsTraced[]
}

/**
 * How the node of a story answers what a part asks (K-3): by the leaf's
 * events, in order, until its flow ends; by default greetings' greeting
 * (`the_greeting_is_sent`, its one event) and nothing else.
 */
export type HowItAnswersTheParts = (served: APartServed) => AsyncIterable<AnEventOfALeaf>

/** The default answer to a part: greetings' leaf `greet_a_bond` gives its greeting, any other leaf nothing. */
const greetings_answers: HowItAnswersTheParts = (served) => {
  const events: readonly AnEventOfALeaf[] =
    served.invokes.extension === 'greetings' && served.invokes.use_case === 'usecase/greet_a_bond'
      ? [{ event: 'the_greeting_is_sent', greeting: 'G-1' }]
      : []
  return {
    [Symbol.asyncIterator]: () => {
      const each = events[Symbol.iterator]()
      return { next: () => Promise.resolve(each.next()) }
    },
  }
}

export const a_node_of_test = (
  at_the_start: Partial<WhatTheNodeHolds> = {},
  answers_the_parts: HowItAnswersTheParts = greetings_answers,
): ANodeOfTest => {
  let held: WhatTheNodeHolds = { ...nothing_held, ...at_the_start }
  let asked_by_the_parts: readonly APartServed[] = []
  let fenced: readonly TheKernelsTraced[] = []
  let handed: readonly ui_value.what_it_asks[] = []
  let listeners: readonly (() => void)[] = []
  const tell = (): void => {
    for (const listener of listeners) listener()
  }
  const comes_to_hold = (change: (now: WhatTheNodeHolds) => WhatTheNodeHolds): void => {
    held = change(held)
    tell()
  }
  const takes = (what: ui_value.what_it_asks): void => {
    handed = [...handed, what]
    switch (what.asks) {
      case 'an_activity':
        held = {
          ...held,
          activities: [
            ...held.activities,
            activities_value.activity_card.parse({
              activity_id: what.activity_id,
              what: what.what,
              asked_at: ten_in_rome,
              stage: { stage: 'in_progress' },
            }),
          ],
        }
        return
      case 'to_keep_a_draft':
        held = {
          ...held,
          drafts: [
            ...held.drafts.filter((one) => !the_same(one.for, what.for)),
            { for: what.for, text: what.text },
          ],
        }
        return
      case 'to_drop_a_draft':
        held = { ...held, drafts: held.drafts.filter((one) => !the_same(one.for, what.for)) }
        return
      case 'to_change_face':
        held = { ...held, the_active_face: what.face }
        return
    }
  }
  const node: HerNode = {
    her_faces: () => Promise.resolve(held.faces),
    the_active_face: () => Promise.resolve(held.the_active_face),
    her_contacts: () => Promise.resolve(held.contacts),
    a_contact: (bond) => Promise.resolve(held.cards.find((card) => card.bond === bond)),
    her_ticket: (bond) =>
      Promise.resolve(held.tickets.find((ticket) => ticket.ready.bond === bond)),
    the_extensions: () => Promise.resolve(held.extensions),
    the_offers: () => Promise.resolve(held.offers),
    offered_to: (bond) =>
      Promise.resolve(held.offered.find((one) => one.bond === bond)?.offered ?? []),
    the_extensions_in_common_with: (bond) =>
      Promise.resolve(
        held.in_common.find((one) => one.bond === bond)?.answer ?? { answer: 'not_asked' },
      ),
    the_relay: () => Promise.resolve(held.the_relay),
    the_network: () => Promise.resolve(held.the_network),
    an_activity: (activity_id) =>
      Promise.resolve(held.activities.find((one) => one.activity_id === activity_id)),
    the_activities_in_progress: () =>
      Promise.resolve(held.activities.filter((one) => one.stage.stage === 'in_progress')),
    a_draft: (purpose) =>
      Promise.resolve(held.drafts.find((one) => the_same(one.for, purpose))?.text),
    the_held_letters: () => Promise.resolve(held.held_letters),
    what_happened: () => Promise.resolve(held.happened),
    asks: (what) => {
      takes(what)
      return Promise.resolve()
    },
    // What a part asks, recorded and answered as the story says (K-3); what the fence refused, recorded.
    a_part_asks: (served) => {
      asked_by_the_parts = [...asked_by_the_parts, served]
      return answers_the_parts(served)
    },
    a_part_is_fenced: (traced) => {
      fenced = [...fenced, traced]
    },
    when_it_changes: (listener) => {
      listeners = [...listeners, listener]
      return () => {
        listeners = listeners.filter((one) => one !== listener)
      }
    },
  }
  return {
    node,
    handed: () => handed,
    activities_asked: () => handed.flatMap((one) => (one.asks === 'an_activity' ? [one.what] : [])),
    holds: () => held,
    asked_by_the_parts: () => asked_by_the_parts,
    fenced: () => fenced,
    comes_to_hold,
    ends: (activity_id, how) => {
      comes_to_hold((now) => ({
        ...now,
        activities: now.activities.map((one) =>
          one.activity_id === activity_id
            ? activities_value.activity_card.parse({
                ...one,
                stage: { stage: 'ended', how_it_ended: how, ended_at: ten_in_rome },
              })
            : one,
        ),
      }))
    },
  }
}

/** A phone's sharing of test: its share, or none (a browser with no Web Share), and its clipboard, each recording what it was given. */
export const a_sharing_of_test = (
  with_a_share: boolean,
): TheDevice['the_navigator'] & {
  readonly shared: () => readonly string[]
  readonly copied: () => readonly string[]
} => {
  let shared: readonly string[] = []
  let copied: readonly string[] = []
  return {
    ...(with_a_share
      ? {
          share: (data: { readonly url: string }) => {
            shared = [...shared, data.url]
            return Promise.resolve()
          },
        }
      : {}),
    clipboard: {
      writeText: (text: string) => {
        copied = [...copied, text]
        return Promise.resolve()
      },
    },
    shared: () => shared,
    copied: () => copied,
  }
}

/** The device of a story: the ids it draws, in order (A1, F_a…), the time at ten in Rome, a camera that a story gives or none, a phone that shares. */
export const a_device_of_test = (
  ids: readonly string[],
  scans: TheDevice['scans'] = () => Promise.resolve({ is: 'missing' }),
  the_navigator: TheDevice['the_navigator'] = a_sharing_of_test(true),
): TheDevice => {
  let left = [...ids]
  return {
    draws_an_id: () => {
      const [next, ...rest] = left
      if (next === undefined) throw new Error('the story drew more ids than it gave')
      left = rest
      return next
    },
    clock: { now: () => ten_in_rome, time_zone: zz.time_zone.parse('Europe/Rome') },
    scans,
    the_navigator,
  }
}
