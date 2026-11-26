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
import messaging_manifest from '@q-mino/messaging/manifest.json' with { type: 'json' }
import ping_pong_manifest from '@q-mino/ping_pong/manifest.json' with { type: 'json' }
import { render } from 'preact'
import { App } from './App.tsx'
import { the_build } from './build_info.ts'
import { the_project_s_relay, the_public_configuration_at } from './the_project.ts'
import {
  the_data_cleared,
  the_import_of_an_extension,
  the_start,
  type AnExtensionCarried,
  type TheBrowser,
  type TheConfiguration,
} from './node/index.ts'
import { texts } from './texts/index.ts'

// The PWA's main (CFG-1; step 25, PWA-1..PWA-5): the browser's objects,
// given (WEB-5), the release's configuration, the extensions it carries
// (ping pong and messaging, preinstalled and off, PNG-1, MSG-10: each
// manifest as its build wrote it, each configurator integrated, EXT-13),
// the device, the link the page was opened with (WEB-1), and the app.

/** An extension's configurator imported, tried again after a pause when the network refuses it (PWA-3). */
const imported = the_import_of_an_extension(the_time_that_passes)

/**
 * Ping pong, carried (EXT-9, EXT-13): its manifest, composed at the start;
 * its configurator imported only when the kernel loads it, at its
 * activation or at a start where it is active, so that off its files are
 * not loaded (A, 24 Nov 2026). Its realm's clock and time are the kernel's.
 */
const ping_pong: AnExtensionCarried = {
  manifest: ping_pong_manifest,
  realm: async (host) => (await imported(() => import('@q-mino/ping_pong'))).ping_pong(host),
}

/**
 * Messaging, carried as ping pong is (MSG-10; part M3): preinstalled and
 * off, its manifest composed at the start, its configurator imported only
 * when the kernel loads it.
 */
const messaging: AnExtensionCarried = {
  manifest: messaging_manifest,
  realm: async (host) => (await imported(() => import('@q-mino/messaging'))).messaging(host),
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
const page = new URL(the_build.base, location.origin).href
const browser: TheBrowser = {
  indexed_db: indexedDB,
  key_range: IDBKeyRange,
  locks: navigator.locks,
  storage: navigator.storage,
  fetch: (address, request) => fetch(address, request),
  crypto,
  network: { navigator, window },
}
const configuration: TheConfiguration = {
  name: 'cumino',
  relay: the_build.relay,
  page,
  extensions: [ping_pong, messaging],
  characters: 1_000_000,
}
const starts = the_start(browser, configuration, { clock, elapsed: the_time_that_passes })
/** The device's camera, one at a time: the one opened before is turned off before the next opens (WEB-2). */
const camera = the_camera(navigator.mediaDevices)
const a_link = the_link_of(the_ticket_in_a_link(location.href))
/** The link she opened the app with, given to the screens only when there is one. */
const with_the_link = a_link === undefined ? {} : { a_link }
/** The relay's public configuration, at this release's commit, for the project's relay only (REL-8). */
const with_the_public_configuration =
  the_build.relay === the_project_s_relay
    ? { the_relay_s_public_configuration: the_public_configuration_at(the_build.commit) }
    : {}

render(
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
        // The page's session history, where the way is written (WEB-25): `window`, as it is (WEB-5).
        the_history={window}
        // A link followed while the app is open, read as the one it opened with (WEB-1, WEB-25).
        the_link_in={(address) => the_link_of(the_ticket_in_a_link(address))}
        {...with_the_link}
        {...with_the_public_configuration}
        // Her gesture on the data of an older test release, on the test channel only (WEB-8).
        {...(clears_the_data_and_starts_again === undefined
          ? {}
          : { clears_the_data_and_starts_again })}
      />
    )}
  />,
  root,
)
