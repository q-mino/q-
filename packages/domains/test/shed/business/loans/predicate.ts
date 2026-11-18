import { z } from 'zod'
import * as wlib from '../../wlib.ts'
import { predicate, id, tools } from './_scope_predicate.ts'

// The vocabulary of the conditions of `loans`, over its own view of the
// tools too (GR-3, V11): the state adapter reads them from `tools`.

/** The shed has a tool with this id. */
export const a_tool_has_this_id = predicate({
  parameters: z.strictObject({
    tool_id: tools.id.tool_id,
  }),
})

/** The tool can go out: it is in service in the shed. */
export const the_tool_is_in_service = predicate({
  parameters: z.strictObject({
    tool_id: tools.id.tool_id,
  }),
})

export const a_loan_has_this_id = predicate({
  parameters: z.strictObject({
    loan_id: id.loan_id,
  }),
})

export const the_loan_is_ongoing = predicate({
  parameters: z.strictObject({
    loan_id: id.loan_id,
  }),
})

export const the_loan_is_returned = predicate({
  parameters: z.strictObject({
    loan_id: id.loan_id,
  }),
})

/**
 * The loan is of this tool: the tool the member brings back is the one
 * the loan lent. The member says which tool they hold, the desk checks it
 * against the loan's card (A, 16 Nov 2026 (4)).
 */
export const the_loan_is_of_this_tool = predicate({
  parameters: z.strictObject({
    loan_id: id.loan_id,
    tool_id: tools.id.tool_id,
  }),
})

/** The loan's card names this member (SC-13): a claim of whoever corrects it. */
export const the_loan_is_of_this_member = predicate({
  parameters: z.strictObject({
    loan_id: id.loan_id,
    member_id: id.member_id,
  }),
})

/** The loan's card says it is due on this day (SC-13): a claim of whoever corrects it. */
export const the_loan_is_due_on_this_day = predicate({
  parameters: z.strictObject({
    loan_id: id.loan_id,
    due_day: wlib.day,
  }),
})

/**
 * The due date on the loan's card is still ahead at an instant: "bring it
 * back tomorrow" is still true. The instant is a parameter, the clock of
 * whoever asks (GR-8): time is not a fact (D92.4), the due date is.
 */
export const the_due_date_of_the_loan_is_still_ahead = predicate({
  parameters: z.strictObject({
    loan_id: id.loan_id,
    now: wlib.date_time,
  }),
})

/** The tool is with a member, whoever it is. */
export const the_tool_is_on_loan = predicate({
  parameters: z.strictObject({
    tool_id: tools.id.tool_id,
  }),
})

/** The tool is with this member. */
export const the_tool_is_on_loan_to_this_member = predicate({
  parameters: z.strictObject({
    tool_id: tools.id.tool_id,
    member_id: id.member_id,
  }),
})

export const a_reservation_has_this_id = predicate({
  parameters: z.strictObject({
    reservation_id: id.reservation_id,
  }),
})

/** The reservation holds the tool for its day: it can still be cancelled. */
export const the_reservation_is_booked = predicate({
  parameters: z.strictObject({
    reservation_id: id.reservation_id,
  }),
})

/**
 * The reservation holds this tool for this member on this day: Gianni's R8,
 * the drill, Thursday. The member's phone names the reservation, and the
 * desk checks it against its card (SC-10).
 */
export const the_reservation_holds_the_tool_for_the_member_on_the_day = predicate({
  parameters: z.strictObject({
    reservation_id: id.reservation_id,
    tool_id: tools.id.tool_id,
    member_id: id.member_id,
    day: wlib.day,
  }),
})

/** The member's reservation has been taken up: they took the tool on its day. */
export const the_reservation_of_the_member_has_been_taken_up = predicate({
  parameters: z.strictObject({
    reservation_id: id.reservation_id,
    member_id: id.member_id,
  }),
})

/** The tool is booked for the day, by whoever. */
export const the_tool_is_booked_for_the_day = predicate({
  parameters: z.strictObject({
    tool_id: tools.id.tool_id,
    day: wlib.day,
  }),
})

/**
 * The tool is booked for a day from today up to this one, by whoever: a loan
 * that would keep it out until then takes a booked day from someone (SC-31).
 */
export const the_tool_is_booked_on_a_day_up_to = predicate({
  parameters: z.strictObject({
    tool_id: tools.id.tool_id,
    day: wlib.day,
  }),
})

/** The tool is booked for the day by this member. */
export const the_tool_is_booked_for_the_day_by_this_member = predicate({
  parameters: z.strictObject({
    tool_id: tools.id.tool_id,
    day: wlib.day,
    member_id: id.member_id,
  }),
})

/** The desk has begun cancelling the reservations of the tool. */
export const a_cancellation_of_the_reservations_of_the_tool_has_begun = predicate({
  parameters: z.strictObject({
    tool_id: tools.id.tool_id,
  }),
})

/** The desk has begun its round of the notices of the repair. */
export const the_notice_round_of_the_repair_has_begun = predicate({
  parameters: z.strictObject({
    repair_id: tools.id.repair_id,
  }),
})

/** The desk sends this member the week's summary every Monday (SC-43). */
export const a_weekly_summary_goes_to_the_member = predicate({
  parameters: z.strictObject({
    member_id: id.member_id,
  }),
})

/**
 * The week of the Monday the member's summary waits for is not over at this
 * instant: a summary sent in its week still tells the week (SC-43).
 */
export const the_week_of_the_summary_is_not_over = predicate({
  parameters: z.strictObject({
    member_id: id.member_id,
    now: wlib.date_time,
  }),
})
