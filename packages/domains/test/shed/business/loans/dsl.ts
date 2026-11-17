// The domain's pure functions over its values, added at need: usable by the
// adapters, the interface and the client. Not concepts of the library. DOM-5

import { date_time, day, day_of } from '../../wlib.ts'
import { id, tools, value } from './_scope_dsl.ts'

const loan_period_in_days = 14
const booking_window_in_days = 30
const a_day_in_milliseconds = 24 * 60 * 60 * 1000

/**
 * A day some days after another: arithmetic of the calendar, in no zone (a
 * day is a day wherever the shed is), counted over the days' UTC midnights,
 * which no change of offset moves.
 */
const days_after = (the_day: day, days: number): day =>
  day.parse(
    new Date(Date.parse(`${the_day}T00:00:00Z`) + days * a_day_in_milliseconds)
      .toISOString()
      .slice(0, 10),
  )

/** The day a loan is due: the tool comes back by the end of the loan period's last day (A, 16 Nov 2026 (7)). */
export const the_due_date_of_a_loan_started_on = (start_date: date_time): day =>
  days_after(day_of(start_date), loan_period_in_days)

/** The day before a due date, when the member is reminded. */
export const the_eve_of = (due_date: day): day => days_after(due_date, -1)

/** The day after a due date, when a loan whose tool is still out becomes overdue. */
export const the_day_after = (due_date: day): day => days_after(due_date, 1)

/** The calendar day of an instant, as its writer told it: `now` is told in the shed's zone. */
export const today = (now: date_time): day => day_of(now)

/** The first day of the month of an instant, as its writer told it: `now` is told in the shed's zone. */
export const the_first_day_of_the_month = (now: date_time): day =>
  day.parse(`${today(now).slice(0, 7)}-01`)

/**
 * The last day of the month of an instant: the day before the first of the
 * next month, on the calendar (day 0 of a month is the last of the one before).
 */
export const the_last_day_of_the_month = (now: date_time): day =>
  day.parse(
    new Date(Date.UTC(Number(today(now).slice(0, 4)), Number(today(now).slice(5, 7)), 0))
      .toISOString()
      .slice(0, 10),
  )

/** The loan started between two days, both included, on its day as written (SC-12, SC-21). */
export const the_loan_started_between =
  (days: { readonly first_day: day; readonly last_day: day }) =>
  (the_loan: value.loan): boolean =>
    day_of(the_loan.start_date) >= days.first_day && day_of(the_loan.start_date) <= days.last_day

/** A day can be booked after today and within the booking window, days of the shed. A static rule: validation. */
export const the_day_is_within_the_booking_window = (the_day: string, now: date_time): boolean =>
  the_day > today(now) && the_day <= days_after(today(now), booking_window_in_days)

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
 * The reservation holds this tool for this member on this day: booked, and
 * its card says so. One that does not exist holds nothing (SC-10).
 */
export const the_reservation_holds_the_tool_for_the_member_on_the_day =
  (the_reservation: value.reservation | undefined) =>
  (claim: {
    readonly tool_id: tools.id.tool_id
    readonly member_id: id.member_id
    readonly day: day
  }): boolean =>
    the_reservation_is_booked(the_reservation) &&
    the_reservation?.tool_id === claim.tool_id &&
    the_reservation.member_id === claim.member_id &&
    the_reservation.day === claim.day

/** The member's reservation has been taken up: they took the tool on its day (SC-10). */
export const the_reservation_of_the_member_has_been_taken_up =
  (the_reservation: value.reservation | undefined) =>
  (claim: { readonly member_id: id.member_id }): boolean =>
    the_reservation?.progress.stage === 'taken_up' && the_reservation.member_id === claim.member_id

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
 * The key of the eve's wait queued by a correction of the loan's tool, the
 * id of its entry (DOM-13): the first eve's key is the loan's, so the new
 * one has its own, the loan and the tool it reminds of (SC-13).
 */
export const the_eve_of_the_loan_corrected_to_the_tool = (wait: {
  readonly loan_id: id.loan_id
  readonly tool_id: tools.id.tool_id
}): string => JSON.stringify([wait.loan_id, wait.tool_id])

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
