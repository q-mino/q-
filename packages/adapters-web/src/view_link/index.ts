// A view's link (UI-1, WEB-25): the phone's page with the view she is on
// after `#/`, in the words of her language, so that a refresh opens the same
// view and the browser's back finds the one before. The fragment never
// leaves the phone (a browser sends none to the server), as a ticket's
// (WEB-1); the two are told apart by their marks, `/` for a view and
// `ticket=` for a ticket, so that a view is never read as a ticket nor a
// ticket as a view. A view is a place of the screens, never a step of a
// flow (the camera on, a QR shown: a refresh opens that screen at its
// start); its ids are those the screens show (a bond's, an extension's name,
// a page's name), never a key.

import * as ui_value from '@q-mino/domains/ui/_value.ts'

/** What a link's fragment begins with when it holds a view: the kind of what it holds. */
export const the_mark_of_a_view = '/'

/**
 * The words of the views in a link, in one language (the phone's texts
 * fill them, Italian first): each a segment of the address she reads, made
 * of letters, digits and `-` only, all different.
 */
export interface TheViewsWords {
  /** Her contacts, the home; a contact under it, by its bond. */
  readonly my_contacts: string
  readonly the_handshake_in_person: string
  readonly the_handshake_at_a_distance: string
  /** An invitation, which the address names but never holds: its ticket is in memory only. */
  readonly an_invitation: string
  /** The extensions; an extension under it, by its name. */
  readonly the_extensions: string
  readonly what_happened: string
  readonly the_server: string
  /** The introduction, both readings (UI-6): read back as read again, from the home. */
  readonly the_introduction: string
}

/**
 * What a link holds as a view: a view, the screen it opens; an invitation,
 * which only the screens kept in memory can open again (its ticket is never
 * in the address); or no view (no fragment, a ticket's, words that name no
 * view).
 */
export type AViewsLink =
  | { readonly holds: 'a_view'; readonly screen: ui_value.a_screen }
  | { readonly holds: 'an_invitation' }
  | { readonly holds: 'no_view' }

const no_view: AViewsLink = { holds: 'no_view' }

const a_segment = (text: string): string => encodeURIComponent(text)

/**
 * The fragment of a screen's view (`#/contatti/L_b`): every screen of the
 * way has one, but the first face, which is a state of the app (no face yet,
 * whatever the address); an invitation's names it, without its ticket.
 */
export const the_fragment_of_a_view =
  (words: TheViewsWords) =>
  (screen: ui_value.a_screen): string | undefined => {
    const of = (...segments: readonly string[]): string =>
      `#${the_mark_of_a_view}${segments.map(a_segment).join('/')}`
    switch (screen.screen) {
      case 'the_first_face':
        return undefined
      case 'my_contacts':
        return of(words.my_contacts)
      case 'a_contact':
        return of(words.my_contacts, screen.bond)
      case 'the_handshake_in_person':
        return of(words.the_handshake_in_person)
      case 'the_handshake_at_a_distance':
        return of(words.the_handshake_at_a_distance)
      case 'an_invitation':
        return of(words.an_invitation)
      case 'the_extensions':
        return of(words.the_extensions)
      case 'an_extension':
        return of(words.the_extensions, screen.extension)
      case 'a_page':
        return screen.told.place === 'a_bond'
          ? of(words.my_contacts, screen.told.bond, screen.extension, screen.page)
          : of(words.the_extensions, screen.extension, screen.page)
      case 'what_happened':
        return of(words.what_happened)
      case 'the_server':
        return of(words.the_server)
      case 'the_introduction':
        return of(words.the_introduction)
    }
  }

/** The segments of a view's fragment (after `#`), decoded; none when it is not a view's or a segment is not percent-encoded right. */
const the_segments_of = (fragment: string): readonly string[] | undefined => {
  if (!fragment.startsWith(the_mark_of_a_view)) return undefined
  try {
    return fragment
      .slice(the_mark_of_a_view.length)
      .split('/')
      .filter((segment) => segment !== '')
      .map((segment) => decodeURIComponent(segment))
  } catch {
    return undefined
  }
}

/** The screen these segments name, before its schema reads it. */
const the_screen_named = (words: TheViewsWords, segments: readonly string[]): unknown => {
  const [first, ...rest] = segments
  if (rest.length === 0)
    switch (first) {
      case words.my_contacts:
        return { screen: 'my_contacts' }
      case words.the_handshake_in_person:
        return { screen: 'the_handshake_in_person' }
      case words.the_handshake_at_a_distance:
        return { screen: 'the_handshake_at_a_distance' }
      case words.the_extensions:
        return { screen: 'the_extensions' }
      case words.what_happened:
        return { screen: 'what_happened' }
      case words.the_server:
        return { screen: 'the_server' }
      case words.the_introduction:
        return { screen: 'the_introduction', read: 'again' }
      default:
        return undefined
    }
  const [second, third, fourth, ...more] = rest
  if (more.length > 0) return undefined
  if (first === words.my_contacts && third === undefined)
    return { screen: 'a_contact', bond: second }
  if (first === words.my_contacts && fourth !== undefined)
    return {
      screen: 'a_page',
      extension: third,
      page: fourth,
      told: { place: 'a_bond', bond: second },
    }
  if (first === words.the_extensions && third === undefined)
    return { screen: 'an_extension', extension: second }
  if (first === words.the_extensions && fourth === undefined)
    return {
      screen: 'a_page',
      extension: second,
      page: third,
      told: { place: 'the_extension', extension: second },
    }
  return undefined
}

/**
 * The view a link holds, whatever page it points to (the link of another
 * copy of the page holds one as well): the screen, read by `ui`'s schema as
 * any data from outside; an invitation, named only; or no view.
 */
export const the_view_in_a_link =
  (words: TheViewsWords) =>
  (text: string): AViewsLink =>
    URL.canParse(text) ? the_view_in_a_fragment(words)(new URL(text).hash) : no_view

/** The view a fragment holds (`#/contatti/L_b`, as a view's address is written in the history). */
export const the_view_in_a_fragment =
  (words: TheViewsWords) =>
  (fragment: string): AViewsLink => {
    const segments = the_segments_of(fragment.startsWith('#') ? fragment.slice(1) : fragment)
    if (segments === undefined) return no_view
    if (segments.length === 1 && segments[0] === words.an_invitation)
      return { holds: 'an_invitation' }
    const read = ui_value.a_screen.safeParse(the_screen_named(words, segments))
    return read.success ? { holds: 'a_view', screen: read.data } : no_view
  }

/**
 * The way to a view opened from its address (UI-1): her contacts, the
 * home, then the screens the view is opened from, as she would have come:
 * a contact from her contacts; an extension from the extensions; a page from
 * its place (the contact, or the extension's own screen); every other view
 * from the home (the menu).
 */
export const the_way_to_a_view = (screen: ui_value.a_screen): ui_value.the_way => {
  const home: ui_value.a_screen = { screen: 'my_contacts' }
  switch (screen.screen) {
    case 'my_contacts':
      return [home]
    case 'an_extension':
      return [home, { screen: 'the_extensions' }, screen]
    case 'a_page':
      return screen.told.place === 'a_bond'
        ? [home, { screen: 'a_contact', bond: screen.told.bond }, screen]
        : [
            home,
            { screen: 'the_extensions' },
            { screen: 'an_extension', extension: screen.extension },
            screen,
          ]
    case 'the_first_face':
    case 'a_contact':
    case 'the_handshake_in_person':
    case 'the_handshake_at_a_distance':
    case 'an_invitation':
    case 'the_extensions':
    case 'what_happened':
    case 'the_server':
    case 'the_introduction':
      return [home, screen]
  }
}
