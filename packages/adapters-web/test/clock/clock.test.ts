import { describe, expect, test } from 'vitest'
import * as zz from '@q-mino/domains/library'
import { the_device_s_clock, the_device_s_zone, the_time_that_passes } from '../../src/index.ts'

// The device's clock and the time that passes (WEB-4): the instant the
// runtime reads, in UTC (A, 23 Nov 2026), with the zone the configuration
// gives (SC-12), and a timer that resolves once its time has elapsed.

const rome = zz.time_zone.parse('Europe/Rome')
const toronto = zz.time_zone.parse('America/Toronto')

describe("the device's clock", () => {
  test('reads the instant of its runtime', () => {
    const before = Date.now()
    const now = the_device_s_clock(rome).now()
    const after = Date.now()
    expect(zz.date_time.safeParse(now).success).toBe(true)
    expect(Date.parse(now)).toBeGreaterThanOrEqual(before)
    expect(Date.parse(now)).toBeLessThanOrEqual(after)
  })

  test('writes it in UTC, to the millisecond, whatever the zone: the instant tells no zone', () => {
    for (const zone of [rome, toronto, zz.time_zone.parse('UTC')]) {
      expect(the_device_s_clock(zone).now()).toMatch(/T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    }
  })

  test('gives the zone it was given, for the context of an internal entry', () => {
    expect(the_device_s_clock(toronto).time_zone).toBe(toronto)
  })
})

describe("the device's zone", () => {
  test('is a zone of the runtime, the one its calendar is in', () => {
    const zone = the_device_s_zone()
    expect(zz.time_zone.safeParse(zone).success).toBe(true)
    expect(zone).toBe(new Intl.DateTimeFormat().resolvedOptions().timeZone)
  })
})

describe('the time that passes', () => {
  test('resolves once its milliseconds have elapsed', async () => {
    const before = performance.now()
    await the_time_that_passes(30)
    expect(performance.now() - before).toBeGreaterThanOrEqual(25)
  })
})
