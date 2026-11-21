import * as zz from '@q-mino/domains/library'
import { ping_pong } from '@q-mino/ping_pong'
import { a_realm_in_this_frame } from './in_this_frame.ts'

// Ping pong's realm (PNG-1, EXT-13, PWA-3): its configurator, with the
// frame's own clock and time (the device's, as WEB-4 reads them, written
// here so that the realm's bundle holds the extension and its library only),
// wired to the frame's window. The phone's build bundles it into one inline
// script, whose hash the app's policy names (PWA-4).

const time_zone = zz.time_zone.parse(new Intl.DateTimeFormat().resolvedOptions().timeZone)

a_realm_in_this_frame(window, (send) =>
  ping_pong({
    clock: {
      now: () => zz.in_zone(time_zone)(zz.date_time.parse(new Date().toISOString())),
      time_zone,
    },
    elapsed: (milliseconds) =>
      new Promise((resolve) => {
        setTimeout(resolve, milliseconds)
      }),
    send,
  }),
)
