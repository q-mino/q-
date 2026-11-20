// The camera (WEB-2; ADP-2): the rear camera opened for a scan, the browser's
// refusals turned into outcomes, and the texts of the QRs it sees. The
// browser's objects are the configurator's to give (`navigator.mediaDevices`,
// the page's `<video>`), so that nothing here reaches for a global.

import type * as zz from '@q-mino/domains/library'
import { the_texts_seen, type ALook } from '../qr/index.ts'

/** Why the camera is not on: the user or the browser refused it, the device has none, or something else holds it. */
export type NotOn = 'refused' | 'missing' | 'busy'

/** The camera opened, with its stream, or why not. */
export type AnOpenedCamera =
  { readonly is: 'open'; readonly stream: MediaStream } | { readonly is: NotOn }

/** A camera scanning: the texts it sees until it is turned off, or why it is not on. */
export type AScan =
  | { readonly is: 'on'; readonly texts: AsyncIterable<string>; readonly turn_off: () => void }
  | { readonly is: NotOn }

/**
 * What the browser asks for: the camera facing away from the user where
 * there is one (`ideal`, so that a laptop's only camera still opens), video
 * only, wide enough for a QR of a ticket across the frame.
 */
export const the_rear_camera_s_constraints: MediaStreamConstraints = {
  audio: false,
  video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
}

/**
 * Why `getUserMedia` refused, by the name of its error: `NotAllowedError`
 * and `SecurityError`, refused (by the user, or a page that is no secure
 * context); `NotFoundError` and `OverconstrainedError`, missing; any other
 * (`NotReadableError`: another app holds it; `AbortError`), busy.
 */
export const why_not_on = (error: unknown): NotOn => {
  const name = error instanceof Error || error instanceof DOMException ? error.name : ''
  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'refused'
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'missing'
    default:
      return 'busy'
  }
}

/** The rear camera opened, or why not: the browser asks the user the first time. */
export const open_the_rear_camera = async (
  media_devices: Pick<MediaDevices, 'getUserMedia'>,
): Promise<AnOpenedCamera> => {
  try {
    return { is: 'open', stream: await media_devices.getUserMedia(the_rear_camera_s_constraints) }
  } catch (error) {
    return { is: why_not_on(error) }
  }
}

/**
 * A look through a video playing a stream: its frame drawn on a canvas of
 * its size and read back in RGBA; nothing yet while the video has no frame,
 * nothing more once it is turned off.
 */
const looks_through = (video: HTMLVideoElement, is_off: () => boolean): (() => ALook) => {
  const canvas = video.ownerDocument.createElement('canvas')
  const context = canvas.getContext('2d', { willReadFrequently: true })
  return () => {
    if (is_off() || context === null) return { sees: 'nothing_more' }
    if (video.videoWidth === 0 || video.videoHeight === 0) return { sees: 'nothing_yet' }
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    return { sees: 'a_frame', frame: context.getImageData(0, 0, canvas.width, canvas.height) }
  }
}

/**
 * Scan with the rear camera: the stream played in the page's video (muted,
 * inline), the texts of the QRs it sees, a look every so often by the time
 * that passes; turned off, its tracks stop, the video lets it go, the texts
 * end.
 */
export const scan_with_the_rear_camera = async (browser: {
  readonly media_devices: Pick<MediaDevices, 'getUserMedia'>
  readonly video: HTMLVideoElement
  readonly elapsed: zz.Elapsed
}): Promise<AScan> => {
  const opened = await open_the_rear_camera(browser.media_devices)
  if (opened.is !== 'open') return { is: opened.is }
  let off = false
  const turn_off = () => {
    off = true
    for (const track of opened.stream.getTracks()) track.stop()
    browser.video.srcObject = null
  }
  browser.video.muted = true
  browser.video.playsInline = true
  browser.video.srcObject = opened.stream
  try {
    await browser.video.play()
  } catch (error) {
    turn_off()
    return { is: why_not_on(error) }
  }
  return {
    is: 'on',
    texts: the_texts_seen(
      looks_through(browser.video, () => off),
      browser.elapsed,
    ),
    turn_off,
  }
}
