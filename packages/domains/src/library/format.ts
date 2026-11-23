import * as z from 'zod'

// Formats (DOM-24): branded values with no word of a domain. A format's brand
// is its name: no domain path is a bare name, so it meets no domain's brand.
// Beside them, the library's own values that every area reads: a version
// (`semver`, DOM-22), a cursor (DOM-20, SC-22) and a position (DOM-17).

/**
 * An instant, ISO 8601 in UTC, with milliseconds (`2026-11-03T04:30:00.000Z`):
 * as a clock gives it (`new Date().toISOString()`), one text for one moment,
 * so that two instants order as text as they do in time (LIB-9 needs no rule
 * of its own) and an instant tells no zone of its writer. A, 23 Nov 2026
 * (reopening SC-12 of C, 17 Nov 2026): the zone is data where the business
 * needs it (`RootContext.time_zone`), never a format's hidden part; a day
 * that matters is decided with it (`day_of(zone)`) and carried as a day.
 */
export const date_time = z.iso.datetime({ precision: 3 }).brand<'date_time'>()

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

// From an instant to its day and from a day to its instants, in a zone
// (SC-12): over the zones of the runtime (`Intl`), the only place the library
// reads a zone's rules. An instant is a number of milliseconds here, a wall
// clock the same number read as if in UTC.

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

/**
 * The calendar day of an instant in a zone (A, 23 Nov 2026): Marta took the
 * drill at `2026-11-03T04:30:00.000Z`, 23:30 on 2 November in Toronto, the
 * 2nd there, already the 3rd in UTC. Only where a context gives the zone (a
 * creator, a leaf of a past major), never in a translation of a fact, whose
 * payload has none: a day that matters there is a field of the fact, which
 * its command decided (SC-12).
 */
export const day_of =
  (zone: time_zone) =>
  (instant: date_time): day =>
    day.parse(new Date(wall_clock(zone)(Date.parse(instant))).toISOString().slice(0, 10))

/** The offset of a zone at each instant: its wall clock less the instant, in whole minutes. */
const offset_in = (zone: time_zone): ((instant: number) => number) => {
  const wall = wall_clock(zone)
  return (instant) => {
    const second = instant - (((instant % 1000) + 1000) % 1000)
    return Math.round((wall(second) - second) / a_minute) * a_minute
  }
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

/** An instant, as a clock writes it. */
const instant_of = (moment: number): date_time => date_time.parse(new Date(moment).toISOString())

/**
 * The first instant of a day in a zone: when a wait for a day may go
 * (`not_before`). From a day to an instant only with a zone and its rules, so
 * only where the context gives it (a creator, a leaf of a past major), never
 * in a translation of a fact, whose payload has none (DOM-22). A, 17 Nov 2026
 * (SC-12): a body of the library, over the zones of its runtime.
 */
export const start_of =
  (zone: time_zone) =>
  (the_day: day): date_time =>
    instant_of(first_instant(zone, the_day))

/**
 * The last instant of a day in a zone: a deadline "by the end of the day"
 * told as an instant (the 16th in Toronto, `2026-11-17T04:59:59.999Z`). Only
 * where the context gives the zone, as `start_of`.
 */
export const end_of =
  (zone: time_zone) =>
  (the_day: day): date_time =>
    instant_of(first_instant(zone, the_day_after(the_day)) - 1)

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
