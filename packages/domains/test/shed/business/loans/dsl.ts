// The domain's pure functions over its values, added at need: usable by the
// adapters, the interface and the client. Not concepts of the library. DOM-5

import { date_time, day, day_of } from '../../wlib.ts'
import { id, tools, value } from './_scope_dsl.ts'

const loan_period_in_days = 14
const booking_window_in_days = 30
const a_day_in_milliseconds = 24 * 60 * 60 * 1000

/** The first instant of a day. */
export const the_start_of = (the_day: day): date_time => date_time.parse(`${the_day}T00:00:00.000Z`)

const days_after = (the_day: day, days: number): day =>
  day_of(
    date_time.parse(
      new Date(Date.parse(the_start_of(the_day)) + days * a_day_in_milliseconds).toISOString(),
    ),
  )

/** The day a loan is due: the tool comes back by the end of the loan period's last day (A, 16 Nov 2026 (7)). */
export const the_due_date_of_a_loan_started_on = (start_date: date_time): day =>
  days_after(day_of(start_date), loan_period_in_days)

/** The day before a due date, when the member is reminded. */
export const the_eve_of = (due_date: day): day => days_after(due_date, -1)

/** The day after a due date, when a loan whose tool is still out becomes overdue. */
export const the_day_after = (due_date: day): day => days_after(due_date, 1)

/** The calendar day of an instant. */
export const today = (now: date_time): day => day_of(now)

/** A day can be booked after today and within the booking window. A static rule: validation. */
export const the_day_is_within_the_booking_window = (day: string, now: date_time): boolean =>
  day > day_of(now) &&
  day <=
    day_of(
      date_time.parse(
        new Date(Date.parse(now) + booking_window_in_days * a_day_in_milliseconds).toISOString(),
      ),
    )

/** A loan returned after its due date, a day: on the due date itself it is on time. */
export const the_loan_was_returned_late = (the_loan: value.returned_loan): boolean =>
  day_of(the_loan.progress.return_date) > the_loan.due_day

/** The member has the tool: the loan is ongoing, its term running or overdue. */
export const the_loan_is_ongoing = (the_loan: value.loan | undefined): boolean =>
  the_loan?.progress.stage === 'ongoing'

/** The tool is back. */
export const the_loan_is_returned = (the_loan: value.loan | undefined): boolean =>
  the_loan?.progress.stage === 'returned'

/**
 * The due date on the loan's card is still ahead at an instant: the day has
 * not ended, so on the due date itself it is; a loan that does not exist has none.
 */
export const the_due_date_of_the_loan_is_still_ahead =
  (the_loan: value.loan | undefined) =>
  (now: date_time): boolean =>
    the_loan !== undefined && day_of(now) <= the_loan.due_day

/** Whether the due date of an ongoing loan has passed; a returned loan has no term. */
export const the_term_of_the_loan = (the_loan: value.loan): value.loan_term | undefined =>
  the_loan.progress.stage === 'ongoing' ? the_loan.progress.term : undefined

/** The reservation holds the tool for its day; one that does not exist holds nothing. */
export const the_reservation_is_booked = (
  the_reservation: value.reservation | undefined,
): boolean => the_reservation?.progress.stage === 'booked'

/**
 * The key of the notice of a repair to a reservation, the id of its entry
 * (DOM-13): one notice per stay in repair and reservation, so that Paolo,
 * booked three weeks on, is notified once for each repair of the drill. Both
 * values, encoded with no ambiguity: an id may hold any character.
 */
export const the_notice_of_the_repair_to_the_reservation = (notice: {
  readonly repair_id: tools.id.repair_id
  readonly reservation_id: id.reservation_id
}): string => JSON.stringify([notice.repair_id, notice.reservation_id])

/**
 * The key of a wait for the overdue put off to the day after, the id of its
 * entry (DOM-13): the first wait's key is the loan's, and the operation of
 * the return that put it off (DOM-11), so the new one has its own, the loan
 * and the day it was put off on, encoded with no ambiguity (A, 17 Nov 2026).
 */
export const the_wait_for_the_overdue_put_off_on_a_day = (wait: {
  readonly loan_id: id.loan_id
  readonly day: day
}): string => JSON.stringify([wait.loan_id, wait.day])
