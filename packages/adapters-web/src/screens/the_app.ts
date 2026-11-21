// What every screen is given by the rendering (UI-1, UI-3, ADP-7, WEB-4,
// WEB-5): her node, the device's sources (an id, the time, the camera), the
// count of her node's changes, which the screens follow to read it again,
// and the two hands of a turn: what it asks, handed to `user` in order, and
// where it goes, on the way.

import type * as zz from '@q-mino/domains/library'
import * as ui_value from '@q-mino/domains/ui/_value.ts'
import type * as activities_value from '@q-mino/domains/user/activities/_value.ts'
import { createContext, useContext, type Accessor } from 'solid-js'
import type { AScan } from '../camera/index.ts'
import type { HerNode } from '../her_node/index.ts'

/** The device's sources the screens draw from at a gesture (WEB-4, WEB-5), given by the composition root as they are. */
export interface TheDevice {
  /** An id named before the first attempt (DOM-12): an activity's, a face's, a bond's to be (`ids_drawn_at_random`). */
  readonly draws_an_id: () => string
  /** The device's clock (`the_device_s_clock`). */
  readonly clock: zz.Clock
  /** The rear camera, played in the screen's video, its QRs' texts read (`scan_with_the_rear_camera`, WEB-2). */
  readonly scans: (video: HTMLVideoElement) => Promise<AScan>
}

/** The words every screen shares (provisional, A to confirm: the words she reads, UI-5). */
export interface TheCommonTexts {
  /** The gesture back. */
  readonly back: string
  /** While the app reads her node at its start. */
  readonly opening: string
  /** What a screen asked, in progress. */
  readonly in_progress: string
  /** How an activity ended, by its case (USR-3). */
  readonly how_it_ended: Readonly<Record<activities_value.how_it_ended['ended'], string>>
  /** Why an extension cannot be reached (USR-3). */
  readonly cannot_be_reached: Readonly<
    Record<
      Extract<
        activities_value.how_it_ended,
        { ended: 'the_extension_cannot_be_reached' }
      >['because'],
      string
    >
  >
  /** What a kernel's leaf said, by its event (USR-3), told after how it ended; an event with no words here is told by how it ended alone. */
  readonly the_kernels_events: (event: string) => string | undefined
  /** A gesture handed to her node that did not reach it (a fault of the app's, never hers). */
  readonly something_went_wrong: string
  /** The kernel's mark of an extension: its name (EXT-16). */
  readonly the_mark_of: (extension: string) => string
}

/** What every screen is given by the rendering. */
export interface TheApp {
  readonly node: HerNode
  readonly device: TheDevice
  readonly common: TheCommonTexts
  /** How many times her node changed since the app opened: a screen reads it again at each. */
  readonly changes: Accessor<number>
  /** What a turn asks (UI-3), handed to her node in the order asked. */
  readonly asks: (what: ui_value.what_it_asks) => void
  /** Where a turn goes (UI-1), on the way. */
  readonly goes: (where: ui_value.where_it_goes) => void
}

/** What a screen asked, drawn now: a new activity's id and the time (UI-3, WEB-4). */
export const what_it_asked_now = (device: TheDevice): ui_value.what_it_asked =>
  ui_value.what_it_asked.parse({ activity_id: device.draws_an_id(), at: device.clock.now() })

/** How an activity ended, in her words: its case, then what the kernel's leaf said when it has words for it. */
export const the_words_of_an_end = (
  common: TheCommonTexts,
  how: activities_value.how_it_ended,
): string => {
  const ended = common.how_it_ended[how.ended]
  if (how.ended === 'the_extension_cannot_be_reached')
    return `${ended}: ${common.cannot_be_reached[how.because]}`
  if (how.ended === 'no_longer_followed') return ended
  const said = common.the_kernels_events(how.said.event)
  return said === undefined ? ended : `${ended}: ${said}`
}

/** The app, given by the root to every screen (Solid's context: static wiring, read once at a screen's setup). */
export const TheAppContext = createContext<TheApp>()

/** The app the root gave this screen. */
export const the_app = (): TheApp => {
  const app = useContext(TheAppContext)
  if (app === undefined) throw new Error('a screen outside the screens')
  return app
}
