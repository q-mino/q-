import { z } from 'zod'
import { day, member_id } from './value.ts'

// The vocabulary of the selections of `loans`: predicates over the loan or the
// reservation a query looks at, which they do not name; their parameters are
// the values of the filter.

export const the_loan_is_ongoing = z.strictObject({})

export const the_loan_is_of_this_member = z.strictObject({
  member_id: member_id,
})

export const the_reservation_is_booked = z.strictObject({})

export const the_reservation_is_of_this_member = z.strictObject({
  member_id: member_id,
})

/** The reserved day is this day or a later one. */
export const the_reservation_is_from_this_day_on = z.strictObject({
  day: day,
})
