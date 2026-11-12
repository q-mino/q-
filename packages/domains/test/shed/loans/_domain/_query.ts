import { z } from 'zod'
import * as wlib from '../../wlib.ts'
import { today } from './dsl.ts'
import * as selection from './selection/index.ts'
import { member_id } from './id.ts'
import { ongoing_loan_entry, reservation_entry } from './value.ts'

/** The loan is ongoing and the member has the tool. */
export const the_loan_is_ongoing_for_the_member = wlib.AND({
  the_loan_is_ongoing: selection.loan.the_loan_is_ongoing,
  the_loan_is_of_the_member: selection.loan.the_loan_is_of_this_member,
})

/** The tools a member has: the ongoing loans, the closest due date first. */
export const the_ongoing_loans_of_a_member = wlib.query({
  input: z.strictObject({
    member_id: member_id,
  }),
  fields: ongoing_loan_entry,
  identity: 'id',
  selection: the_loan_is_ongoing_for_the_member,
  order: { due_date: 'ascending' },
  creator: () => (input) => ({
    the_loan_is_ongoing: {},
    the_loan_is_of_the_member: { member_id: input.member_id },
  }),
})

/** The reservation is in force, the member's, for today or a later day. */
export const the_reservation_is_ahead_for_the_member = wlib.AND({
  the_reservation_is_booked: selection.reservation.the_reservation_is_booked,
  the_reservation_is_of_the_member: selection.reservation.the_reservation_is_of_this_member,
  the_day_has_not_passed: selection.reservation.the_reservation_is_from_this_day_on,
})

/** The member's reservations from today on, the closest day first. */
export const the_reservations_of_a_member = wlib.query({
  input: z.strictObject({
    member_id: member_id,
  }),
  fields: reservation_entry,
  identity: 'id',
  selection: the_reservation_is_ahead_for_the_member,
  order: { day: 'ascending' },
  creator: (context) => (input) => ({
    the_reservation_is_booked: {},
    the_reservation_is_of_the_member: { member_id: input.member_id },
    the_day_has_not_passed: { day: today(context.now) },
  }),
})
