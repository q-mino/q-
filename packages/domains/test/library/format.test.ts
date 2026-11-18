import { describe, expect, test } from 'vitest'
import {
  date_time,
  day,
  day_of,
  end_of,
  in_zone,
  start_of,
  time_zone,
} from '../../src/library/index.ts'

// The formats over the zones (SC-12, C, 17 Nov 2026; part 3.2): a day to an
// instant with a zone and its rules, an instant told in a zone, over the
// zones of the runtime (`Intl`).

const zone = (name: string) => time_zone.parse(name)
const the = (text: string) => day.parse(text)
const at = (text: string) => date_time.parse(text)

const toronto = zone('America/Toronto')
const utc = zone('UTC')

describe('SC-12, the day of an instant', () => {
  // At 23:30 on 2 Nov in Toronto, already 3 Nov in UTC, Marta borrows the
  // drill: it is due on 16 Nov.
  const borrowed = at('2026-11-02T23:30:00-05:00')

  test('an instant is written in its writer zone, and its day is its record', () => {
    expect(day_of(borrowed)).toBe('2026-11-02')
    expect(in_zone(utc)(borrowed)).toBe('2026-11-03T04:30:00+00:00')
  })

  test("the eve's wait at the start of 15 Nov there, the overdue wait at the start of 17 Nov", () => {
    expect(start_of(toronto)(the('2026-11-15'))).toBe('2026-11-15T00:00:00-05:00')
    expect(start_of(toronto)(the('2026-11-17'))).toBe('2026-11-17T00:00:00-05:00')
  })

  test('her phone at 1.4.0 reads 16 Nov, 23:59:59.999 -05:00', () => {
    expect(end_of(toronto)(the('2026-11-16'))).toBe('2026-11-16T23:59:59.999-05:00')
  })

  test("in UTC the eve's wait would have gone at 19:00 on the 15th there, the old phone read 18:59 on the 17th", () => {
    expect(in_zone(toronto)(start_of(utc)(the('2026-11-16')))).toBe('2026-11-15T19:00:00-05:00')
    expect(in_zone(toronto)(end_of(utc)(the('2026-11-17')))).toBe('2026-11-17T18:59:59.999-05:00')
  })

  test('an offset is not a zone: taken on 20 Oct at -04:00, due on 3 Nov at -05:00', () => {
    expect(start_of(toronto)(the('2026-10-20'))).toBe('2026-10-20T00:00:00-04:00')
    expect(end_of(toronto)(the('2026-11-03'))).toBe('2026-11-03T23:59:59.999-05:00')
  })
})

describe('the zones of the runtime', () => {
  test('the day the clocks go back has 25 hours, told in two offsets', () => {
    expect(start_of(toronto)(the('2026-11-01'))).toBe('2026-11-01T00:00:00-04:00')
    expect(end_of(toronto)(the('2026-11-01'))).toBe('2026-11-01T23:59:59.999-05:00')
  })

  test('the hour that repeats: one wall clock, two instants', () => {
    const first = at('2026-11-01T01:30:00-04:00')
    const second = at('2026-11-01T01:30:00-05:00')
    expect(in_zone(toronto)(first)).toBe('2026-11-01T01:30:00-04:00')
    expect(in_zone(toronto)(second)).toBe('2026-11-01T01:30:00-05:00')
    expect(Date.parse(second) - Date.parse(first)).toBe(3_600_000)
  })

  test('a midnight that does not exist: the day starts when the clock jumps into it', () => {
    const santiago = zone('America/Santiago')
    expect(start_of(santiago)(the('2026-09-06'))).toBe('2026-09-06T01:00:00-03:00')
    expect(end_of(santiago)(the('2026-09-05'))).toBe('2026-09-05T23:59:59.999-04:00')
    expect(start_of(zone('America/Havana'))(the('2026-03-08'))).toBe('2026-03-08T01:00:00-04:00')
  })

  test('offsets in half hours, milliseconds kept', () => {
    expect(start_of(zone('Asia/Kolkata'))(the('2026-11-02'))).toBe('2026-11-02T00:00:00+05:30')
    expect(in_zone(zone('Europe/London'))(at('2026-07-01T12:00:00.250Z'))).toBe(
      '2026-07-01T13:00:00.250+01:00',
    )
  })

  test('a zone the runtime does not know is no zone', () => {
    expect(time_zone.safeParse('Mars/Olympus').success).toBe(false)
    expect(time_zone.safeParse('Europe/Rome').success).toBe(true)
  })
})
