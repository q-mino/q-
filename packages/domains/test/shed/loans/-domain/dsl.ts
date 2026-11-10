// The domain's pure functions over its values, added at need: usable by the
// adapters, the interface and the client. Not concepts of the library. DOM-5

import { date_time_string } from '../../wlib.ts'

const loan_period_in_days = 14
const booking_window_in_days = 30
const a_day_in_milliseconds = 24 * 60 * 60 * 1000

export const the_due_date_of_a_loan_started_on = (start_date: date_time_string): date_time_string =>
  date_time_string.parse(
    new Date(Date.parse(start_date) + loan_period_in_days * a_day_in_milliseconds).toISOString(),
  )

const the_day_of = (date: date_time_string): string => date.slice(0, 10)

/** A day can be booked after today and within the booking window. A static rule: validation. */
export const the_day_is_within_the_booking_window = (day: string, now: date_time_string): boolean =>
  day > the_day_of(now) &&
  day <=
    the_day_of(
      date_time_string.parse(
        new Date(Date.parse(now) + booking_window_in_days * a_day_in_milliseconds).toISOString(),
      ),
    )
