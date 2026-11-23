// The screens of the phone, rendered (UI-1, V2, ADP-7): the way she opened
// them, each kept while it is open (only the last shown); the start read
// from her node (her faces, the face she acts as, a link she opened), and,
// when those reads fail, the fault told, never an endless wait (a record out
// of its form told as the data of an older test release, WEB-8, with the
// gesture to clear them where the composition root gives it); what a turn
// asks handed to her node in the order asked, and where it goes on the way;
// her node's changes counted, so that each screen reads it again.

import * as ui from '@q-mino/domains/ui/_dsl.ts'
import type * as ui_value from '@q-mino/domains/ui/_value.ts'
import {
  createResource,
  createSignal,
  For,
  Match,
  onCleanup,
  onMount,
  Show,
  Switch,
  type JSX,
} from 'solid-js'
import type { HerNode } from '../her_node/index.ts'
import { ARecordOutOfItsForm } from '../indexeddb/index.ts'
import { AContact } from './a_contact.tsx'
import { APage } from './a_page.tsx'
import { AnExtension } from './an_extension.tsx'
import { AnInvitation } from './an_invitation.tsx'
import { MyContacts } from './my_contacts.tsx'
import type { TheScreensTexts } from './texts.ts'
import {
  TheAppContext,
  TheScreenIsShown,
  type AFrameToPlace,
  type TheApp,
  type TheDevice,
} from './the_app.ts'
import { TheExtensions } from './the_extensions.tsx'
import { TheFirstFace } from './the_first_face.tsx'
import { TheHandshakeAtADistance } from './the_handshake_at_a_distance.tsx'
import { TheHandshakeInPerson } from './the_handshake_in_person.tsx'
import { TheServer } from './the_server.tsx'
import { WhatHappened } from './what_happened.tsx'

/** What the screens are wired to, by the composition root (step 25) or a test. */
export interface TheScreensWiring {
  readonly node: HerNode
  readonly device: TheDevice
  readonly texts: TheScreensTexts
  /** The link she opened the app with (WEB-1), as the page's address holds it; none without one. */
  readonly a_link?: ui_value.what_it_holds
  /** The documents of the frames, the files of the extensions' bundles their points `show` (EXT-16, WEB-23): the composition's. */
  readonly documents: (frame: AFrameToPlace) => string | undefined
  /**
   * Her gesture on the data of an older test release (WEB-8): the node
   * stopped, its database deleted, the app opened again. The composition
   * root gives it on the test channel only; without it the screens tell the
   * data and offer nothing.
   */
  readonly clears_the_data_and_starts_again?: () => void
}

/** Why the screens do not open (WEB-18): her node's opening reads failed, a record out of its form told apart (WEB-8); the message, whole, under "Perché". */
type WhyTheyDoNotOpen =
  | { readonly why: 'the_data_of_an_older_test_release'; readonly message: string }
  | { readonly why: 'a_fault'; readonly message: string }

const why_they_do_not_open = (fault: unknown): WhyTheyDoNotOpen =>
  fault instanceof ARecordOutOfItsForm
    ? { why: 'the_data_of_an_older_test_release', message: fault.message }
    : { why: 'a_fault', message: fault instanceof Error ? fault.message : String(fault) }

export const TheScreens = (props: TheScreensWiring) => {
  const [way, set_way] = createSignal<ui_value.the_way | undefined>(undefined)
  const [changes, set_changes] = createSignal(0)
  const [went_wrong, set_went_wrong] = createSignal(false)
  const [the_link, set_the_link] = createSignal<ui_value.what_it_holds | undefined>(undefined)
  const [does_not_open, set_does_not_open] = createSignal<WhyTheyDoNotOpen | undefined>(undefined)
  const changed = (): void => {
    set_changes((count) => count + 1)
  }
  // What a turn asks, handed in the order asked: a draft kept as she types
  // is kept in the order of her keys.
  let handed: Promise<void> = Promise.resolve()
  const asks = (what: ui_value.what_it_asks): void => {
    handed = handed
      .then(() => props.node.asks(what))
      .then(changed, () => {
        set_went_wrong(true)
      })
  }
  const starts = async (): Promise<void> => {
    const read = await Promise.all([props.node.her_faces(), props.node.the_active_face()]).then(
      (both) => ({ read: 'done', both }) as const,
      (fault: unknown) => ({ read: 'failed', why: why_they_do_not_open(fault) }) as const,
    )
    if (read.read === 'failed') {
      set_does_not_open(read.why)
      return
    }
    const [faces, the_active_face] = read.both
    const start = ui.the_start({ faces, the_active_face, a_link: the_link() })
    // A link waits for her first face; once she has one, the start opens it, once.
    if (faces.length > 0) set_the_link(undefined)
    for (const one of start.asks) asks(one)
    set_way(start.way)
  }
  const goes = (where: ui_value.where_it_goes): void => {
    if (where.goes === 'to_the_start') {
      void starts()
      return
    }
    set_way((now) => (now === undefined ? now : ui.the_way_after(now, where, now)))
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
    document_of: (frame) => props.documents(frame),
  }
  // The strip over every screen (UI-5), read again at each change of her node: no network, else the relay that did not answer.
  const [the_strip] = createResource(changes, async () =>
    ui.the_strip({
      relay: (await props.node.the_relay()).met,
      network: await props.node.the_network(),
    }),
  )
  onMount(() => {
    set_the_link(props.a_link)
    onCleanup(props.node.when_it_changes(changed))
    void starts()
  })
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
        return <TheServer texts={props.texts.the_server} />
    }
  }
  return (
    <TheAppContext.Provider value={app}>
      <main>
        <Switch>
          <Match when={the_strip()?.strip === 'no_network'}>
            <p role="status">{props.texts.common.no_network}</p>
          </Match>
          <Match when={the_strip()?.strip === 'the_relay_does_not_answer'}>
            <p role="status">{props.texts.common.the_relay_does_not_answer}</p>
          </Match>
        </Switch>
        <Show
          when={does_not_open()}
          fallback={
            <Show when={way()} fallback={<p role="status">{props.texts.common.opening}</p>}>
              {(the_way) => (
                <For each={the_way()}>
                  {(screen, index) => {
                    const shown = () => index() === the_way().length - 1
                    return (
                      <TheScreenIsShown.Provider value={shown}>
                        <div hidden={!shown()}>{the_screen(screen)}</div>
                      </TheScreenIsShown.Provider>
                    )
                  }}
                </For>
              )}
            </Show>
          }
        >
          {(why) => (
            <section role="alert">
              <h1>{props.texts.common.it_does_not_start}</h1>
              <Show when={why().why === 'the_data_of_an_older_test_release'}>
                <p>{props.texts.common.the_data_of_an_older_test_release}</p>
                <Show when={props.clears_the_data_and_starts_again}>
                  {(clears) => (
                    <button
                      type="button"
                      onClick={() => {
                        clears()()
                      }}
                    >
                      {props.texts.common.clear_the_data_and_start_again}
                    </button>
                  )}
                </Show>
              </Show>
              <h2>{props.texts.common.why}</h2>
              <pre>{why().message}</pre>
            </section>
          )}
        </Show>
        <Show when={went_wrong()}>
          <p role="alert">{props.texts.common.something_went_wrong}</p>
        </Show>
      </main>
    </TheAppContext.Provider>
  )
}
