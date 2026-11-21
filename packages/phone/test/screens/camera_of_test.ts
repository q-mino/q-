// A camera of test (WEB-2): on when a screen scans, the QRs' texts shown to
// it by the story, each given to the scan that is on; turned off, its texts
// end and what it is shown then is seen by no one. Every wait is the
// story's: nothing here loops.

import type { AScan } from '@q-mino/adapters-web'
import type { TheDevice } from '@q-mino/adapters-web/screens'

/** A camera of test, and the story's hand on it. */
export interface ACameraOfTest {
  readonly scans: TheDevice['scans']
  /** The camera is shown a QR: its text is given to the scan that is on, to none when it is off. */
  readonly shows: (text: string) => void
  /** Whether a scan is on now. */
  readonly is_on: () => boolean
  /** How many times it was turned on. */
  readonly turned_on: () => number
}

/** A scan on: its texts, given one at a time as they are shown, until it is turned off. */
interface AScanOn {
  readonly gives: (text: string) => void
  readonly is_off: () => boolean
  readonly scan: Extract<AScan, { is: 'on' }>
}

const a_scan_on = (): AScanOn => {
  let shown: readonly string[] = []
  let waiting: ((next: IteratorResult<string, undefined>) => void) | undefined
  let off = false
  const the_end: IteratorResult<string, undefined> = { done: true, value: undefined }
  const turn_off = (): void => {
    off = true
    shown = []
    waiting?.(the_end)
    waiting = undefined
  }
  const gives = (text: string): void => {
    if (off) return
    if (waiting === undefined) {
      shown = [...shown, text]
      return
    }
    const resolve = waiting
    waiting = undefined
    resolve({ done: false, value: text })
  }
  const next = (): Promise<IteratorResult<string, undefined>> => {
    if (off) return Promise.resolve(the_end)
    const [first, ...rest] = shown
    if (first !== undefined) {
      shown = rest
      return Promise.resolve({ done: false, value: first })
    }
    return new Promise((resolve) => {
      waiting = resolve
    })
  }
  const texts: AsyncIterable<string, undefined> = {
    [Symbol.asyncIterator]: () => ({
      next,
      return: () => {
        turn_off()
        return Promise.resolve(the_end)
      },
    }),
  }
  return { gives, is_off: () => off, scan: { is: 'on', texts, turn_off } }
}

export const a_camera_of_test = (): ACameraOfTest => {
  let scans: readonly AScanOn[] = []
  const the_one_on = (): AScanOn | undefined => scans.find((one) => !one.is_off())
  return {
    scans: () => {
      const scan = a_scan_on()
      scans = [...scans, scan]
      return Promise.resolve(scan.scan)
    },
    shows: (text) => {
      the_one_on()?.gives(text)
    },
    is_on: () => the_one_on() !== undefined,
    turned_on: () => scans.length,
  }
}

/** A camera the browser refuses. */
export const a_camera_refused: TheDevice['scans'] = () => Promise.resolve({ is: 'refused' })
