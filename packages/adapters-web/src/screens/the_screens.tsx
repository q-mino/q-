// The screens of the phone, rendered (UI-1, V2, ADP-7): the way she opened
// them, each kept while it is open (only the last shown); the start read
// from her node (her faces, the face she acts as, a link she opened); what
// a turn asks handed to her node in the order asked, and where it goes on
// the way; her node's changes counted, so that each screen reads it again.

import * as ui from '@q-mino/domains/ui/_dsl.ts'
import type * as ui_value from '@q-mino/domains/ui/_value.ts'
import { createSignal, For, onCleanup, onMount, Show, type JSX } from 'solid-js'
import type { HerNode } from '../her_node/index.ts'
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
}

export const TheScreens = (props: TheScreensWiring) => {
  const [way, set_way] = createSignal<ui_value.the_way | undefined>(undefined)
  const [changes, set_changes] = createSignal(0)
  const [went_wrong, set_went_wrong] = createSignal(false)
  const [the_link, set_the_link] = createSignal<ui_value.what_it_holds | undefined>(undefined)
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
    const [faces, the_active_face] = await Promise.all([
      props.node.her_faces(),
      props.node.the_active_face(),
    ])
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
    }
  }
  return (
    <TheAppContext.Provider value={app}>
      <main>
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
        <Show when={went_wrong()}>
          <p role="alert">{props.texts.common.something_went_wrong}</p>
        </Show>
      </main>
    </TheAppContext.Provider>
  )
}
