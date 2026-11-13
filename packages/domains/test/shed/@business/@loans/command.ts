import { z } from 'zod'
import { tool_id } from '../@tools/_id.ts'
import * as wlib from '../../wlib.ts'
import {
  a_tool_has_been_booked,
  a_tool_has_been_returned,
  the_loan_was_already_returned,
  a_tool_has_been_lent,
  the_member_already_booked_the_tool,
  the_member_already_has_the_tool,
  the_member_has_been_reminded_of_the_due_date,
  the_loan_was_returned_before_the_reminder,
} from './_fact.ts'
import { send_the_due_date_reminder, wait_until_the_eve_of_the_due_date } from './_effect.ts'
import {
  a_loan_has_this_id,
  a_tool_has_this_id,
  the_tool_is_in_service,
  a_reservation_has_this_id,
  the_loan_is_ongoing,
  the_loan_is_returned,
  the_tool_is_booked_for_the_day,
  the_tool_is_booked_for_the_day_by_this_member,
  the_tool_is_on_loan,
  the_tool_is_on_loan_to_this_member,
} from './_predicate.ts'
import {
  the_day_is_within_the_booking_window,
  the_due_date_of_a_loan_started_on,
  the_eve_of,
} from './_dsl.ts'
import { loan_id, member_id, reservation_id } from './_id.ts'
import { return_condition } from './_value.ts'
import { here } from './_here.ts'

/** The tool can be lent: named components, bound one by one by the creator. */
export const the_tool_can_be_lent = wlib.AND({
  a_loan_has_not_the_requested_id: wlib.NOT(a_loan_has_this_id),
  a_tool_has_the_requested_id: a_tool_has_this_id,
  the_requested_tool_is_in_service: the_tool_is_in_service,
  the_requested_tool_is_not_on_loan: wlib.NOT(the_tool_is_on_loan),
})

/**
 * The tool is lent, and the eve of its due date is awaited (DOM-13): on the
 * eve, `remind_the_member_of_the_due_date` reminds the member if they still
 * have the tool. One loan, one eve: the loan's id is the entry's.
 */
export const borrow_a_tool = here.command({
  input: z.strictObject({
    loan_id: loan_id,
    tool_id: tool_id,
    member_id: member_id,
  }),
  outcomes: {
    the_tool_is_available_so_it_is_lent: [
      the_tool_can_be_lent,
      a_tool_has_been_lent,
      { wait_until_the_eve_of_the_due_date },
    ],
    the_member_already_has_the_tool_so_nothing_changes: [
      the_tool_is_on_loan_to_this_member,
      the_member_already_has_the_tool,
    ],
  },
  creator: (context) => (input) => {
    const due_date = the_due_date_of_a_loan_started_on(context.now)
    return {
      the_tool_is_available_so_it_is_lent: [
        {
          a_loan_has_not_the_requested_id: { loan_id: input.loan_id },
          a_tool_has_the_requested_id: { tool_id: input.tool_id },
          the_requested_tool_is_in_service: { tool_id: input.tool_id },
          the_requested_tool_is_not_on_loan: { tool_id: input.tool_id },
        },
        {
          new_loan: {
            id: input.loan_id,
            tool_id: input.tool_id,
            member_id: input.member_id,
            start_date: context.now,
            due_date: due_date,
            progress: { stage: 'ongoing' },
          },
        },
        {
          wait_until_the_eve_of_the_due_date: {
            id: input.loan_id,
            payload: {
              loan_id: input.loan_id,
              tool_id: input.tool_id,
              member_id: input.member_id,
              due_date: due_date,
            },
            not_before: the_eve_of(due_date),
          },
        },
      ],
      the_member_already_has_the_tool_so_nothing_changes: [
        { tool_id: input.tool_id, member_id: input.member_id },
        { tool_id: input.tool_id, member_id: input.member_id },
      ],
    }
  },
})

/** The tool can be booked for the day. */
export const the_tool_can_be_booked = wlib.AND({
  a_reservation_has_not_the_requested_id: wlib.NOT(a_reservation_has_this_id),
  a_tool_has_the_requested_id: a_tool_has_this_id,
  the_requested_tool_is_in_service: the_tool_is_in_service,
  the_requested_tool_is_not_booked_that_day: wlib.NOT(the_tool_is_booked_for_the_day),
})

export const reserve_a_tool = here.command({
  /** The day is validated against the clock: the schema needs `now`, nothing else. */
  input: (context) =>
    z
      .strictObject({
        reservation_id: reservation_id,
        tool_id: tool_id,
        member_id: member_id,
        day: wlib.day,
      })
      .refine((input) => the_day_is_within_the_booking_window(input.day, context.now), {
        path: ['day'],
      }),
  outcomes: {
    the_tool_is_free_that_day_so_it_is_booked: [the_tool_can_be_booked, a_tool_has_been_booked],
    the_member_already_booked_the_tool_so_nothing_changes: [
      the_tool_is_booked_for_the_day_by_this_member,
      the_member_already_booked_the_tool,
    ],
  },
  creator: (context) => (input) => ({
    the_tool_is_free_that_day_so_it_is_booked: [
      {
        a_reservation_has_not_the_requested_id: { reservation_id: input.reservation_id },
        a_tool_has_the_requested_id: { tool_id: input.tool_id },
        the_requested_tool_is_in_service: { tool_id: input.tool_id },
        the_requested_tool_is_not_booked_that_day: { tool_id: input.tool_id, day: input.day },
      },
      {
        new_reservation: {
          id: input.reservation_id,
          tool_id: input.tool_id,
          member_id: input.member_id,
          day: input.day,
          booking_date: context.now,
          progress: { stage: 'booked' },
        },
      },
    ],
    the_member_already_booked_the_tool_so_nothing_changes: [
      { tool_id: input.tool_id, day: input.day, member_id: input.member_id },
      { tool_id: input.tool_id, day: input.day, member_id: input.member_id },
    ],
  }),
})

/** The requested loan exists and is ongoing. */
export const the_loan_can_be_returned = wlib.AND({
  a_loan_has_the_requested_id: a_loan_has_this_id,
  the_requested_loan_is_ongoing: the_loan_is_ongoing,
})

/** The requested loan exists and is already returned. */
export const the_loan_is_already_returned = wlib.AND({
  a_loan_has_the_requested_id: a_loan_has_this_id,
  the_requested_loan_is_returned: the_loan_is_returned,
})

export const return_a_tool = here.command({
  input: z.strictObject({
    loan_id: loan_id,
    condition: return_condition,
  }),
  outcomes: {
    the_loan_is_ongoing_so_it_is_closed: [the_loan_can_be_returned, a_tool_has_been_returned],
    the_loan_was_already_returned_so_nothing_changes: [
      the_loan_is_already_returned,
      the_loan_was_already_returned,
    ],
  },
  creator: (context) => (input) => ({
    the_loan_is_ongoing_so_it_is_closed: [
      {
        a_loan_has_the_requested_id: { loan_id: input.loan_id },
        the_requested_loan_is_ongoing: { loan_id: input.loan_id },
      },
      {
        returned_loan: {
          id: input.loan_id,
          progress: {
            stage: 'returned',
            return_date: context.now,
            condition: input.condition,
          },
        },
      },
    ],
    the_loan_was_already_returned_so_nothing_changes: [
      {
        a_loan_has_the_requested_id: { loan_id: input.loan_id },
        the_requested_loan_is_returned: { loan_id: input.loan_id },
      },
      { loan_id: input.loan_id },
    ],
  }),
})

/** The requested loan exists and the member still has the tool. */
export const the_member_still_has_the_tool = wlib.AND({
  a_loan_has_the_requested_id: a_loan_has_this_id,
  the_requested_loan_is_ongoing: the_loan_is_ongoing,
})

/**
 * The return of the eve of the due date (D68.3): the guard is the command's,
 * not the infrastructure's, so a return before the eve meets a branch that
 * records a fact and changes nothing (D95), never a rejection. Its input is
 * the payload of the wait, given back by the executor; its operation is the
 * entry's (DOM-14).
 */
export const remind_the_member_of_the_due_date = here.command({
  input: z.strictObject({
    loan_id: loan_id,
    tool_id: tool_id,
    member_id: member_id,
    due_date: wlib.date_time_string,
  }),
  outcomes: {
    the_member_still_has_the_tool_so_they_are_reminded: [
      the_member_still_has_the_tool,
      the_member_has_been_reminded_of_the_due_date,
      { send_the_due_date_reminder },
    ],
    the_loan_was_returned_so_nothing_changes: [
      the_loan_is_already_returned,
      the_loan_was_returned_before_the_reminder,
    ],
  },
  creator: () => (input) => ({
    the_member_still_has_the_tool_so_they_are_reminded: [
      {
        a_loan_has_the_requested_id: { loan_id: input.loan_id },
        the_requested_loan_is_ongoing: { loan_id: input.loan_id },
      },
      { loan_id: input.loan_id },
      {
        send_the_due_date_reminder: {
          id: input.loan_id,
          payload: {
            loan_id: input.loan_id,
            tool_id: input.tool_id,
            member_id: input.member_id,
            due_date: input.due_date,
          },
        },
      },
    ],
    the_loan_was_returned_so_nothing_changes: [
      {
        a_loan_has_the_requested_id: { loan_id: input.loan_id },
        the_requested_loan_is_returned: { loan_id: input.loan_id },
      },
      { loan_id: input.loan_id },
    ],
  }),
})
