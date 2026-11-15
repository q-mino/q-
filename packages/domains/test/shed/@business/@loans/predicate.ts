import { z } from 'zod'
import { tool_id } from '../@tools/_id.ts'
import * as wlib from '../../wlib.ts'
import here, { id } from './_here_predicate.ts'

// The vocabulary of the conditions of `loans`, over its own view of the
// tools too (GR-3, V11): the state adapter reads them from `tools`.

/** The shed has a tool with this id. */
export const a_tool_has_this_id = here.predicate({
  parameters: z.strictObject({
    tool_id: tool_id,
  }),
})

/** The tool can go out: it is in service in the shed. */
export const the_tool_is_in_service = here.predicate({
  parameters: z.strictObject({
    tool_id: tool_id,
  }),
})

export const a_loan_has_this_id = here.predicate({
  parameters: z.strictObject({
    loan_id: id.loan_id,
  }),
})

export const the_loan_is_ongoing = here.predicate({
  parameters: z.strictObject({
    loan_id: id.loan_id,
  }),
})

export const the_loan_is_returned = here.predicate({
  parameters: z.strictObject({
    loan_id: id.loan_id,
  }),
})

/**
 * The due date on the loan's card is still ahead at an instant: "bring it
 * back tomorrow" is still true. The instant is a parameter, the clock of
 * whoever asks (GR-8): time is not a fact (D92.4), the due date is.
 */
export const the_due_date_of_the_loan_is_still_ahead = here.predicate({
  parameters: z.strictObject({
    loan_id: id.loan_id,
    now: wlib.date_time_string,
  }),
})

/** The tool is with a member, whoever it is. */
export const the_tool_is_on_loan = here.predicate({
  parameters: z.strictObject({
    tool_id: tool_id,
  }),
})

/** The tool is with this member. */
export const the_tool_is_on_loan_to_this_member = here.predicate({
  parameters: z.strictObject({
    tool_id: tool_id,
    member_id: id.member_id,
  }),
})

export const a_reservation_has_this_id = here.predicate({
  parameters: z.strictObject({
    reservation_id: id.reservation_id,
  }),
})

/** The tool is booked for the day, by whoever. */
export const the_tool_is_booked_for_the_day = here.predicate({
  parameters: z.strictObject({
    tool_id: tool_id,
    day: wlib.day,
  }),
})

/** The tool is booked for the day by this member. */
export const the_tool_is_booked_for_the_day_by_this_member = here.predicate({
  parameters: z.strictObject({
    tool_id: tool_id,
    day: wlib.day,
    member_id: id.member_id,
  }),
})

/** The desk has begun cancelling the reservations of the tool. */
export const a_cancellation_of_the_reservations_of_the_tool_has_begun = here.predicate({
  parameters: z.strictObject({
    tool_id: tool_id,
  }),
})
