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
export const a_tool_has_been_lent_again = fact({
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
export const a_tool_has_been_booked_again = fact({
  payload: z.strictObject({
    tool_id: tools.id.tool_id,
    day: wlib.day,
    member_id: id.member_id,
  }),
})

/**
 * A partial value: the loan's id, the tool it lent and its new stage,
 * whole; member and dates stay as they were. Late or damaged are values of
 * the return, not other facts (A, 16 Nov 2026 (4)): a standing order that
 * cares for the damaged ones translates the others to nothing (D88.2).
 */
export const a_tool_has_been_returned = fact({
  payload: z.strictObject({
    returned_loan: value.returned_loan.pick({ id: true, tool_id: true, progress: true }),
  }),
})

/** Nothing to do (DOM-6): the first return stands. */
export const a_tool_has_been_returned_again = fact({
  payload: z.strictObject({
    loan_id: id.loan_id,
  }),
})

/**
 * The desk wrote the wrong tool on the loan's card, and corrects it (SC-13):
 * a partial value, the loan's id and the tool the member has, which the
 * state takes; and the tool the card named, for the record. The fact of the
 * loan stays as it was recorded: a mistake is corrected by a fact, never by
 * one removed (DOM-22, D101).
 */
export const the_tool_of_a_loan_has_been_corrected = fact({
  payload: z.strictObject({
    corrected_loan: value.loan.pick({ id: true, tool_id: true }),
    tool_named_before: tools.id.tool_id,
  }),
})

/**
 * The member keeps the tool longer (SC-31): a partial value, the loan's id
 * and its new due day, which the state takes. The term stays running.
 */
export const a_loan_has_been_extended = fact({
  payload: z.strictObject({
    extended_loan: value.loan.pick({ id: true, due_day: true }),
  }),
})

/**
 * Nothing to do (DOM-6, D95): the eve came for a due day the loan no longer
 * has, since it was extended; the extension queued the eve of its new due
 * day (SC-31).
 */
export const the_due_day_was_moved_before_the_reminder = fact({
  payload: z.strictObject({
    loan_id: id.loan_id,
    due_day: wlib.day,
  }),
})

/** Nothing to do (DOM-6): the card already names the tool the member has. */
export const the_tool_of_a_loan_has_been_corrected_again = fact({
  payload: z.strictObject({
    loan_id: id.loan_id,
    tool_id: tools.id.tool_id,
  }),
})

/**
 * Nothing to do (DOM-6, D95): the eve came for the tool the card named
 * before a correction, and no reminder goes for it; the correction queued
 * the eve of the tool the member has (SC-13).
 */
export const the_tool_was_corrected_before_the_reminder = fact({
  payload: z.strictObject({
    loan_id: id.loan_id,
    tool_id: tools.id.tool_id,
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
 * Not yet (D68.3, D95): the wait for the overdue came while the due day was
 * not over, so the desk waits again, until the day after. A wait queued when
 * a loan was due at an instant (1.x) goes at that instant, on the due day
 * itself: Marta's drill, due at 10:12 on 16 November, is on time until that
 * day ends (A, 17 Nov 2026).
 */
export const the_overdue_check_has_been_put_off = fact({
  payload: z.strictObject({
    loan_id: id.loan_id,
  }),
})

/**
 * The desk has opened its work sheet for the tool's reservations (D97,
 * D112): the whole new cancellation. Its steps cancel one reservation each.
 */
export const the_cancellation_of_the_reservations_of_a_tool_has_begun = fact({
  payload: z.strictObject({
    new_cancellation: value.cancellation_under_way,
  }),
})

/**
 * The desk cancelled a reservation: a partial value, as a return, the
 * reservation's id and its new progress, whole. Recorded as a part of a step
 * of the work sheet (D111), not alone: no one cancels a reservation by
 * itself yet.
 */
export const a_reservation_has_been_cancelled = fact({
  payload: z.strictObject({
    cancelled_reservation: value.cancelled_reservation.pick({ id: true, progress: true }),
  }),
})

/**
 * The member took the tool on the day they booked it: a partial value, as a
 * return, the reservation's id and its new progress, whole, with the loan
 * that took it up. Recorded as a part of the loan's fact (D111, SC-10), never
 * alone: the reservation is taken up by a loan.
 */
export const a_reservation_has_been_taken_up = fact({
  payload: z.strictObject({
    taken_up_reservation: value.taken_up_reservation.pick({ id: true, progress: true }),
  }),
})

/** Nothing to do (DOM-6): the member already took the tool they booked; the loan stands. */
export const a_reservation_has_been_taken_up_again = fact({
  payload: z.strictObject({
    reservation_id: id.reservation_id,
    member_id: id.member_id,
  }),
})

/**
 * The desk went one reservation further on the work sheet of the tool: the
 * step's part (D111, D112.2), beside the cancellation it applied. A partial
 * value: the sheet stays under way, its cursor at the reservation handled,
 * written by the library (DOM-20).
 */
export const the_cancellation_has_advanced = fact({
  payload: z.strictObject({
    tool_id: tools.id.tool_id,
    cursor: wlib.cursor,
  }),
})

/** No reservation of the tool is left ahead: the desk closes its work sheet (D112.2). */
export const the_cancellation_of_the_reservations_of_a_tool_has_ended = fact({
  payload: z.strictObject({
    completed_cancellation: value.completed_cancellation.pick({ tool_id: true, progress: true }),
  }),
})

/**
 * The desk has begun its round of the notices of a repair (D97, D112): the
 * whole new round. Its steps notify one member each.
 */
export const a_repair_notice_round_has_begun = fact({
  payload: z.strictObject({
    new_round: value.repair_notice_round_under_way,
  }),
})

/**
 * The desk notified a member that the tool they booked is in repair: the
 * reservation, which stays, and the stay in repair. Nothing changes in the
 * state (D95): the notice is on its way. Recorded as a part of a step of the
 * round (D111). Its resource is its target alone, the reservation (D94.6,
 * SC-55): the stay is the round's, and a dead notice holds its member's
 * reservation, not the round's other notices.
 */
export const a_member_has_been_notified_of_the_repair = fact({
  payload: z.strictObject({
    reservation_id: id.reservation_id,
    repair_id: tools.id.repair_id,
  }),
  resources: ['reservation_id'],
})

/**
 * The desk went one member further on the round of the notices of a repair:
 * the step's part (D111, D112.2), beside the notice it recorded. A partial
 * value: the round stays under way, its cursor at the reservation handled,
 * written by the library (DOM-20).
 */
export const the_repair_notice_round_has_advanced = fact({
  payload: z.strictObject({
    repair_id: tools.id.repair_id,
    cursor: wlib.cursor,
  }),
})

/** No reservation of the tool is left ahead: the desk closes its round of notices (D112.2). */
export const the_repair_notice_round_has_ended = fact({
  payload: z.strictObject({
    completed_round: value.completed_repair_notice_round.pick({ repair_id: true, progress: true }),
  }),
})

/**
 * The desk will send a member the week's summary every Monday, as they
 * asked: the summary, waiting for the next Monday (SC-43).
 */
export const a_weekly_summary_has_begun = fact({
  payload: z.strictObject({
    new_summary: value.weekly_summary,
  }),
})

/** The member asked again for the week's summary they already get: nothing changes (D95). */
export const a_weekly_summary_has_begun_again = fact({
  payload: z.strictObject({
    member_id: id.member_id,
  }),
})

/**
 * On a Monday the desk sent a member the week's summary, and waits for the
 * next Monday: the Monday sent, and the one now awaited (SC-43).
 */
export const the_weeks_summary_has_been_sent = fact({
  payload: z.strictObject({
    member_id: id.member_id,
    monday: wlib.day,
    next_monday: wlib.day,
  }),
})

/**
 * The Monday's wait came after its week was over (the executor was down):
 * no summary of a past week; the desk awaits the Monday of the current
 * week, which goes at once (SC-43, D95).
 */
export const a_past_weeks_summary_has_been_skipped = fact({
  payload: z.strictObject({
    member_id: id.member_id,
    monday: wlib.day,
    next_monday: wlib.day,
  }),
})
