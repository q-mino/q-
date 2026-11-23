import { z } from 'zod'
import * as zz from '../../../../src/library/index.ts'
import {
  command,
  cursor_step,
  AND,
  NOT,
  pick,
  composes,
  dsl,
  effect,
  fact,
  id,
  predicate,
  reservation_selection,
  value,
  tools,
} from './_scope_command.ts'

/** The tool can be lent: named components, bound one by one by the creator. */
export const the_tool_can_be_lent = AND({
  a_loan_has_not_the_requested_id: NOT(predicate.a_loan_has_this_id),
  a_tool_has_the_requested_id: predicate.a_tool_has_this_id,
  the_requested_tool_is_in_service: predicate.the_tool_is_in_service,
  the_requested_tool_is_not_on_loan: NOT(predicate.the_tool_is_on_loan),
})

/**
 * The tool can be lent today to whoever asks: on its day a reservation holds
 * the tool for its member, who takes it up (`lend_a_booked_tool`); to anyone
 * else it is not available (SC-10).
 */
export const the_tool_can_be_lent_to_anyone_today = AND({
  the_tool_can_be_lent: the_tool_can_be_lent,
  no_one_booked_the_tool_for_today: NOT(predicate.the_tool_is_booked_for_the_day),
})

/** Who borrows which tool, under which loan: what a loan is opened with. */
interface LoanRequest {
  readonly loan_id: id.loan_id
  readonly tool_id: tools.id.tool_id
  readonly member_id: id.member_id
}

/** The loan the desk opens now: due on the day the loan period ends, its term running. */
const the_loan_lent =
  (context: zz.RootContext) =>
  (loan: LoanRequest): z.input<typeof fact.a_tool_has_been_lent> => ({
    new_loan: {
      id: loan.loan_id,
      tool_id: loan.tool_id,
      member_id: loan.member_id,
      start_date: context.now,
      start_day: dsl.today(context),
      due_day: dsl.the_due_date_of_a_loan_started_on(dsl.today(context)),
      progress: { stage: 'ongoing', term: 'running' },
    },
  })

/**
 * The two waits of a loan opened now (DOM-13), at the start of their days in
 * the shed's zone (SC-12): the eve of its due day, and the day after it. One
 * loan, one wait of each: the loan's id is each entry's.
 */
const the_waits_of_the_loan = (context: zz.RootContext) => (loan: LoanRequest) => {
  const due_day = dsl.the_due_date_of_a_loan_started_on(dsl.today(context))
  return {
    wait_until_the_eve_of_the_due_date: {
      id: loan.loan_id,
      payload: {
        loan_id: loan.loan_id,
        tool_id: loan.tool_id,
        member_id: loan.member_id,
        due_day: due_day,
      },
      not_before: zz.start_of(context.time_zone)(dsl.the_eve_of(due_day)),
    },
    wait_until_the_due_date: {
      id: loan.loan_id,
      payload: { loan_id: loan.loan_id },
      not_before: zz.start_of(context.time_zone)(dsl.the_day_after(due_day)),
    },
  }
}

/**
 * The tool is lent, its term running, and two dates are awaited (DOM-13):
 * on the eve of the due date `remind_the_member_of_the_due_date` reminds the
 * member, on the due date `declare_the_loan_overdue` stamps the loan
 * overdue, each only if the member still has the tool. Both queued here, not
 * one by the other's return: neither decides the other. Days of the shed
 * (SC-12): Marta takes the drill at 23:30 on 2 November in Toronto, already
 * the 3rd in UTC, and it is due on the 16th; her eve's wait goes at the start
 * of the 15th there. A tool booked for today is lent to no one by this
 * command: its member takes it up (SC-10).
 */
export const borrow_a_tool = command({
  input: z.strictObject({
    loan_id: id.loan_id,
    tool_id: tools.id.tool_id,
    member_id: id.member_id,
  }),
  outcomes: {
    the_tool_is_available_so_it_is_lent: [
      the_tool_can_be_lent_to_anyone_today,
      fact.a_tool_has_been_lent,
      pick(effect, 'wait_until_the_eve_of_the_due_date', 'wait_until_the_due_date'),
    ],
    the_member_already_has_the_tool_so_nothing_changes: [
      predicate.the_tool_is_on_loan_to_this_member,
      fact.a_tool_has_been_lent_again,
    ],
  },
  creator: (context) => (input) => ({
    the_tool_is_available_so_it_is_lent: [
      {
        the_tool_can_be_lent: {
          a_loan_has_not_the_requested_id: { loan_id: input.loan_id },
          a_tool_has_the_requested_id: { tool_id: input.tool_id },
          the_requested_tool_is_in_service: { tool_id: input.tool_id },
          the_requested_tool_is_not_on_loan: { tool_id: input.tool_id },
        },
        no_one_booked_the_tool_for_today: {
          tool_id: input.tool_id,
          day: dsl.today(context),
        },
      },
      the_loan_lent(context)(input),
      the_waits_of_the_loan(context)(input),
    ],
    the_member_already_has_the_tool_so_nothing_changes: [
      { tool_id: input.tool_id, member_id: input.member_id },
      { tool_id: input.tool_id, member_id: input.member_id },
    ],
  }),
})

/**
 * The member takes up their reservation on its day, the tool lent to them
 * by a loan: a transition of the reservation's life cycle (DOM-19) with no
 * use case of its own, which the loan composes (D111, SC-10).
 */
export const take_up_a_reservation = command({
  input: z.strictObject({
    reservation_id: id.reservation_id,
    tool_id: tools.id.tool_id,
    member_id: id.member_id,
    day: zz.day,
    loan_id: id.loan_id,
  }),
  outcomes: {
    the_reservation_holds_the_tool_for_the_member_today_so_it_is_taken_up: [
      predicate.the_reservation_holds_the_tool_for_the_member_on_the_day,
      fact.a_reservation_has_been_taken_up,
    ],
  },
  creator: () => (input) => ({
    the_reservation_holds_the_tool_for_the_member_today_so_it_is_taken_up: [
      {
        reservation_id: input.reservation_id,
        tool_id: input.tool_id,
        member_id: input.member_id,
        day: input.day,
      },
      {
        taken_up_reservation: {
          id: input.reservation_id,
          progress: { stage: 'taken_up', loan_id: input.loan_id },
        },
      },
    ],
  }),
})

/**
 * The member takes the tool they booked, on its day: Gianni, from the row of
 * his reservation of the drill for Thursday (R8). The desk lends it, as any
 * loan, with its waits, and takes the reservation up: one fact in two parts,
 * the loan's then the reservation's (D111, SC-10). His phone names the
 * reservation, a claim the transition's condition checks against its card:
 * a creator reads no state. A second tap, after the drill went out, records
 * that the reservation was already taken up.
 */
export const lend_a_booked_tool = command({
  input: z.strictObject({
    loan_id: id.loan_id,
    reservation_id: id.reservation_id,
    tool_id: tools.id.tool_id,
    member_id: id.member_id,
  }),
  outcomes: {
    the_member_booked_the_tool_for_today_so_it_is_lent: [
      the_tool_can_be_lent,
      fact.a_tool_has_been_lent,
      pick(effect, 'wait_until_the_eve_of_the_due_date', 'wait_until_the_due_date'),
      composes({ the_reservation_is_taken_up: take_up_a_reservation }),
    ],
    the_member_already_took_the_tool_so_nothing_changes: [
      predicate.the_reservation_of_the_member_has_been_taken_up,
      fact.a_reservation_has_been_taken_up_again,
    ],
  },
  creator: (context) => (input) => ({
    the_member_booked_the_tool_for_today_so_it_is_lent: [
      {
        a_loan_has_not_the_requested_id: { loan_id: input.loan_id },
        a_tool_has_the_requested_id: { tool_id: input.tool_id },
        the_requested_tool_is_in_service: { tool_id: input.tool_id },
        the_requested_tool_is_not_on_loan: { tool_id: input.tool_id },
      },
      the_loan_lent(context)(input),
      the_waits_of_the_loan(context)(input),
      {
        the_reservation_is_taken_up: {
          reservation_id: input.reservation_id,
          tool_id: input.tool_id,
          member_id: input.member_id,
          day: dsl.today(context),
          loan_id: input.loan_id,
        },
      },
    ],
    the_member_already_took_the_tool_so_nothing_changes: [
      { reservation_id: input.reservation_id, member_id: input.member_id },
      { reservation_id: input.reservation_id, member_id: input.member_id },
    ],
  }),
})

/** The tool can be booked for the day. */
export const the_tool_can_be_booked = AND({
  a_reservation_has_not_the_requested_id: NOT(predicate.a_reservation_has_this_id),
  a_tool_has_the_requested_id: predicate.a_tool_has_this_id,
  the_requested_tool_is_in_service: predicate.the_tool_is_in_service,
  the_requested_tool_is_not_booked_that_day: NOT(predicate.the_tool_is_booked_for_the_day),
})

export const reserve_a_tool = command({
  /** The day is validated against the clock: the schema needs today, the context's `now` in its zone, nothing else. */
  input: (context) =>
    z
      .strictObject({
        reservation_id: id.reservation_id,
        tool_id: tools.id.tool_id,
        member_id: id.member_id,
        day: zz.day,
      })
      .refine((input) => dsl.the_day_is_within_the_booking_window(input.day, dsl.today(context)), {
        path: ['day'],
      }),
  outcomes: {
    the_tool_is_free_that_day_so_it_is_booked: [
      the_tool_can_be_booked,
      fact.a_tool_has_been_booked,
    ],
    the_member_already_booked_the_tool_so_nothing_changes: [
      predicate.the_tool_is_booked_for_the_day_by_this_member,
      fact.a_tool_has_been_booked_again,
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

/** The requested loan exists, is ongoing, and lent the tool the member brings back. */
export const the_loan_can_be_returned = AND({
  a_loan_has_the_requested_id: predicate.a_loan_has_this_id,
  the_requested_loan_is_ongoing: predicate.the_loan_is_ongoing,
  the_requested_loan_is_of_the_tool_brought_back: predicate.the_loan_is_of_this_tool,
})

/** The requested loan exists and is already returned. */
export const the_loan_is_already_returned = AND({
  a_loan_has_the_requested_id: predicate.a_loan_has_this_id,
  the_requested_loan_is_returned: predicate.the_loan_is_returned,
})

/**
 * The member brings a tool back, whole or damaged: Marta's drill, damaged,
 * on Tuesday. She says which loan and which tool she holds; the desk checks
 * the tool against the loan's card, and the fact names it, so that a
 * standing order sends a damaged tool to the workshop (`reaction/damage`),
 * reading only the fact (D89.3).
 */
export const return_a_tool = command({
  input: z.strictObject({
    loan_id: id.loan_id,
    tool_id: tools.id.tool_id,
    condition: value.return_condition,
  }),
  outcomes: {
    the_loan_is_ongoing_so_it_is_closed: [the_loan_can_be_returned, fact.a_tool_has_been_returned],
    the_loan_was_already_returned_so_nothing_changes: [
      the_loan_is_already_returned,
      fact.a_tool_has_been_returned_again,
    ],
  },
  creator: (context) => (input) => ({
    the_loan_is_ongoing_so_it_is_closed: [
      {
        a_loan_has_the_requested_id: { loan_id: input.loan_id },
        the_requested_loan_is_ongoing: { loan_id: input.loan_id },
        the_requested_loan_is_of_the_tool_brought_back: {
          loan_id: input.loan_id,
          tool_id: input.tool_id,
        },
      },
      {
        returned_loan: {
          id: input.loan_id,
          tool_id: input.tool_id,
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

/**
 * The member still has the tool the eve reminds of, due on the day it
 * reminds of, and its due date is still ahead: the eve is not late, and
 * the card was neither corrected nor extended since.
 */
export const the_member_can_still_be_reminded = AND({
  a_loan_has_the_requested_id: predicate.a_loan_has_this_id,
  the_requested_loan_is_ongoing: predicate.the_loan_is_ongoing,
  it_is_of_the_tool_reminded: predicate.the_loan_is_of_this_tool,
  it_is_due_on_the_day_reminded: predicate.the_loan_is_due_on_this_day,
  its_due_date_is_still_ahead: predicate.the_due_date_of_the_loan_is_still_ahead,
})

/** The member still has the tool, but the loan was extended since the eve was queued (SC-31). */
export const the_due_day_of_the_ongoing_loan_was_moved = AND({
  a_loan_has_the_requested_id: predicate.a_loan_has_this_id,
  the_requested_loan_is_ongoing: predicate.the_loan_is_ongoing,
  it_is_of_the_tool_reminded: predicate.the_loan_is_of_this_tool,
  it_is_no_longer_due_on_the_day_reminded: NOT(predicate.the_loan_is_due_on_this_day),
})

/** The member still has a tool, but the card names another since the eve was queued (SC-13). */
export const the_tool_of_the_ongoing_loan_was_corrected = AND({
  a_loan_has_the_requested_id: predicate.a_loan_has_this_id,
  the_requested_loan_is_ongoing: predicate.the_loan_is_ongoing,
  it_is_no_longer_of_the_tool_reminded: NOT(predicate.the_loan_is_of_this_tool),
})

/** The member still has the tool, but its due date has passed: the eve came late. */
export const the_due_date_of_the_ongoing_loan_has_passed = AND({
  a_loan_has_the_requested_id: predicate.a_loan_has_this_id,
  the_requested_loan_is_ongoing: predicate.the_loan_is_ongoing,
  its_due_date_has_passed: NOT(predicate.the_due_date_of_the_loan_is_still_ahead),
})

/** The member still has the tool and its due day is not over: the wait for the overdue came early. */
export const the_due_day_of_the_ongoing_loan_is_not_over = AND({
  a_loan_has_the_requested_id: predicate.a_loan_has_this_id,
  the_requested_loan_is_ongoing: predicate.the_loan_is_ongoing,
  its_due_date_is_still_ahead: predicate.the_due_date_of_the_loan_is_still_ahead,
})

/**
 * The return of the eve of the due date (D68.3): the guard is the command's,
 * not the infrastructure's, so a return before the eve meets a branch that
 * records a fact and changes nothing (D95), never a rejection. The eve may
 * come late (the executor was down): no order holds between two effects
 * (D108), so the due date may even have stamped the loan first; the guard
 * reads the due date at the executor's `now`, and a late eve reminds no one
 * (A, 15 Nov 2026). The eve names the tool it was queued for: if the desk
 * corrected the tool on the card since, it reminds of nothing, and the
 * correction queued the eve of the right tool (SC-13); if the loan was
 * extended since, it reminds of nothing either, and the extension queued
 * the eve of the new due day (SC-31). Its input is the
 * payload of the wait, given back by the executor; its operation is the
 * entry's (DOM-14).
 */
export const remind_the_member_of_the_due_date = command({
  input: z.strictObject({
    loan_id: id.loan_id,
    tool_id: tools.id.tool_id,
    member_id: id.member_id,
    due_day: zz.day,
  }),
  outcomes: {
    the_member_still_has_the_tool_before_the_due_date_so_they_are_reminded: [
      the_member_can_still_be_reminded,
      fact.the_member_has_been_reminded_of_the_due_date,
      pick(effect, 'send_the_due_date_reminder'),
    ],
    the_loan_was_returned_so_nothing_changes: [
      the_loan_is_already_returned,
      fact.the_loan_was_returned_before_the_reminder,
    ],
    the_due_date_has_passed_so_nothing_changes: [
      the_due_date_of_the_ongoing_loan_has_passed,
      fact.the_due_date_came_before_the_reminder,
    ],
    the_tool_was_corrected_so_nothing_changes: [
      the_tool_of_the_ongoing_loan_was_corrected,
      fact.the_tool_was_corrected_before_the_reminder,
    ],
    the_due_day_was_moved_so_nothing_changes: [
      the_due_day_of_the_ongoing_loan_was_moved,
      fact.the_due_day_was_moved_before_the_reminder,
    ],
  },
  creator: (context) => (input) => ({
    the_member_still_has_the_tool_before_the_due_date_so_they_are_reminded: [
      {
        a_loan_has_the_requested_id: { loan_id: input.loan_id },
        the_requested_loan_is_ongoing: { loan_id: input.loan_id },
        it_is_of_the_tool_reminded: { loan_id: input.loan_id, tool_id: input.tool_id },
        it_is_due_on_the_day_reminded: { loan_id: input.loan_id, due_day: input.due_day },
        its_due_date_is_still_ahead: { loan_id: input.loan_id, today: dsl.today(context) },
      },
      { loan_id: input.loan_id },
      {
        send_the_due_date_reminder: {
          id: input.loan_id,
          payload: {
            loan_id: input.loan_id,
            tool_id: input.tool_id,
            member_id: input.member_id,
            due_day: input.due_day,
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
    the_due_date_has_passed_so_nothing_changes: [
      {
        a_loan_has_the_requested_id: { loan_id: input.loan_id },
        the_requested_loan_is_ongoing: { loan_id: input.loan_id },
        its_due_date_has_passed: { loan_id: input.loan_id, today: dsl.today(context) },
      },
      { loan_id: input.loan_id },
    ],
    the_tool_was_corrected_so_nothing_changes: [
      {
        a_loan_has_the_requested_id: { loan_id: input.loan_id },
        the_requested_loan_is_ongoing: { loan_id: input.loan_id },
        it_is_no_longer_of_the_tool_reminded: { loan_id: input.loan_id, tool_id: input.tool_id },
      },
      { loan_id: input.loan_id, tool_id: input.tool_id },
    ],
    the_due_day_was_moved_so_nothing_changes: [
      {
        a_loan_has_the_requested_id: { loan_id: input.loan_id },
        the_requested_loan_is_ongoing: { loan_id: input.loan_id },
        it_is_of_the_tool_reminded: { loan_id: input.loan_id, tool_id: input.tool_id },
        it_is_no_longer_due_on_the_day_reminded: {
          loan_id: input.loan_id,
          due_day: input.due_day,
        },
      },
      { loan_id: input.loan_id, due_day: input.due_day },
    ],
  }),
})

/**
 * The return of the due date (D68.3), guarded as the reminder: if the member
 * still has the tool after the due day, the loan is stamped overdue and stays
 * ongoing; if the tool is back, nothing changes (D95); if the due day is not
 * over, the desk waits again, until the start of the day after today. The
 * guard reads the day at the executor's `now`: a wait queued when a loan was
 * due at an instant (1.x) goes on the due day itself, and the translation of
 * the entry touches its payload, never when it goes (DOM-22). Marta's drill,
 * due at 10:12 on 16 November, becomes overdue on the 17th, as Gianni's
 * ladder after its due day (A, 17 Nov 2026). Its input is the payload of the
 * wait; its operation is the entry's (DOM-14), so a second delivery of the
 * wait is a duplicate, not a second stamp.
 */
export const declare_the_loan_overdue = command({
  input: z.strictObject({
    loan_id: id.loan_id,
  }),
  outcomes: {
    the_member_still_has_the_tool_after_the_due_day_so_the_loan_is_overdue: [
      the_due_date_of_the_ongoing_loan_has_passed,
      fact.a_loan_has_become_overdue,
    ],
    the_loan_was_returned_so_nothing_changes: [
      the_loan_is_already_returned,
      fact.the_loan_was_returned_before_it_became_overdue,
    ],
    the_due_day_is_not_over_so_the_desk_waits_until_the_day_after: [
      the_due_day_of_the_ongoing_loan_is_not_over,
      fact.the_overdue_check_has_been_put_off,
      pick(effect, 'wait_until_the_due_date'),
    ],
  },
  creator: (context) => (input) => ({
    the_member_still_has_the_tool_after_the_due_day_so_the_loan_is_overdue: [
      {
        a_loan_has_the_requested_id: { loan_id: input.loan_id },
        the_requested_loan_is_ongoing: { loan_id: input.loan_id },
        its_due_date_has_passed: { loan_id: input.loan_id, today: dsl.today(context) },
      },
      {
        overdue_loan: {
          id: input.loan_id,
          progress: { stage: 'ongoing', term: 'overdue' },
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
    the_due_day_is_not_over_so_the_desk_waits_until_the_day_after: [
      {
        a_loan_has_the_requested_id: { loan_id: input.loan_id },
        the_requested_loan_is_ongoing: { loan_id: input.loan_id },
        its_due_date_is_still_ahead: { loan_id: input.loan_id, today: dsl.today(context) },
      },
      { loan_id: input.loan_id },
      {
        wait_until_the_due_date: {
          id: dsl.the_wait_for_the_overdue_put_off_on_a_day({
            loan_id: input.loan_id,
            day: dsl.today(context),
          }),
          payload: { loan_id: input.loan_id },
          not_before: zz.start_of(context.time_zone)(dsl.the_day_after(dsl.today(context))),
        },
      },
    ],
  }),
})

/** The desk has not yet begun cancelling the reservations of the tool. */
export const no_cancellation_of_the_reservations_of_the_tool_has_begun = NOT(
  predicate.a_cancellation_of_the_reservations_of_the_tool_has_begun,
)

/**
 * The desk opens its work sheet for the reservations of a tool that can no
 * longer be lent: Luca retired the ladder, and a reaction brings the news
 * (DOM-16). A set chosen by a condition is never changed by one fact: the
 * sheet is a process with a cursor, one reservation a step (DOM-20, D97,
 * D112, D113.4): `continue_the_cancellation_of_reservations`. A second sheet for one tool
 * is no expected occurrence (a redelivery is the duplicate branch, DOM-11):
 * a rejection, which a reaction sends to its dead letter, in sight.
 */
export const cancel_the_reservations_of_a_tool = command({
  input: z.strictObject({
    tool_id: tools.id.tool_id,
  }),
  outcomes: {
    no_cancellation_has_begun_so_one_begins: [
      no_cancellation_of_the_reservations_of_the_tool_has_begun,
      fact.the_cancellation_of_the_reservations_of_a_tool_has_begun,
    ],
  },
  creator: (context) => (input) => ({
    no_cancellation_has_begun_so_one_begins: [
      { tool_id: input.tool_id },
      {
        new_cancellation: {
          tool_id: input.tool_id,
          start_date: context.now,
          progress: { stage: 'cancelling' },
        },
      },
    ],
  }),
})

/**
 * The desk cancels a reservation that still holds the tool. A transition of
 * the reservation's life cycle (DOM-19) with no use case of its own: no one
 * cancels a reservation by itself yet; the work sheet composes it into its
 * step (D111).
 */
export const cancel_a_reservation = command({
  input: z.strictObject({
    reservation_id: id.reservation_id,
  }),
  outcomes: {
    the_reservation_is_booked_so_it_is_cancelled: [
      predicate.the_reservation_is_booked,
      fact.a_reservation_has_been_cancelled,
    ],
  },
  creator: (context) => (input) => ({
    the_reservation_is_booked_so_it_is_cancelled: [
      { reservation_id: input.reservation_id },
      {
        cancelled_reservation: {
          id: input.reservation_id,
          progress: { stage: 'cancelled', cancellation_date: context.now },
        },
      },
    ],
  }),
})

/**
 * The reservations still ahead for a tool: booked, of the tool, from the day
 * on. The desk goes through them on both its sheets: the cancellation of a
 * retired tool's reservations, and the round of the notices of a repair.
 */
export const the_reservation_is_still_ahead_for_the_tool = AND({
  the_reservation_is_booked: reservation_selection.the_reservation_is_booked,
  the_reservation_is_of_the_tool: reservation_selection.the_reservation_is_of_this_tool,
  the_day_has_not_passed: reservation_selection.the_reservation_is_from_this_day_on,
})

/**
 * The desk takes the next reservation on its work sheet and cancels it, or,
 * none left, closes the sheet (DOM-20, D112.2): the ladder is retired, the
 * first step cancels Marta's Saturday, the second Gianni's Sunday, the third
 * closes. The reservations still ahead from the day the sheet was opened,
 * the closest day first, then by id (D109); the cursor the library keeps on
 * the sheet marks where the desk stands, so that a step delivered again is
 * the same step (DOM-11), and one reservation is cancelled once.
 */
export const continue_the_cancellation_of_reservations = cursor_step({
  input: z.strictObject({
    tool_id: tools.id.tool_id,
  }),
  reads: value.cancellation_under_way,
  fields: value.booked_reservation,
  identity: 'id',
  selection: the_reservation_is_still_ahead_for_the_tool,
  order: { day: 'ascending' },
  composes: cancel_a_reservation,
  outcomes: {
    advances: fact.the_cancellation_has_advanced,
    completes: fact.the_cancellation_of_the_reservations_of_a_tool_has_ended,
  },
  creator: (context) => () => (sheet) => ({
    selection: {
      the_reservation_is_booked: {},
      the_reservation_is_of_the_tool: { tool_id: sheet.tool_id },
      the_day_has_not_passed: { day: zz.day_of(context.time_zone)(sheet.start_date) },
    },
    composes: (reservation) => ({ reservation_id: reservation.id }),
    advances: { tool_id: sheet.tool_id },
    completes: {
      completed_cancellation: {
        tool_id: sheet.tool_id,
        progress: { stage: 'complete', end_date: context.now },
      },
    },
  }),
})

/** The desk has not yet begun its round of the notices of the repair. */
export const no_notice_round_of_the_repair_has_begun = NOT(
  predicate.the_notice_round_of_the_repair_has_begun,
)

/**
 * The desk begins its round of the notices of a repair: the drill went to
 * the workshop on Tuesday, and a reaction brings the news (DOM-16). The
 * members who booked it are notified one at a time, by the steps of the
 * round (DOM-20, D97, D112): `continue_the_repair_notice_round`; their
 * reservations stay, and on the day a tool still in repair is refused to the
 * borrower (`the_tool_is_in_service`). A second round for one stay in repair
 * is no expected occurrence (a redelivery is the duplicate branch, DOM-11):
 * a rejection, to the reaction's dead letter.
 */
export const notify_the_members_of_a_repair = command({
  input: z.strictObject({
    repair_id: tools.id.repair_id,
    tool_id: tools.id.tool_id,
  }),
  outcomes: {
    no_round_has_begun_so_one_begins: [
      no_notice_round_of_the_repair_has_begun,
      fact.a_repair_notice_round_has_begun,
    ],
  },
  creator: (context) => (input) => ({
    no_round_has_begun_so_one_begins: [
      { repair_id: input.repair_id },
      {
        new_round: {
          repair_id: input.repair_id,
          tool_id: input.tool_id,
          start_date: context.now,
          progress: { stage: 'notifying' },
        },
      },
    ],
  }),
})

/**
 * The desk notifies the member who booked a tool that it is in repair; the
 * reservation stays. A transition of the reservation's life cycle (DOM-19)
 * that changes nothing in the state (D95): it records the notice and queues
 * it toward the world (DOM-13). With no use case of its own: the round
 * composes it into its step (D111), and gives it, from the reservation the
 * step read, the member, the tool and the day the notice carries, since a
 * creator reads no state.
 */
export const notify_a_member_of_the_repair = command({
  input: z.strictObject({
    reservation_id: id.reservation_id,
    repair_id: tools.id.repair_id,
    member_id: id.member_id,
    tool_id: tools.id.tool_id,
    day: zz.day,
  }),
  outcomes: {
    the_reservation_is_booked_so_its_member_is_notified: [
      predicate.the_reservation_is_booked,
      fact.a_member_has_been_notified_of_the_repair,
      pick(effect, 'send_the_repair_notice'),
    ],
  },
  creator: () => (input) => ({
    the_reservation_is_booked_so_its_member_is_notified: [
      { reservation_id: input.reservation_id },
      { reservation_id: input.reservation_id, repair_id: input.repair_id },
      {
        send_the_repair_notice: {
          id: dsl.the_notice_of_the_repair_to_the_reservation({
            repair_id: input.repair_id,
            reservation_id: input.reservation_id,
          }),
          payload: {
            reservation_id: input.reservation_id,
            member_id: input.member_id,
            tool_id: input.tool_id,
            day: input.day,
          },
        },
      },
    ],
  }),
})

/**
 * The desk takes the next member on its round of the notices of a repair
 * and notifies them, or, none left, closes the round (DOM-20, D112.2): the
 * drill went to repair on Tuesday, the first step notifies Gianni, booked
 * for Thursday, the second Paolo, booked three weeks on, the third closes. A
 * reservation cancelled in the meantime (the drill retired beyond repair,
 * its own sheet at work) is no longer booked: it leaves the selection, and
 * its member is not notified.
 */
export const continue_the_repair_notice_round = cursor_step({
  input: z.strictObject({
    repair_id: tools.id.repair_id,
  }),
  reads: value.repair_notice_round_under_way,
  fields: value.booked_reservation,
  identity: 'id',
  selection: the_reservation_is_still_ahead_for_the_tool,
  order: { day: 'ascending' },
  composes: notify_a_member_of_the_repair,
  outcomes: {
    advances: fact.the_repair_notice_round_has_advanced,
    completes: fact.the_repair_notice_round_has_ended,
  },
  creator: (context) => () => (round) => ({
    selection: {
      the_reservation_is_booked: {},
      the_reservation_is_of_the_tool: { tool_id: round.tool_id },
      the_day_has_not_passed: { day: zz.day_of(context.time_zone)(round.start_date) },
    },
    composes: (reservation) => ({
      reservation_id: reservation.id,
      repair_id: round.repair_id,
      member_id: reservation.member_id,
      tool_id: reservation.tool_id,
      day: reservation.day,
    }),
    advances: { repair_id: round.repair_id },
    completes: {
      completed_round: {
        repair_id: round.repair_id,
        progress: { stage: 'complete', end_date: context.now },
      },
    },
  }),
})

/** The desk sends this member no week's summary yet. */
export const no_weekly_summary_goes_to_the_member = AND({
  no_summary_goes_to_the_requested_member: NOT(predicate.a_weekly_summary_goes_to_the_member),
})

/** The desk already sends this member the week's summary. */
export const a_weekly_summary_already_goes_to_the_member = AND({
  a_summary_goes_to_the_requested_member: predicate.a_weekly_summary_goes_to_the_member,
})

/**
 * A member asks the desk for the week's summary every Monday (SC-43): the
 * summary begins and waits for the next Monday, at the start of the shed's
 * day; its id, the member and that Monday, one wait per member and Monday
 * (D48). Asked again, nothing changes (D95): no second chain of waits.
 */
export const begin_a_weekly_summary = command({
  input: z.strictObject({
    member_id: id.member_id,
  }),
  outcomes: {
    no_summary_goes_to_the_member_so_one_begins: [
      no_weekly_summary_goes_to_the_member,
      fact.a_weekly_summary_has_begun,
      pick(effect, 'wait_until_monday'),
    ],
    a_summary_already_goes_to_the_member_so_nothing_changes: [
      a_weekly_summary_already_goes_to_the_member,
      fact.a_weekly_summary_has_begun_again,
    ],
  },
  creator: (context) => (input) => ({
    no_summary_goes_to_the_member_so_one_begins: [
      { no_summary_goes_to_the_requested_member: { member_id: input.member_id } },
      {
        new_summary: {
          member_id: input.member_id,
          next_monday: dsl.the_monday_after(dsl.today(context)),
        },
      },
      {
        wait_until_monday: {
          id: dsl.the_summary_of_the_week_of_a_member({
            member_id: input.member_id,
            monday: dsl.the_monday_after(dsl.today(context)),
          }),
          payload: {
            member_id: input.member_id,
            monday: dsl.the_monday_after(dsl.today(context)),
          },
          not_before: zz.start_of(context.time_zone)(dsl.the_monday_after(dsl.today(context))),
        },
      },
    ],
    a_summary_already_goes_to_the_member_so_nothing_changes: [
      { a_summary_goes_to_the_requested_member: { member_id: input.member_id } },
      { member_id: input.member_id },
    ],
  }),
})

/** The week of the Monday the member's summary waits for is not over: the summary goes. */
export const the_week_of_the_summary_is_on = AND({
  a_summary_goes_to_the_requested_member: predicate.a_weekly_summary_goes_to_the_member,
  its_week_is_not_over: predicate.the_week_of_the_summary_is_not_over,
})

/** The week of the Monday the member's summary waits for is over: the wait came late. */
export const the_week_of_the_summary_is_over = AND({
  a_summary_goes_to_the_requested_member: predicate.a_weekly_summary_goes_to_the_member,
  its_week_is_over: NOT(predicate.the_week_of_the_summary_is_not_over),
})

/**
 * On a Monday the effect executor comes back (DOM-13), and the desk sums up
 * the week for the member: it sends the week's summary and waits for the
 * next Monday, the first after the executor's `now`: a wait whose return
 * queues the next (SC-43). An entry goes late, never skipped (DOM-13): a
 * wait that comes after its week is over sends no summary of a past week
 * (D95), and awaits the Monday of the current week, which is past, so it
 * goes at once and tells this week; after a downtime of three weeks the
 * member gets one summary, of the week they are in, never one per week
 * missed. Each wait's id is the member and its Monday (D48), so a Monday's
 * return delivered twice is the duplicate branch (DOM-11), never a second
 * chain. Its input is the payload of the wait, given back by the executor;
 * its operation is the entry's (DOM-14).
 */
export const sum_up_the_week_for_the_member = command({
  input: z.strictObject({
    member_id: id.member_id,
    monday: zz.day,
  }),
  outcomes: {
    the_week_is_on_so_the_summary_goes: [
      the_week_of_the_summary_is_on,
      fact.the_weeks_summary_has_been_sent,
      pick(effect, 'send_the_weeks_summary', 'wait_until_monday'),
    ],
    the_week_is_over_so_this_weeks_monday_is_awaited: [
      the_week_of_the_summary_is_over,
      fact.a_past_weeks_summary_has_been_skipped,
      pick(effect, 'wait_until_monday'),
    ],
  },
  creator: (context) => (input) => ({
    the_week_is_on_so_the_summary_goes: [
      {
        a_summary_goes_to_the_requested_member: { member_id: input.member_id },
        its_week_is_not_over: { member_id: input.member_id, today: dsl.today(context) },
      },
      {
        member_id: input.member_id,
        monday: input.monday,
        next_monday: dsl.the_monday_after(dsl.today(context)),
      },
      {
        send_the_weeks_summary: {
          id: dsl.the_summary_of_the_week_of_a_member(input),
          payload: { member_id: input.member_id, monday: input.monday },
        },
        wait_until_monday: {
          id: dsl.the_summary_of_the_week_of_a_member({
            member_id: input.member_id,
            monday: dsl.the_monday_after(dsl.today(context)),
          }),
          payload: {
            member_id: input.member_id,
            monday: dsl.the_monday_after(dsl.today(context)),
          },
          not_before: zz.start_of(context.time_zone)(dsl.the_monday_after(dsl.today(context))),
        },
      },
    ],
    the_week_is_over_so_this_weeks_monday_is_awaited: [
      {
        a_summary_goes_to_the_requested_member: { member_id: input.member_id },
        its_week_is_over: { member_id: input.member_id, today: dsl.today(context) },
      },
      {
        member_id: input.member_id,
        monday: input.monday,
        next_monday: dsl.the_monday_of_the_week_of(dsl.today(context)),
      },
      {
        wait_until_monday: {
          id: dsl.the_summary_of_the_week_of_a_member({
            member_id: input.member_id,
            monday: dsl.the_monday_of_the_week_of(dsl.today(context)),
          }),
          payload: {
            member_id: input.member_id,
            monday: dsl.the_monday_of_the_week_of(dsl.today(context)),
          },
          not_before: zz.start_of(context.time_zone)(
            dsl.the_monday_of_the_week_of(dsl.today(context)),
          ),
        },
      },
    ],
  }),
})
