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
  type TheDevice,
} from '@q-mino/adapters-web/screens'
import type * as ui_value from '@q-mino/domains/ui/_value.ts'
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

export {
  a_device_of_test,
  a_node_of_test,
  a_sharing_of_test,
  nothing_held,
  ten_in_rome,
  type ANodeOfTest,
  type WhatTheNodeHolds,
} from '../../src/the_node_of_a_story/index.ts'

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
