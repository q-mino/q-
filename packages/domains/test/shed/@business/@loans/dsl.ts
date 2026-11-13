// The domain's pure functions over its values, added at need: usable by the
// adapters, the interface and the client. Not concepts of the library. DOM-5

import { date_time_string, day } from '../../wlib.ts'
import type { loan, loan_term, returned_loan } from './_value.ts'

const loan_period_in_days = 14
const booking_window_in_days = 30
const a_day_in_milliseconds = 24 * 60 * 60 * 1000

export const the_due_date_of_a_loan_started_on = (start_date: date_time_string): date_time_string =>
  date_time_string.parse(
    new Date(Date.parse(start_date) + loan_period_in_days * a_day_in_milliseconds).toISOString(),
  )

/** A day before an instant: the eve of a due date, when the member is reminded. */
export const the_eve_of = (date: date_time_string): date_time_string =>
  date_time_string.parse(new Date(Date.parse(date) - a_day_in_milliseconds).toISOString())

const the_day_of = (date: date_time_string): string => date.slice(0, 10)

/** The calendar day of an instant. */
export const today = (now: date_time_string): day => day.parse(the_day_of(now))

/** A day can be booked after today and within the booking window. A static rule: validation. */
export const the_day_is_within_the_booking_window = (day: string, now: date_time_string): boolean =>
  day > the_day_of(now) &&
  day <=
    the_day_of(
      date_time_string.parse(
        new Date(Date.parse(now) + booking_window_in_days * a_day_in_milliseconds).toISOString(),
      ),
    )

/** A loan returned after its due date. */
export const the_loan_was_returned_late = (the_loan: returned_loan): boolean =>
  the_loan.progress.return_date > the_loan.due_date

/** The member has the tool: the loan is ongoing, its term running or overdue. */
export const the_loan_is_ongoing = (the_loan: loan | undefined): boolean =>
  the_loan?.progress.stage === 'ongoing'

/** The tool is back. */
export const the_loan_is_returned = (the_loan: loan | undefined): boolean =>
  the_loan?.progress.stage === 'returned'

/** Whether the due date of an ongoing loan has passed; a returned loan has no term. */
export const the_term_of_the_loan = (the_loan: loan): loan_term | undefined =>
  the_loan.progress.stage === 'ongoing' ? the_loan.progress.term : undefined
