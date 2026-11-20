// The device's clock and the time that passes (WEB-4; GR-8, SC-12, TST-3):
// the sources the configurator injects where the domains and the library
// take a clock (`zz.Clock`) or a time that elapses (`zz.Elapsed`). Nothing
// else of the phone reads `Date` or sets a timer.

import * as zz from '@q-mino/domains/library'

/**
 * The zone the device's calendar is in, as its runtime tells it (`Intl`).
 * Whether the node writes its instants in it or in UTC is its
 * configuration's choice (SC-12: the offset is information the record gives).
 */
export const the_device_s_zone = (): zz.time_zone =>
  zz.time_zone.parse(new Intl.DateTimeFormat().resolvedOptions().timeZone)

/**
 * The device's clock: the instant its runtime reads (`Date`), told in the
 * zone the configuration gives, with its offset (SC-12).
 */
export const the_device_s_clock = (time_zone: zz.time_zone): zz.Clock => ({
  now: () => zz.in_zone(time_zone)(zz.date_time.parse(new Date().toISOString())),
  time_zone,
})

/** The time that passes, by the runtime's timer: a promise that resolves once so many milliseconds have elapsed. */
export const the_time_that_passes: zz.Elapsed = (milliseconds) =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })
