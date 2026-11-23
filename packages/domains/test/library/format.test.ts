import { describe, expect, test } from 'vitest'
import { date_time, day, day_of, end_of, start_of, time_zone } from '../../src/library/index.ts'

// The formats over the zones (SC-12; part 3.2): an instant in UTC, as a clock
// writes it (A, 23 Nov 2026), its day in a zone, and a day to its instants
// with a zone and its rules, over the zones of the runtime (`Intl`).

const zone = (name: string) => time_zone.parse(name)
const the = (text: string) => day.parse(text)
const at = (text: string) => date_time.parse(text)

const toronto = zone('America/Toronto')
const utc = zone('UTC')

describe('an instant, as a clock writes it', () => {
  test('in UTC, with milliseconds: no offset, no other precision', () => {
    expect(date_time.safeParse(new Date(Date.UTC(2026, 10, 3, 4, 30)).toISOString()).success).toBe(
      true,
    )
    expect(date_time.safeParse('2026-11-02T23:30:00.000-05:00').success).toBe(false)
    expect(date_time.safeParse('2026-11-03T04:30:00Z').success).toBe(false)
    expect(date_time.safeParse('2026-11-03T04:30:00.000000Z').success).toBe(false)
  })

  test('its text orders as its instant, across the hour that repeats in autumn (LIB-9)', () => {
    // 01:30 in Toronto on 1 Nov, twice: at -04:00, then at -05:00.
    const first = at('2026-11-01T05:30:00.000Z')
    const second = at('2026-11-01T06:30:00.000Z')
    expect(Date.parse(second) - Date.parse(first)).toBe(3_600_000)
    expect([second, first].sort()).toEqual([first, second])
    expect(day_of(toronto)(first)).toBe('2026-11-01')
    expect(day_of(toronto)(second)).toBe('2026-11-01')
  })
})

describe('SC-12, the day of an instant', () => {
  // At 23:30 on 2 Nov in Toronto, already 3 Nov in UTC, Marta borrows the
  // drill: it is due on 16 Nov.
  const borrowed = at('2026-11-03T04:30:00.000Z')

  test('its day is the zone’s: the 2nd in Toronto, the 3rd in UTC', () => {
    expect(day_of(toronto)(borrowed)).toBe('2026-11-02')
    expect(day_of(utc)(borrowed)).toBe('2026-11-03')
  })

  test("the eve's wait at the start of 15 Nov there, the overdue wait at the start of 17 Nov", () => {
    expect(start_of(toronto)(the('2026-11-15'))).toBe('2026-11-15T05:00:00.000Z')
    expect(start_of(toronto)(the('2026-11-17'))).toBe('2026-11-17T05:00:00.000Z')
  })

  test('her phone at 1.4.0 reads 16 Nov, 23:59:59.999 in Toronto', () => {
    expect(end_of(toronto)(the('2026-11-16'))).toBe('2026-11-17T04:59:59.999Z')
    expect(day_of(toronto)(end_of(toronto)(the('2026-11-16')))).toBe('2026-11-16')
  })

  test("in UTC the eve's wait would have gone at 19:00 on the 15th there, the old phone read 18:59 on the 17th", () => {
    expect(start_of(utc)(the('2026-11-16'))).toBe('2026-11-16T00:00:00.000Z')
    expect(day_of(toronto)(start_of(utc)(the('2026-11-16')))).toBe('2026-11-15')
    expect(end_of(utc)(the('2026-11-17'))).toBe('2026-11-17T23:59:59.999Z')
  })

  test('an offset is not a zone: taken on 20 Oct at -04:00, due on 3 Nov at -05:00', () => {
    expect(start_of(toronto)(the('2026-10-20'))).toBe('2026-10-20T04:00:00.000Z')
    expect(end_of(toronto)(the('2026-11-03'))).toBe('2026-11-04T04:59:59.999Z')
  })
})

describe('the zones of the runtime', () => {
  test('the day the clocks go back has 25 hours', () => {
    const start = start_of(toronto)(the('2026-11-01'))
    const end = end_of(toronto)(the('2026-11-01'))
    expect(start).toBe('2026-11-01T04:00:00.000Z')
    expect(end).toBe('2026-11-02T04:59:59.999Z')
    expect(Date.parse(end) + 1 - Date.parse(start)).toBe(25 * 3_600_000)
  })

  test('a midnight that does not exist: the day starts when the clock jumps into it', () => {
    const santiago = zone('America/Santiago')
    expect(start_of(santiago)(the('2026-09-06'))).toBe('2026-09-06T04:00:00.000Z')
    expect(end_of(santiago)(the('2026-09-05'))).toBe('2026-09-06T03:59:59.999Z')
    expect(start_of(zone('America/Havana'))(the('2026-03-08'))).toBe('2026-03-08T05:00:00.000Z')
  })

  test('offsets in half hours; a day by the summer clock', () => {
    expect(start_of(zone('Asia/Kolkata'))(the('2026-11-02'))).toBe('2026-11-01T18:30:00.000Z')
    expect(day_of(zone('Europe/London'))(at('2026-07-01T23:30:00.250Z'))).toBe('2026-07-02')
  })

  test('a zone the runtime does not know is no zone', () => {
    expect(time_zone.safeParse('Mars/Olympus').success).toBe(false)
    expect(time_zone.safeParse('Europe/Rome').success).toBe(true)
  })
})
