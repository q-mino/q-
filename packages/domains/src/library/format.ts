import * as z from 'zod'

// Formats (DOM-24): branded values with no word of a domain. A format's brand
// is its name: no domain path is a bare name, so it meets no domain's brand.
// Beside them, the library's own values that every area reads: a version
// (`semver`, DOM-22), a cursor (DOM-20, SC-22) and a position (DOM-17).

/**
 * An instant, ISO 8601, written in the time zone of its writer, with its
 * offset (`2026-11-02T23:30:00-05:00`): the wall clock of the node that wrote
 * it, so that its day is a property of the record (`day_of`), the same for
 * every reader, every peer and every version (SC-12, C, 17 Nov 2026). Two
 * instants compare by their value, never as text: two offsets, and the hour
 * that repeats in autumn, tell one moment in two ways.
 */
export const date_time = z.iso.datetime({ offset: true }).brand<'date_time'>()

export type date_time = z.output<typeof date_time>

/** A calendar day, `YYYY-MM-DD`. */
export const day = z.iso.date().brand<'day'>()

export type day = z.output<typeof day>

/** Whether the runtime knows a zone by this name (`Intl`, the IANA database it ships). */
const is_a_zone = (name: string): boolean => {
  try {
    return new Intl.DateTimeFormat('en-US', { timeZone: name }).resolvedOptions().timeZone !== ''
  } catch {
    return false
  }
}

/**
 * A time zone, by its IANA name (`America/Toronto`), with its rules: the
 * calendar of a node, by which its days start and end. An offset is not a
 * zone: in Toronto a loan taken on 20 October at `-04:00` is due on 3
 * November at `-05:00`. The library checks the name against the zones of its
 * runtime.
 */
export const time_zone = z
  .string()
  .min(1)
  .refine((name) => is_a_zone(name), 'not a time zone of this runtime')
  .brand<'time_zone'>()

export type time_zone = z.output<typeof time_zone>

/**
 * The calendar day of an instant, the day of its writing: pure over the
 * instant alone, its date as its writer told it, so that a translation
 * between versions (`earlier`) can use it and never changes once published,
 * whatever the domain's `dsl` or the node's zone becomes (DOM-22). Marta took
 * the drill at 23:30 on 2 November in Toronto (`-05:00`): the 2nd, though it
 * was already the 3rd in UTC.
 */
export const day_of = (instant: date_time): day => day.parse(instant.slice(0, 10))

// From a day to an instant, and an instant told in a zone (SC-12): over the
// zones of the runtime (`Intl`), the only place the library reads a zone's
// rules. An instant is a number of milliseconds here, a wall clock the same
// number read as if in UTC.

const a_minute = 60_000

const a_day = 86_400_000

/** The wall clock of each instant in a zone, to the second. */
const wall_clock = (zone: time_zone): ((instant: number) => number) => {
  const format = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  return (instant) => {
    const parts = format.formatToParts(instant)
    const part = (type: Intl.DateTimeFormatPartTypes): number =>
      Number(parts.find((each) => each.type === type)?.value)
    return Date.UTC(
      part('year'),
      part('month') - 1,
      part('day'),
      part('hour'),
      part('minute'),
      part('second'),
    )
  }
}

/** The offset of a zone at each instant: its wall clock less the instant, in whole minutes. */
const offset_in = (zone: time_zone): ((instant: number) => number) => {
  const wall = wall_clock(zone)
  return (instant) => {
    const second = instant - (((instant % 1000) + 1000) % 1000)
    return Math.round((wall(second) - second) / a_minute) * a_minute
  }
}

/** An instant told with an offset: its wall clock there, to the millisecond if it has one, and the offset. */
const told = (instant: number, offset: number): date_time => {
  const wall = new Date(instant + offset).toISOString()
  const milliseconds = wall.slice(19, 23) === '.000' ? '' : wall.slice(19, 23)
  const minutes = Math.abs(offset) / a_minute
  const sign = offset < 0 ? '-' : '+'
  const hours = String(Math.floor(minutes / 60)).padStart(2, '0')
  return date_time.parse(
    `${wall.slice(0, 19)}${milliseconds}${sign}${hours}:${String(minutes % 60).padStart(2, '0')}`,
  )
}

/** The midnight of a day, read as if in UTC: the wall clock a day starts at. */
const midnight = (the_day: day): number =>
  Date.UTC(
    Number(the_day.slice(0, 4)),
    Number(the_day.slice(5, 7)) - 1,
    Number(the_day.slice(8, 10)),
  )

/**
 * The first instant of a day in a zone: the instant its wall clock reads the
 * day's midnight, the earlier of two in an hour that repeats; where the
 * midnight does not exist (Santiago moves from 00:00 to 01:00 on the first
 * Sunday of September), the instant the clock jumps into the day.
 */
const first_instant = (zone: time_zone, the_day: day): number => {
  const offset = offset_in(zone)
  const wall = midnight(the_day)
  const before = offset(wall - a_day)
  const after = offset(wall + a_day)
  const exact = [wall - before, wall - after].filter(
    (instant) => instant + offset(instant) === wall,
  )
  return exact.length > 0 ? Math.min(...exact) : jump(offset, wall - after, wall - before)
}

/**
 * The instant a zone's offset changes, between one before it and one at or
 * after it: the first millisecond whose offset is not the earlier's.
 */
const jump = (offset: (instant: number) => number, from: number, to: number): number => {
  const earlier = offset(from)
  const search = (low: number, high: number): number => {
    const middle = Math.floor((low + high) / 2)
    return high - low <= 1
      ? high
      : offset(middle) === earlier
        ? search(middle, high)
        : search(low, middle)
  }
  return search(from, to)
}

/** The day after a day, on the calendar, in no zone. */
const the_day_after = (the_day: day): day =>
  day.parse(new Date(midnight(the_day) + a_day).toISOString().slice(0, 10))

/**
 * The first instant of a day in a zone, told in its offset that day: when a
 * wait for a day may go (`not_before`). From a day to an instant only with a
 * zone and its rules, so only where the context gives it (a creator, a leaf
 * of a past major), never in a translation of a fact, whose payload has none
 * (DOM-22). A, 17 Nov 2026 (SC-12): a body of the library, over the zones of
 * its runtime.
 */
export const start_of =
  (zone: time_zone) =>
  (the_day: day): date_time => {
    const instant = first_instant(zone, the_day)
    return told(instant, offset_in(zone)(instant))
  }

/**
 * The last instant of a day in a zone, told in its offset that day: a
 * deadline "by the end of the day" told as an instant (`2026-11-16T23:59:59.999-05:00`).
 * Only where the context gives the zone, as `start_of`.
 */
export const end_of =
  (zone: time_zone) =>
  (the_day: day): date_time => {
    const instant = first_instant(zone, the_day_after(the_day)) - 1
    return told(instant, offset_in(zone)(instant))
  }

/**
 * An instant told in a zone: the same moment, in the offset the zone has at
 * it. The library tells the context's `now` in the context's zone at every
 * port, whatever offset the entry or the clock gave (SC-12).
 */
export const in_zone =
  (zone: time_zone) =>
  (instant: date_time): date_time => {
    const moment = Date.parse(instant)
    return told(moment, offset_in(zone)(moment))
  }

/** A version of a domain, semver: major, minor, patch. */
export const semver = z.templateLiteral([z.number(), '.', z.number(), '.', z.number()])

export type Semver = z.output<typeof semver>

/**
 * The cursor of a process with a cursor (DOM-20, D112.1): the order key of
 * the last instance handled, the values of the selection's order fields and
 * its identity (D109), encoded by the library (D114). Opaque to the business,
 * ordered and comparable: the library writes it in the step's own mutation,
 * the author only declares where the process keeps it. The default: a
 * business that must read it declares its own, the order key's fields, which
 * the library derives from the order, checks by type and writes the same way
 * (A, 16 Nov 2026), with its case. The same cursor closes a page of a
 * query (SC-22): the order key of its last entry, from which the next page
 * starts; carried by the persona and the client, never read by them (D57).
 */
export const cursor = z.string().min(1).brand<'cursor'>()

export type cursor = z.output<typeof cursor>

/** The position of a read: opaque, compared only by order (DOM-17). */
export const position = z.string().min(1).brand<'position'>()

export type position = z.output<typeof position>
