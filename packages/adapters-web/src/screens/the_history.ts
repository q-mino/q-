// The way in the browser's history (UI-1, WEB-25): each screen of the way an
// entry of the page's session history, its address the view's link, its
// state the addresses of the way up to it, so that a refresh opens the same
// way again and the browser's back (Android's too, in the installed app)
// goes to the screen before, leaving the app only from the first. The
// browser's objects are given as they are (WEB-5): `window`, by the parts
// the screens use.

import type * as ui_value from '@q-mino/domains/ui/_value.ts'
import { z } from 'zod'
import {
  the_fragment_of_a_view,
  the_view_in_a_fragment,
  the_way_to_a_view,
  type TheViewsWords,
} from '../view_link/index.ts'

/**
 * The parts of the page's `window` the way is written in (WEB-5): its
 * session history, its address, and the event of a move in the history
 * (back, forward, an address typed).
 */
export interface TheBrowsersHistory {
  readonly history: {
    readonly state: unknown
    pushState(data: unknown, unused: string, url?: string): void
    replaceState(data: unknown, unused: string, url?: string): void
    go(delta?: number): void
  }
  readonly location: { readonly href: string }
  addEventListener(type: 'popstate', listener: () => void): void
  removeEventListener(type: 'popstate', listener: () => void): void
}

/** The state of an entry the screens wrote: the addresses of the way up to it, the first face's empty. */
const an_entry_s_state = z.strictObject({
  the_way: z.array(z.string().max(2048)).min(1).max(32),
})

/**
 * The entry the browser is on: one the screens wrote, with the addresses of
 * the way up to it (its depth, the screens before it); or another, with no
 * way (the page opened, an address typed, a link followed), read from its
 * address alone.
 */
export type AnEntry =
  | { readonly entry: 'of_the_way'; readonly addresses: readonly string[] }
  | { readonly entry: 'opened' }

/** The entry the browser is on, its state read as any data from outside. */
export const the_entry = (page: TheBrowsersHistory): AnEntry => {
  const read = an_entry_s_state.safeParse(page.history.state)
  return read.success ? { entry: 'of_the_way', addresses: read.data.the_way } : { entry: 'opened' }
}

/** How many entries of the way are before the one the browser is on. */
export const the_depth_of = (entry: AnEntry): number =>
  entry.entry === 'of_the_way' ? entry.addresses.length - 1 : 0

/** The addresses of a way, the first face's empty (a state of the app, with no view). */
export const the_addresses_of =
  (words: TheViewsWords) =>
  (way: ui_value.the_way): readonly string[] =>
    way.map((screen) => the_fragment_of_a_view(words)(screen) ?? '')

/** The address of the screen shown: its view's, or, for the first face, the address the page has. */
const the_address_shown = (page: TheBrowsersHistory, addresses: readonly string[]): string => {
  const last = addresses.at(-1)
  return last === undefined || last === '' ? page.location.href : last
}

/** A screen opened on top: an entry of its own, after the one she was on. */
export const pushes = (page: TheBrowsersHistory, addresses: readonly string[]): void => {
  page.history.pushState({ the_way: addresses }, '', the_address_shown(page, addresses))
}

/** The entry she is on, written again with this way. */
export const replaces = (page: TheBrowsersHistory, addresses: readonly string[]): void => {
  page.history.replaceState({ the_way: addresses }, '', the_address_shown(page, addresses))
}

/** The entry she is on, left with its address and no way: the first face's (her address kept for after it). */
export const lets_go = (page: TheBrowsersHistory): void => {
  page.history.replaceState(null, '', page.location.href)
}

/**
 * A way written as entries from the one she is on: the home in place of it,
 * each screen after it an entry of its own, so that back from the last goes
 * through each and leaves the app from the home.
 */
export const writes_the_way = (
  page: TheBrowsersHistory,
  words: TheViewsWords,
  way: ui_value.the_way,
): void => {
  const addresses = the_addresses_of(words)(way)
  replaces(page, addresses.slice(0, 1))
  for (let depth = 2; depth <= addresses.length; depth += 1) pushes(page, addresses.slice(0, depth))
}

/**
 * The way of an entry of the way (UI-1): the screens of the way now that
 * have the same addresses kept as they are (back finds a screen as she left
 * it), the others opened from their addresses; an invitation is kept only
 * while the way holds it (its ticket is never in the address). None when an
 * address opens nothing: then the view the entry shows, from her contacts,
 * if it opens; else none.
 */
export const the_way_of_an_entry = (
  words: TheViewsWords,
  now: ui_value.the_way | undefined,
  addresses: readonly string[],
): ui_value.the_way | undefined => {
  const of_a_view = the_fragment_of_a_view(words)
  const kept: ui_value.a_screen[] = []
  for (const [index, address] of addresses.entries()) {
    const screen = now?.[index]
    if (screen === undefined || of_a_view(screen) !== address) break
    kept.push(screen)
  }
  const opened: ui_value.a_screen[] = []
  for (const address of addresses.slice(kept.length)) {
    const view = the_view_in_a_fragment(words)(address)
    if (view.holds !== 'a_view') return the_view_shown(words, addresses.at(-1))
    opened.push(view.screen)
  }
  const [first, ...rest] = [...kept, ...opened]
  return first === undefined ? undefined : [first, ...rest]
}

/** The way to the view an address holds, from her contacts; none if it holds no view. */
export const the_view_shown = (
  words: TheViewsWords,
  address: string | undefined,
): ui_value.the_way | undefined => {
  if (address === undefined || address === '') return undefined
  const view = the_view_in_a_fragment(words)(address)
  return view.holds === 'a_view' ? the_way_to_a_view(view.screen) : undefined
}
