// What the chat reads of the phone it runs on (part M5): the zone its
// times are told in, the time now (today, yesterday), and whether the
// phone says it has no network, so that a message on its way reads «partirà
// appena possibile». The part runs in the app's page (integrated, EXT-13),
// so the browser's own by default; a story or a test gives its own, so that
// what it draws does not hang on the machine's zone and clock.
// [Q, C, 27 Nov 2026] Rejected: the network and the zone given by the
// kernel to every part (a change of `boundary`'s `WhatAPartIsGiven` for
// what the page already tells an integrated part); the device's zone read
// at each format (the same, a story could not fix it).

/** The phone of the chat: its zone, its clock, its network as the browser tells it. */
export interface ThePhoneOfTheChat {
  /** The IANA zone the times are told in (`Europe/Rome`). */
  readonly zone: () => string
  /** The time now, for today and yesterday. */
  readonly now: () => Date
  /** Whether the phone says it has no network (`navigator.onLine` false); online is only "maybe". */
  readonly offline: () => boolean
  /** Told when the network changes; it returns its end. */
  readonly when_the_network_changes: (listener: () => void) => () => void
}

/** The browser's phone: its zone, its clock, its network events. */
export const the_browser_s_phone: ThePhoneOfTheChat = {
  zone: () => Intl.DateTimeFormat().resolvedOptions().timeZone,
  now: () => new Date(),
  offline: () => !navigator.onLine,
  when_the_network_changes: (listener) => {
    window.addEventListener('online', listener)
    window.addEventListener('offline', listener)
    return () => {
      window.removeEventListener('online', listener)
      window.removeEventListener('offline', listener)
    }
  },
}

/** The day of an instant in a zone, as `YYYY-MM-DD`, to tell today and yesterday apart. */
const the_day_of = (at: Date, zone: string): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(at)

/** How far an instant's day is from today, in days (0 today, 1 yesterday), in a zone. */
export const days_ago = (at: Date, now: Date, zone: string): number => {
  const day = Date.parse(`${the_day_of(at, zone)}T00:00:00Z`)
  const today = Date.parse(`${the_day_of(now, zone)}T00:00:00Z`)
  return Math.round((today - day) / 86_400_000)
}

/** The hour of an instant in a zone, in Italian (`10:00`). */
export const the_hour_of = (at: Date, zone: string): string =>
  new Intl.DateTimeFormat('it-IT', { timeZone: zone, hour: '2-digit', minute: '2-digit' }).format(
    at,
  )

/** The weekday of an instant in a zone, short (`lun`). */
export const the_weekday_of = (at: Date, zone: string): string =>
  new Intl.DateTimeFormat('it-IT', { timeZone: zone, weekday: 'short' }).format(at)

/** The date of an instant in a zone, with its weekday (`giovedì 26 novembre`). */
export const the_date_of = (at: Date, zone: string): string =>
  new Intl.DateTimeFormat('it-IT', {
    timeZone: zone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(at)

/** The date of an instant in a zone, short (`26 nov`). */
export const the_short_date_of = (at: Date, zone: string): string =>
  new Intl.DateTimeFormat('it-IT', { timeZone: zone, day: 'numeric', month: 'short' }).format(at)
