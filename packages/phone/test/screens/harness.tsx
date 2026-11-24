// The harness of the screens' stories (step 22): a node of test, which keeps
// in memory what her node would read and records what the screens hand it,
// its activities in progress until a story ends them; the device's sources,
// ids drawn in the order a story gives them and Saturday 21 November 2026,
// 10:00 in Rome; and the app opened in a DOM of test, with the Italian
// texts, its screens read as she reads them. Real timers only, every wait
// bounded (two seconds).

import type * as boundary from '@q-mino/boundary'
import {
  TheScreens,
  type TheBrowsersHistory,
  type HerNode,
  type HerTicket,
  type TheDevice,
} from '@q-mino/adapters-web/screens'
import * as zz from '@q-mino/domains/library'
import * as ui_value from '@q-mino/domains/ui/_value.ts'
import type * as user_value from '@q-mino/domains/user/_value.ts'
import * as activities_value from '@q-mino/domains/user/activities/_value.ts'
import { options, render } from 'preact'
import { expect, vi } from 'vitest'
import { texts } from '../../src/texts/index.ts'

// Each turn drawn before the story's next gesture, as a browser draws
// between two events: a story clicks right after it types, in the same
// task, where Preact would draw at the next microtask. [Q, C, 24 Nov 2026]
options.debounceRendering = (draws) => {
  draws()
}

// A tap only on what is on the screen, as in a browser: a story that taps a
// button it held after the screen took it away taps nothing (Preact's
// listeners stay on a removed element). [Q, C, 24 Nov 2026]
// eslint-disable-next-line @typescript-eslint/unbound-method -- the DOM's own tap, called below on its element
const the_tap = HTMLElement.prototype.click
HTMLElement.prototype.click = function (this: HTMLElement) {
  if (this.isConnected) the_tap.call(this)
}

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
    // No part of an extension is drawn yet (WEB-23): none asks, none is fenced.
    a_part_asks: () => ({
      [Symbol.asyncIterator]: () => ({
        next: () => Promise.resolve({ done: true, value: undefined }),
      }),
    }),
    a_part_is_fenced: () => undefined,
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

/** The page of the test site, where the app is served (PWA-4). */
export const the_page = 'https://q-mino-prova.github.io/q-/'

/** An entry of a history of test: its address and its state, as the browser keeps them (a structured copy). */
interface AnEntryOfTest {
  readonly url: string
  readonly state: unknown
}

/**
 * A page's session history of test (WEB-25), as a browser keeps it: the
 * app's entries, each with its address and its state; a move (back, forward, an address typed) told at
 * the next task, as `popstate` is; back from the app's first entry leaves
 * the app. Kept across a refresh: the same history given to the app opened
 * again.
 */
export interface AHistoryOfTest extends TheBrowsersHistory {
  /** The fragment of the entry she is on. */
  readonly the_address: () => string
  /** The app's entries, from its first. */
  readonly the_entries: () => readonly AnEntryOfTest[]
  /** Which of the app's entries she is on, from 0. */
  readonly at: () => number
  /** Whether back took her out of the app. */
  readonly left: () => boolean
  /** The browser's back, or Android's. */
  readonly back: () => void
  /** The browser's forward. */
  readonly forward: () => void
  /** An address typed in the bar, on the same page: a new entry with no state. */
  readonly types: (address: string) => void
}

export const a_history_of_test = (opened_at: string = the_page): AHistoryOfTest => {
  let entries: readonly AnEntryOfTest[] = [{ url: new URL(opened_at, the_page).href, state: null }]
  let at = 0
  let left = false
  let listeners: readonly (() => void)[] = []
  const copy = (state: unknown): unknown =>
    state === null || state === undefined ? null : JSON.parse(JSON.stringify(state))
  const shown = (): AnEntryOfTest => {
    const entry = entries[at]
    if (entry === undefined) throw new Error('no entry')
    return entry
  }
  const tells = (): void => {
    setTimeout(() => {
      for (const listener of listeners) listener()
    }, 0)
  }
  const writes = (at_this: number, state: unknown, url: string | undefined): void => {
    const entry = { url: new URL(url ?? shown().url, shown().url).href, state: copy(state) }
    entries = [...entries.slice(0, at_this), entry]
    at = at_this
  }
  const go = (delta = 0): void => {
    const to = at + delta
    if (to < 0) {
      left = true
      return
    }
    if (to >= entries.length || delta === 0) return
    at = to
    tells()
  }
  return {
    history: {
      get state() {
        return shown().state
      },
      pushState: (state, _, url) => {
        writes(at + 1, state, url)
      },
      replaceState: (state, _, url) => {
        entries = [
          ...entries.slice(0, at),
          { url: new URL(url ?? shown().url, shown().url).href, state: copy(state) },
          ...entries.slice(at + 1),
        ]
      },
      go,
    },
    location: {
      get href() {
        return shown().url
      },
    },
    addEventListener: (_, listener) => {
      listeners = [...listeners, listener]
    },
    removeEventListener: (_, listener) => {
      listeners = listeners.filter((one) => one !== listener)
    },
    the_address: () => new URL(shown().url).hash,
    the_entries: () => entries,
    at: () => at,
    left: () => left,
    back: () => {
      go(-1)
    },
    forward: () => {
      go(1)
    },
    types: (address) => {
      writes(at + 1, null, address)
      tells()
    },
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
  /** The words of the extensions the app carries (EXT-16, WEB-22); the phone's by default. */
  readonly words?: Readonly<Record<string, boundary.the_words_of_an_extension>>
  /** Her gesture on the data of an older test release (WEB-8), given on the test channel only; none by default. */
  readonly clears_the_data_and_starts_again?: () => void
  /** The page's session history (WEB-25); none by default, the way in memory only. */
  readonly the_history?: AHistoryOfTest
  /** The link an address holds (WEB-1), as the composition root reads it; none by default. */
  readonly the_link_in?: (address: string) => ui_value.what_it_holds | undefined
}): TheAppOpened => {
  const root = document.createElement('div')
  document.body.append(root)
  render(
    <TheScreens
      node={wiring.node}
      device={wiring.device}
      {...(wiring.a_link === undefined ? {} : { a_link: wiring.a_link })}
      {...(wiring.clears_the_data_and_starts_again === undefined
        ? {}
        : { clears_the_data_and_starts_again: wiring.clears_the_data_and_starts_again })}
      {...(wiring.the_history === undefined ? {} : { the_history: wiring.the_history })}
      {...(wiring.the_link_in === undefined ? {} : { the_link_in: wiring.the_link_in })}
      texts={
        wiring.words === undefined ? texts.screens : { ...texts.screens, extensions: wiring.words }
      }
    />,
    root,
  )
  const shown = (): HTMLElement => {
    const screen = root.querySelector<HTMLElement>('main > div:not([hidden]) > section')
    if (screen === null) throw new Error('no screen shown')
    return screen
  }
  return {
    root,
    shown,
    closes: () => {
      render(null, root)
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
