// The harness of the screens' stories (step 22): a node of test, which keeps
// in memory what her node would read and records what the screens hand it,
// its activities in progress until a story ends them; the device's sources,
// ids drawn in the order a story gives them and Saturday 21 November 2026,
// 10:00 in Rome; and the app opened in a DOM of test, with the Italian
// texts, its screens read as she reads them. Real timers only, every wait
// bounded (two seconds).

import {
  TheScreens,
  type HerNode,
  type HerTicket,
  type TheDevice,
} from '@q-mino/adapters-web/screens'
import * as zz from '@q-mino/domains/library'
import * as ui_value from '@q-mino/domains/ui/_value.ts'
import type * as user_value from '@q-mino/domains/user/_value.ts'
import * as activities_value from '@q-mino/domains/user/activities/_value.ts'
import { render } from 'solid-js/web'
import { expect, vi } from 'vitest'
import { texts } from '../../src/texts/index.ts'

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
}

/** Saturday 21 November 2026, 10:00 in Rome. */
export const ten_in_rome = zz.date_time.parse('2026-11-21T10:00:00+01:00')

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
}

export const a_node_of_test = (at_the_start: Partial<WhatTheNodeHolds> = {}): ANodeOfTest => {
  let held: WhatTheNodeHolds = { ...nothing_held, ...at_the_start }
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

/** The device of a story: the ids it draws, in order (A1, F_a…), the time at ten in Rome, a camera that a story gives or none. */
export const a_device_of_test = (
  ids: readonly string[],
  scans: TheDevice['scans'] = () => Promise.resolve({ is: 'missing' }),
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
  }
}

/** The app opened in a DOM of test, with the Italian texts. */
export interface TheAppOpened {
  readonly root: HTMLElement
  /** The screen shown, the last of the way. */
  readonly shown: () => HTMLElement
  readonly closes: () => void
}

export const opens_the_app = (wiring: {
  readonly node: HerNode
  readonly device: TheDevice
  readonly a_link?: ui_value.what_it_holds
}): TheAppOpened => {
  const root = document.createElement('div')
  document.body.append(root)
  const dispose = render(() => <TheScreens {...wiring} texts={texts.screens} />, root)
  const shown = (): HTMLElement => {
    const screen = root.querySelector<HTMLElement>('main > div:not([hidden]) > section')
    if (screen === null) throw new Error('no screen shown')
    return screen
  }
  return {
    root,
    shown,
    closes: () => {
      dispose()
      root.remove()
    },
  }
}

/** Wait until the check holds, two seconds at most (real timers). */
export const until = (check: () => void): Promise<void> =>
  vi.waitFor(check, { timeout: 2000, interval: 10 })

/** The title of the screen shown. */
export const the_title = (app: TheAppOpened): string =>
  app.shown().querySelector('h1')?.textContent ?? ''

/** A button of the screen shown, by its words. */
export const the_button = (within: HTMLElement, words: string): HTMLButtonElement => {
  const found = [...within.querySelectorAll('button')].find(
    (button) => button.textContent.trim() === words,
  )
  if (found === undefined) throw new Error(`no button "${words}"`)
  return found
}

/** Whether the screen shown has a button with these words. */
export const has_a_button = (within: HTMLElement, words: string): boolean =>
  [...within.querySelectorAll('button')].some((button) => button.textContent.trim() === words)

/** She types in a field of the screen shown, by its name. */
export const types = (within: HTMLElement, field: string, text: string): void => {
  const input = within.querySelector<HTMLInputElement>(`input[name="${field}"]`)
  if (input === null) throw new Error(`no field "${field}"`)
  input.value = text
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

/** The words of the screen shown, its spaces collapsed. */
export const the_words = (app: TheAppOpened): string =>
  app.shown().textContent.replace(/\s+/g, ' ').trim()

export { expect, texts }
