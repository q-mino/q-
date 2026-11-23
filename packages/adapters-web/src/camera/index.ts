// The camera (WEB-2; ADP-2): a camera opened for a scan, facing the user or
// away from her, one at a time; the browser's refusals turned into outcomes;
// the device's cameras counted once one is open; and the texts of the QRs it
// sees. The browser's objects are the configurator's to give
// (`navigator.mediaDevices`, the page's `<video>`), so that nothing here
// reaches for a global.

import type * as zz from '@q-mino/domains/library'
import { the_texts_seen, type ALook } from '../qr/index.ts'

/** Why the camera is not on: the user or the browser refused it, the device has none, or something else holds it. */
export type NotOn = 'refused' | 'missing' | 'busy'

/**
 * Where the camera faces, in the browser's words (`facingMode`): the user
 * (the front camera, on the screen's side) or her surroundings (the rear
 * camera).
 */
export type AFacing = 'user' | 'environment'

/**
 * How many cameras the device has, by its video inputs, counted once one is
 * open (before, the browser may tell fewer): one, or more than one (another
 * to turn to). A browser that does not tell counts as one.
 */
export type TheCameras = 'one' | 'more_than_one'

/** The parts of a stream the camera uses: its tracks, stopped when it is turned off. */
export interface AStream {
  readonly getTracks: () => readonly { readonly stop: () => void }[]
}

/** The parts of `navigator.mediaDevices` the camera uses (WEB-5): a stream asked for, the devices listed. */
export interface TheMediaDevices<S extends AStream> {
  readonly getUserMedia: (constraints: MediaStreamConstraints) => Promise<S>
  readonly enumerateDevices: () => Promise<readonly { readonly kind: string }[]>
}

/** A camera opened, with its stream and the device's cameras, until it is turned off; or why not. */
export type AnOpenedCamera<S extends AStream> =
  | {
      readonly is: 'open'
      readonly stream: S
      readonly cameras: TheCameras
      /** Its tracks stop; once only. */
      readonly turn_off: () => void
      readonly is_off: () => boolean
    }
  | { readonly is: NotOn }

/** The device's camera: a camera opened facing where it is asked, the one opened before turned off first. */
export type TheCamera<S extends AStream> = (facing: AFacing) => Promise<AnOpenedCamera<S>>

/** A camera scanning: the texts it sees until it is turned off, the device's cameras; or why it is not on. */
export type AScan =
  | {
      readonly is: 'on'
      readonly texts: AsyncIterable<string>
      readonly cameras: TheCameras
      readonly turn_off: () => void
    }
  | { readonly is: NotOn }

/**
 * What the browser asks for: the camera facing where it is asked, where
 * there is one (`ideal`, so that a device with one camera, a laptop's or a
 * phone's that faces only one way, still opens the one it has), video only,
 * wide enough for a QR of a ticket across the frame.
 */
export const the_constraints_of = (facing: AFacing): MediaStreamConstraints => ({
  audio: false,
  video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } },
})

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

/** The device's cameras, by its video inputs; one when the browser does not tell. */
const the_cameras_of = async <S extends AStream>(
  media_devices: TheMediaDevices<S>,
): Promise<TheCameras> => {
  try {
    const devices = await media_devices.enumerateDevices()
    return devices.filter((device) => device.kind === 'videoinput').length > 1
      ? 'more_than_one'
      : 'one'
  } catch {
    return 'one'
  }
}

/** A camera opened facing where it is asked, or why not: the browser asks the user the first time. */
export const open_a_camera = async <S extends AStream>(
  media_devices: TheMediaDevices<S>,
  facing: AFacing,
): Promise<AnOpenedCamera<S>> => {
  const opened = await media_devices.getUserMedia(the_constraints_of(facing)).then(
    (stream) => ({ is: 'open' as const, stream }),
    (error: unknown) => ({ is: why_not_on(error) }),
  )
  if (opened.is !== 'open') return opened
  let off = false
  return {
    is: 'open',
    stream: opened.stream,
    cameras: await the_cameras_of(media_devices),
    turn_off: () => {
      if (off) return
      off = true
      for (const track of opened.stream.getTracks()) track.stop()
    },
    is_off: () => off,
  }
}

/**
 * The device's camera, one at a time: a camera opened turns off the one
 * opened before (its tracks stopped, once its opening ended) before the
 * browser is asked for the new one, since a phone may refuse a second camera
 * while the first is held.
 */
export const the_camera = <S extends AStream>(media_devices: TheMediaDevices<S>): TheCamera<S> => {
  let the_last: Promise<AnOpenedCamera<S>> | undefined
  return (facing) => {
    const before = the_last
    const opening = (async () => {
      const it = await before
      if (it?.is === 'open') it.turn_off()
      return open_a_camera(media_devices, facing)
    })()
    the_last = opening
    return opening
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
 * Scan with the device's camera, facing where it is asked: the stream played
 * in the page's video (muted, inline), the texts of the QRs it sees, a look
 * every so often by the time that passes. Turned off, or turned off by the
 * camera opened after it, its tracks stop, the texts end; the video lets go
 * of its stream, unless it plays another already.
 */
export const scan_with_a_camera = async (browser: {
  readonly camera: TheCamera<MediaStream>
  readonly facing: AFacing
  readonly video: HTMLVideoElement
  readonly elapsed: zz.Elapsed
}): Promise<AScan> => {
  const opened = await browser.camera(browser.facing)
  if (opened.is !== 'open') return { is: opened.is }
  const turn_off = () => {
    opened.turn_off()
    if (browser.video.srcObject === opened.stream) browser.video.srcObject = null
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
    texts: the_texts_seen(looks_through(browser.video, opened.is_off), browser.elapsed),
    cameras: opened.cameras,
    turn_off,
  }
}
