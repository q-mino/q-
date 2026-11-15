import { z } from 'zod'
import * as wlib from '../../wlib.ts'
import { fact, id, value, tools } from './_scope_fact.ts'

/** Carries the change of state (DOM-5, V9): the whole new loan. */
export const a_tool_has_been_lent = fact({
  payload: z.strictObject({
    new_loan: value.ongoing_loan,
  }),
})

/** Nothing to do (DOM-6): the member's ongoing loan of the tool stands. */
export const the_member_already_has_the_tool = fact({
  payload: z.strictObject({
    tool_id: tools.id.tool_id,
    member_id: id.member_id,
  }),
})

/** Carries the change of state (DOM-5, V9): the whole new reservation. */
export const a_tool_has_been_booked = fact({
  payload: z.strictObject({
    new_reservation: value.booked_reservation,
  }),
})

/** Nothing to do (DOM-6): the member's reservation of the tool for the day stands. */
export const the_member_already_booked_the_tool = fact({
  payload: z.strictObject({
    tool_id: tools.id.tool_id,
    day: wlib.day,
    member_id: id.member_id,
  }),
})

/**
 * A partial value: the loan's id and its new stage, whole. Tool, member and
 * dates stay as they were. Late or damaged are values of the return, not
 * other facts, until the business language needs them apart.
 */
export const a_tool_has_been_returned = fact({
  payload: z.strictObject({
    returned_loan: value.returned_loan.pick({ id: true, progress: true }),
  }),
})

/** Nothing to do (DOM-6): the first return stands. */
export const the_loan_was_already_returned = fact({
  payload: z.strictObject({
    loan_id: id.loan_id,
  }),
})

/** The eve of the due date came while the member had the tool: the reminder is on its way. Nothing changes in the state (D95). */
export const the_member_has_been_reminded_of_the_due_date = fact({
  payload: z.strictObject({
    loan_id: id.loan_id,
  }),
})

/** Nothing to do (DOM-6, D95): the eve came after the return, and no reminder goes. */
export const the_loan_was_returned_before_the_reminder = fact({
  payload: z.strictObject({
    loan_id: id.loan_id,
  }),
})

/**
 * Nothing to do (DOM-6, D95): the eve was delivered after the due date (the
 * executor was down, or behind), and "bring it back tomorrow" would be
 * false. No reminder goes; the overdue stamp is the due date's to give.
 */
export const the_due_date_came_before_the_reminder = fact({
  payload: z.strictObject({
    loan_id: id.loan_id,
  }),
})

/**
 * The due date came while the member had the tool: the loan's card is
 * stamped overdue. A partial value, as a return: the loan's id and its new
 * progress, whole; the loan stays ongoing, in "my loans".
 */
export const a_loan_has_become_overdue = fact({
  payload: z.strictObject({
    overdue_loan: value.overdue_loan.pick({ id: true, progress: true }),
  }),
})

/**
 * Nothing to do (DOM-6, D95): the tool was back when the due date was
 * checked. Late or on time is the return's, derived from its date (dsl).
 */
export const the_loan_was_returned_before_it_became_overdue = fact({
  payload: z.strictObject({
    loan_id: id.loan_id,
  }),
})

/**
 * The desk has opened its work sheet for the tool's reservations (D97,
 * D112): the whole new cancellation. Its steps, one reservation each, come
 * with part 2 of step 8.
 */
export const the_cancellation_of_the_reservations_of_a_tool_has_begun = fact({
  payload: z.strictObject({
    new_cancellation: value.cancellation_under_way,
  }),
})
