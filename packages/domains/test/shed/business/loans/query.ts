import { z } from 'zod'
import {
  query,
  AND,
  dsl,
  id,
  loan_selection,
  reservation_selection,
  tool_calculation,
  tool_selection,
  value,
} from './_scope_query.ts'

/** The loan is ongoing and the member has the tool. */
export const the_loan_is_ongoing_for_the_member = AND({
  the_loan_is_ongoing: loan_selection.the_loan_is_ongoing,
  the_loan_is_of_the_member: loan_selection.the_loan_is_of_this_member,
})

/** The tools a member has: the ongoing loans, the closest due date first. */
export const the_ongoing_loans_of_a_member = query({
  input: z.strictObject({
    member_id: id.member_id,
  }),
  fields: value.ongoing_loan_entry,
  identity: 'id',
  selection: the_loan_is_ongoing_for_the_member,
  order: { due_day: 'ascending' },
  creator: () => (input) => ({
    selection: {
      the_loan_is_ongoing: {},
      the_loan_is_of_the_member: { member_id: input.member_id },
    },
  }),
})

/** The reservation is in force, the member's, for today or a later day. */
export const the_reservation_is_ahead_for_the_member = AND({
  the_reservation_is_booked: reservation_selection.the_reservation_is_booked,
  the_reservation_is_of_the_member: reservation_selection.the_reservation_is_of_this_member,
  the_day_has_not_passed: reservation_selection.the_reservation_is_from_this_day_on,
})

/** The member's reservations from today on, the closest day first. */
export const the_reservations_of_a_member = query({
  input: z.strictObject({
    member_id: id.member_id,
  }),
  fields: value.reservation_entry,
  identity: 'id',
  selection: the_reservation_is_ahead_for_the_member,
  order: { day: 'ascending' },
  creator: (context) => (input) => ({
    selection: {
      the_reservation_is_booked: {},
      the_reservation_is_of_the_member: { member_id: input.member_id },
      the_day_has_not_passed: { day: dsl.today(context.now) },
    },
  }),
})

/** The reservation is ahead for the member, and its tool is in the workshop. */
export const the_reservation_ahead_waits_for_the_workshop = AND({
  the_reservation_is_ahead: the_reservation_is_ahead_for_the_member,
  the_tool_is_in_the_workshop: reservation_selection.the_tool_of_the_reservation_is_in_the_workshop,
})

/**
 * The member's reservations from today on whose tool is in the workshop, the
 * closest day first: those that may not be ready on their day (SC-20).
 */
export const the_reservations_of_a_member_in_the_workshop = query({
  input: z.strictObject({
    member_id: id.member_id,
  }),
  fields: value.reservation_entry,
  identity: 'id',
  selection: the_reservation_ahead_waits_for_the_workshop,
  order: { day: 'ascending' },
  creator: (context) => (input) => ({
    selection: {
      the_reservation_is_ahead: {
        the_reservation_is_booked: {},
        the_reservation_is_of_the_member: { member_id: input.member_id },
        the_day_has_not_passed: { day: dsl.today(context.now) },
      },
      the_tool_is_in_the_workshop: {},
    },
  }),
})

/**
 * The tools still in the shed with their loans this month, the shed's month
 * (SC-12): the most lent first, then by name, and those never lent this
 * month too, at zero, so that the keeper sees the tools standing idle (SC-21).
 */
export const the_loans_of_each_tool_this_month = query({
  input: z.strictObject({}),
  fields: value.tool_of_the_shed_entry,
  calculations: { loans: tool_calculation.the_loans_of_the_tool_between_these_days },
  identity: 'tool_id',
  selection: tool_selection.the_tool_is_still_in_the_shed,
  order: { loans: 'descending', tool_name: 'ascending' },
  creator: (context) => () => ({
    selection: {},
    calculations: {
      loans: {
        first_day: dsl.the_first_day_of_the_month(context.now),
        last_day: dsl.the_last_day_of_the_month(context.now),
      },
    },
  }),
})
