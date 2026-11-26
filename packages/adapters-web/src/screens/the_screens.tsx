// The screens of the phone, rendered (UI-1, V2, ADP-7): the way she opened
// them, each kept while it is open (only the last shown); the start read
// from her node (her faces, the face she acts as, a link she opened), and,
// when those reads fail, the fault told, never an endless wait (a record out
// of its form told as the data of an older test release, WEB-8, with the
// gesture to clear them where the composition root gives it); what a turn
// asks handed to her node in the order asked, and where it goes on the way;
// her node's changes counted, so that each screen reads it again.

import { signal } from '@preact/signals'
import * as ui from '@q-mino/domains/ui/_dsl.ts'
import type * as ui_value from '@q-mino/domains/ui/_value.ts'
import type { JSX } from 'preact'
import { useEffect, useRef } from 'preact/hooks'
import { Gesture, Notice, Strip, Why } from '../design/index.ts'
import type { HerNode } from '../her_node/index.ts'
import { ARecordOutOfItsForm } from '../indexeddb/index.ts'
import { kept } from './a_screen.ts'
import {
  lets_go,
  pushes,
  replaces,
  the_addresses_of,
  the_depth_of,
  the_entry,
  the_view_shown,
  the_way_of_an_entry,
  writes_the_way,
  type TheBrowsersHistory,
} from './the_history.ts'
import { AContact } from './a_contact.tsx'
import { APage } from './a_page.tsx'
import { AnExtension } from './an_extension.tsx'
import { AnInvitation } from './an_invitation.tsx'
import { MyContacts } from './my_contacts.tsx'
import type { TheScreensTexts } from './texts.ts'
import { TheAppContext, TheScreenIsShown, type TheApp, type TheDevice } from './the_app.ts'
import { TheExtensions } from './the_extensions.tsx'
import { TheFirstFace } from './the_first_face.tsx'
import { TheHandshakeAtADistance } from './the_handshake_at_a_distance.tsx'
import { TheHandshakeInPerson } from './the_handshake_in_person.tsx'
import { TheIntroduction } from './the_introduction.tsx'
import { TheServer } from './the_server.tsx'
import { WhatHappened } from './what_happened.tsx'

/** What the screens are wired to, by the composition root (step 25) or a test. */
export interface TheScreensWiring {
  readonly node: HerNode
  readonly device: TheDevice
  readonly texts: TheScreensTexts
  /** The link she opened the app with (WEB-1), as the page's address holds it; none without one. */
  readonly a_link?: ui_value.what_it_holds
  /**
   * Her gesture on the data of an older test release (WEB-8): the node
   * stopped, its database deleted, the app opened again. The composition
   * root gives it on the test channel only; without it the screens tell the
   * data and offer nothing.
   */
  readonly clears_the_data_and_starts_again?: () => void
  /**
   * The page's session history, where the way is written (WEB-25): a
   * refresh opens the same way, the browser's back goes to the screen
   * before. The composition root gives `window`; without it the way is in
   * memory only.
   */
  readonly the_history?: TheBrowsersHistory
  /**
   * The link an address holds (WEB-1), read by the composition root as it
   * reads the one the app is opened with: a link followed while the app is
   * open moves the browser to it on the same page (its fragment only
   * differs), and its invitation opens as at a start.
   */
  readonly the_link_in?: (address: string) => ui_value.what_it_holds | undefined
  /**
   * The address of her relay's public configuration (REL-8), what its
   * operator declares of it, which the server's screen points to. The
   * composition root gives it for the project's relay only; without it the
   * screen points to nothing.
   */
  readonly the_relay_s_public_configuration?: string
}

/** Why the screens do not open (WEB-18): her node's opening reads failed, a record out of its form told apart (WEB-8); the message, whole, under "Perché". */
type WhyTheyDoNotOpen =
  | { readonly why: 'the_data_of_an_older_test_release'; readonly message: string }
  | { readonly why: 'a_fault'; readonly message: string }

const why_they_do_not_open = (fault: unknown): WhyTheyDoNotOpen =>
  fault instanceof ARecordOutOfItsForm
    ? { why: 'the_data_of_an_older_test_release', message: fault.message }
    : { why: 'a_fault', message: fault instanceof Error ? fault.message : String(fault) }

/** A key for each screen of the way, by its object: a screen stays while its object does (the way after keeps the screens it does not change). */
const a_key_for = (): ((screen: ui_value.a_screen) => number) => {
  const keys = new WeakMap<ui_value.a_screen, number>()
  let next = 0
  return (screen) => {
    const known = keys.get(screen)
    if (known !== undefined) return known
    next += 1
    keys.set(screen, next)
    return next
  }
}

export const TheScreens = (props: TheScreensWiring) => {
  const root = kept(() => {
    const way = signal<ui_value.the_way | undefined>(undefined)
    const changes = signal(0)
    const went_wrong = signal(false)
    const the_link = signal<ui_value.what_it_holds | undefined>(undefined)
    const does_not_open = signal<WhyTheyDoNotOpen | undefined>(undefined)
    const the_strip = signal<ui_value.a_strip | undefined>(undefined)
    const changed = (): void => {
      changes.value = changes.peek() + 1
    }
    // What a turn asks, handed in the order asked: a draft kept as she types
    // is kept in the order of her keys.
    let handed: Promise<void> = Promise.resolve()
    const asks = (what: ui_value.what_it_asks): void => {
      handed = handed
        .then(() => props.node.asks(what))
        .then(changed, () => {
          went_wrong.value = true
        })
    }
    const page = props.the_history
    const words = props.texts.views
    // To the start from a screen after the first entry of the way: the
    // browser goes back to that entry first, and the start is read there.
    let a_start_asked = false
    /**
     * The way of the start in the history (WEB-25): the first face leaves
     * the address as it is (a link waiting, a view asked for after her
     * face); an entry of the way, at a refresh or back at the way's first
     * entry, opens its way again; else the start's, with the view the
     * address asks above the home, written as entries from this one.
     */
    const the_way_in_the_history = (
      history: TheBrowsersHistory,
      start: ui_value.the_way,
    ): ui_value.the_way => {
      const [home] = start
      if (home === undefined || home.screen === 'the_first_face') {
        lets_go(history)
        return start
      }
      const entry = the_entry(history)
      const kept =
        start.length === 1 && entry.entry === 'of_the_way'
          ? the_way_of_an_entry(words, way.peek(), entry.addresses)
          : undefined
      if (kept !== undefined) return kept
      const asked =
        start.length === 1 ? the_view_shown(words, new URL(history.location.href).hash) : undefined
      const opened: ui_value.the_way = asked === undefined ? start : [home, ...asked.slice(1)]
      writes_the_way(history, words, opened)
      return opened
    }
    const starts = async (): Promise<void> => {
      const read = await Promise.all([props.node.her_faces(), props.node.the_active_face()]).then(
        (both) => ({ read: 'done', both }) as const,
        (fault: unknown) => ({ read: 'failed', why: why_they_do_not_open(fault) }) as const,
      )
      if (read.read === 'failed') {
        does_not_open.value = read.why
        return
      }
      const [faces, the_active_face] = read.both
      const start = ui.the_start({ faces, the_active_face, a_link: the_link.peek() })
      // A link waits for her first face; once she has one, the start opens it, once.
      if (faces.length > 0) the_link.value = undefined
      for (const one of start.asks) asks(one)
      way.value = page === undefined ? start.way : the_way_in_the_history(page, start.way)
    }
    const goes = (where: ui_value.where_it_goes): void => {
      if (where.goes === 'to_the_start') {
        const depth = page === undefined ? 0 : the_depth_of(the_entry(page))
        if (page !== undefined && depth > 0) {
          a_start_asked = true
          page.history.go(-depth)
          return
        }
        void starts()
        return
      }
      const now = way.peek()
      if (now === undefined) return
      // Back through the browser's history, which then moves the way.
      if (
        page !== undefined &&
        where.goes === 'back' &&
        now.length > 1 &&
        the_depth_of(the_entry(page)) > 0
      ) {
        page.history.go(-1)
        return
      }
      const after = ui.the_way_after(now, where, now)
      if (after === now) return
      way.value = after
      if (page === undefined) return
      const addresses = the_addresses_of(words)(after)
      if (where.goes === 'to_a_screen') pushes(page, addresses)
      else replaces(page, addresses)
    }
    /**
     * The browser moved in its history (WEB-25: back, forward, an address
     * typed): to the start asked, read there; an entry of the way opens its
     * way; one opened with a link's ticket, its invitation on top; another
     * opened (an address typed, the first face's) is a start; an
     * invitation whose ticket the way no longer holds is passed over, back.
     */
    const moves = (): void => {
      if (page === undefined) return
      if (a_start_asked) {
        a_start_asked = false
        void starts()
        return
      }
      const entry = the_entry(page)
      if (entry.entry === 'opened') {
        const link = props.the_link_in?.(page.location.href)
        const now = way.peek()
        // A link followed while she has a face: its invitation on top of
        // where she is, its entry in place of the ticket's.
        if (link !== undefined && now !== undefined && now[0]?.screen !== 'the_first_face') {
          const after = ui.the_way_after(
            now,
            { goes: 'to_a_screen', screen: { screen: 'an_invitation', link } },
            now,
          )
          way.value = after
          replaces(page, the_addresses_of(words)(after))
          return
        }
        if (link !== undefined) the_link.value = link
        void starts()
        return
      }
      const after = the_way_of_an_entry(words, way.peek(), entry.addresses)
      if (after !== undefined) way.value = after
      else if (the_depth_of(entry) > 0) page.history.go(-1)
      else void starts()
    }
    const app: TheApp = {
      get node() {
        return props.node
      },
      get device() {
        return props.device
      },
      get common() {
        return props.texts.common
      },
      changes,
      asks,
      goes,
      words: (extension) => props.texts.extensions[extension],
    }
    return {
      way,
      changes,
      went_wrong,
      the_link,
      does_not_open,
      the_strip,
      changed,
      starts,
      moves,
      app,
      key_of: a_key_for(),
    }
  })
  // The strip over every screen (UI-5), read again at each change of her
  // node: no network, else the relay that did not answer; only the last
  // read started is kept.
  useEffect(() => {
    let latest = 0
    return root.changes.subscribe(() => {
      latest += 1
      const this_read = latest
      void (async () =>
        ui.the_strip({
          relay: (await props.node.the_relay()).met,
          network: await props.node.the_network(),
        }))().then((strip) => {
        if (this_read === latest) root.the_strip.value = strip
      })
    })
  }, [])
  useEffect(() => {
    root.the_link.value = props.a_link
    const stops = props.node.when_it_changes(root.changed)
    props.the_history?.addEventListener('popstate', root.moves)
    void root.starts()
    return () => {
      stops()
      props.the_history?.removeEventListener('popstate', root.moves)
    }
  }, [])
  const the_screen = (screen: ui_value.a_screen): JSX.Element => {
    switch (screen.screen) {
      case 'the_first_face':
        return <TheFirstFace texts={props.texts.the_first_face} />
      case 'my_contacts':
        return <MyContacts texts={props.texts.my_contacts} />
      case 'a_contact':
        return <AContact texts={props.texts.a_contact} screen={screen} />
      case 'the_handshake_in_person':
        return <TheHandshakeInPerson texts={props.texts.the_handshake_in_person} />
      case 'the_handshake_at_a_distance':
        return <TheHandshakeAtADistance texts={props.texts.the_handshake_at_a_distance} />
      case 'an_invitation':
        return <AnInvitation texts={props.texts.an_invitation} screen={screen} />
      case 'the_extensions':
        return <TheExtensions texts={props.texts.the_extensions} />
      case 'an_extension':
        return <AnExtension texts={props.texts.an_extension} screen={screen} />
      case 'a_page':
        return <APage texts={props.texts.a_page} screen={screen} />
      case 'what_happened':
        return <WhatHappened texts={props.texts.what_happened} />
      case 'the_server':
        return (
          <TheServer
            texts={props.texts.the_server}
            {...(props.the_relay_s_public_configuration === undefined
              ? {}
              : { its_public_configuration: props.the_relay_s_public_configuration })}
          />
        )
      case 'the_introduction':
        return <TheIntroduction texts={props.texts.the_introduction} screen={screen} />
    }
  }
  // The focus to the title of the screen shown, at each move of the way
  // after the first (WEB-29): a screen reader says where she is, the tab
  // key starts there; the first screen keeps the page's own start.
  const the_main = useRef<HTMLElement>(null)
  useEffect(() => {
    let drawn: ui_value.the_way | undefined
    return root.way.subscribe((way) => {
      const before = drawn
      drawn = way
      if (before === undefined || way === undefined || way === before) return
      // After the draw of the way: the screen shown is the new one.
      requestAnimationFrame(() => {
        the_main.current
          ?.querySelector<HTMLElement>(':scope > div:not([hidden]) > section h1')
          ?.focus()
      })
    })
  }, [])
  const strip = root.the_strip.value?.strip
  const why = root.does_not_open.value
  const the_way = root.way.value
  return (
    <TheAppContext.Provider value={root.app}>
      <main class="screens" ref={the_main}>
        {strip === 'no_network' && (
          <div data-part="strip" data-state={strip}>
            <Strip glyph="wifi_off">{props.texts.common.no_network}</Strip>
          </div>
        )}
        {strip === 'the_relay_does_not_answer' && (
          <div data-part="strip" data-state={strip}>
            <Strip glyph="clock">{props.texts.common.the_relay_does_not_answer}</Strip>
          </div>
        )}
        {strip === 'the_relay_is_full' && (
          <div data-part="strip" data-state={strip}>
            <Strip glyph="circle_alert">{props.texts.common.the_relay_is_full}</Strip>
          </div>
        )}
        {why !== undefined ? (
          <section role="alert" class="it-does-not-start" data-state={why.why}>
            <h1>{props.texts.common.it_does_not_start}</h1>
            {why.why === 'the_data_of_an_older_test_release' && (
              <>
                <p>{props.texts.common.the_data_of_an_older_test_release}</p>
                {props.clears_the_data_and_starts_again !== undefined && (
                  <Gesture
                    kind="dangerous"
                    label={props.texts.common.clear_the_data_and_start_again}
                    does={{
                      does: 'taps',
                      taps: () => {
                        props.clears_the_data_and_starts_again?.()
                      },
                    }}
                  />
                )}
              </>
            )}
            <Why title={props.texts.common.why} message={why.message} />
          </section>
        ) : the_way === undefined ? (
          <div data-part="opening">
            <Notice kind="waiting">{props.texts.common.opening}</Notice>
          </div>
        ) : (
          the_way.map((screen, index) => (
            <AScreenOfTheWay key={root.key_of(screen)} shown={index === the_way.length - 1}>
              {the_screen(screen)}
            </AScreenOfTheWay>
          ))
        )}
        {root.went_wrong.value && (
          <div data-part="went-wrong">
            <Notice kind="fault">{props.texts.common.something_went_wrong}</Notice>
          </div>
        )}
      </main>
    </TheAppContext.Provider>
  )
}

/** A screen of the way, kept while it is open, hidden unless it is the one shown, told whether it is. */
const AScreenOfTheWay = (props: { shown: boolean; children: JSX.Element }) => {
  const shown = kept(() => signal(props.shown))
  useEffect(() => {
    shown.value = props.shown
  }, [props.shown])
  return (
    <TheScreenIsShown.Provider value={shown}>
      <div hidden={!props.shown}>{props.children}</div>
    </TheScreenIsShown.Provider>
  )
}
