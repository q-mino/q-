import {
  scan_with_a_camera,
  the_camera,
  the_device_s_clock,
  the_device_s_zone,
  the_ticket_in_a_link,
  the_time_that_passes,
  ids_drawn_at_random,
  type ALinksTicket,
} from '@q-mino/adapters-web'
import { TheScreens } from '@q-mino/adapters-web/screens'
import * as ui_value from '@q-mino/domains/ui/_value.ts'
import ping_pong_manifest from '@q-mino/ping_pong/manifest.json' with { type: 'json' }
import { render } from 'solid-js/web'
import { realms } from 'virtual:q-realms'
import { App } from './App.tsx'
import {
  the_data_cleared,
  the_start,
  type AnExtensionCarried,
  type TheBrowser,
  type TheConfiguration,
} from './node/index.ts'
import { texts } from './texts/index.ts'

// The PWA's main (CFG-1; step 25, PWA-1..PWA-5): the browser's objects,
// given (WEB-5), the release's configuration, the extensions it carries
// (ping pong, preinstalled and off, PNG-1: its manifest as its build wrote
// it, its realm as the phone's build bundled it), the device, the link the
// page was opened with (WEB-1), and the app.

/** An extension carried: its manifest, and its realm's script, which the build made (PWA-3). */
const carried = (name: string, manifest: unknown): AnExtensionCarried => {
  const script = realms[name]
  if (script === undefined) throw new Error(`the build made no realm for ${name}`)
  return { manifest, script }
}

/** The link's ticket in `ui`'s words (WEB-1, UI-1): one whose ticket `user` would not take is out of its form. */
const the_link_of = (link: ALinksTicket): ui_value.what_it_holds | undefined => {
  switch (link.carries) {
    case 'no_ticket':
      return undefined
    case 'a_ticket_out_of_its_form':
      return { holds: 'a_ticket_out_of_its_form' }
    case 'a_ticket': {
      const held = ui_value.what_it_holds.safeParse({ holds: 'a_ticket', ticket: link.ticket })
      return held.success ? held.data : { holds: 'a_ticket_out_of_its_form' }
    }
  }
}

const root = document.getElementById('root')
if (root === null) throw new Error('missing #root')
const clock = the_device_s_clock(the_device_s_zone())
const page = new URL(import.meta.env.BASE_URL, location.origin).href
const browser: TheBrowser = {
  indexed_db: indexedDB,
  key_range: IDBKeyRange,
  locks: navigator.locks,
  storage: navigator.storage,
  fetch: (address, request) => fetch(address, request),
  crypto,
  document,
  network: { navigator, window },
}
const configuration: TheConfiguration = {
  name: 'cumino',
  relay: __Q_RELAY__,
  page,
  extensions: [carried('ping_pong', ping_pong_manifest)],
  characters: 1_000_000,
}
const starts = the_start(browser, configuration, { clock, elapsed: the_time_that_passes })
/** The device's camera, one at a time: the one opened before is turned off before the next opens (WEB-2). */
const camera = the_camera(navigator.mediaDevices)
const a_link = the_link_of(the_ticket_in_a_link(location.href))
/** The link she opened the app with, given to the screens only when there is one. */
const with_the_link = a_link === undefined ? {} : { a_link }

render(
  () => (
    <App
      starts={starts}
      reopens={() => {
        location.reload()
      }}
      // The data of an older test release (WEB-8): the node's database deleted.
      clears_the_data={the_data_cleared(browser, configuration)}
      screens={(node, clears_the_data_and_starts_again) => (
        <TheScreens
          node={node.her}
          device={{
            draws_an_id: ids_drawn_at_random(crypto),
            clock,
            scans: (video, facing) =>
              scan_with_a_camera({ camera, facing, video, elapsed: the_time_that_passes }),
            // The page's navigator, its share and its clipboard, as it is (WEB-5, WEB-18).
            the_navigator: navigator,
          }}
          texts={texts.screens}
          {...with_the_link}
          // Her gesture on the data of an older test release, on the test channel only (WEB-8).
          {...(clears_the_data_and_starts_again === undefined
            ? {}
            : { clears_the_data_and_starts_again })}
          // Ping pong shows no frame in stage 1 (no slot, no page): an
          // extension's documents, and their scripts' hashes in the app's
          // policy, come with the first that has one (PWA-4).
          documents={() => undefined}
        />
      )}
    />
  ),
  root,
)
