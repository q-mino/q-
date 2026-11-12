import { z } from 'zod'
import { tool_id } from '../@tools/_id.ts'
import { loan_id, member_id, reservation_id } from './_id.ts'
import * as wlib from '../../wlib.ts'

// The vocabulary of the conditions of `loans`, over its own view of the
// tools too (GR-3, V11): the state adapter reads them from `tools`.

/** The shed has a tool with this id. */
export const a_tool_has_this_id = wlib.predicate({
  parameters: z.strictObject({
    tool_id: tool_id,
  }),
})

/** The tool can go out: it is in service in the shed. */
export const the_tool_is_in_service = wlib.predicate({
  parameters: z.strictObject({
    tool_id: tool_id,
  }),
})

export const a_loan_has_this_id = wlib.predicate({
  parameters: z.strictObject({
    loan_id: loan_id,
  }),
})

export const the_loan_is_ongoing = wlib.predicate({
  parameters: z.strictObject({
    loan_id: loan_id,
  }),
})

export const the_loan_is_returned = wlib.predicate({
  parameters: z.strictObject({
    loan_id: loan_id,
  }),
})

/** The tool is with a member, whoever it is. */
export const the_tool_is_on_loan = wlib.predicate({
  parameters: z.strictObject({
    tool_id: tool_id,
  }),
})

/** The tool is with this member. */
export const the_tool_is_on_loan_to_this_member = wlib.predicate({
  parameters: z.strictObject({
    tool_id: tool_id,
    member_id: member_id,
  }),
})

export const a_reservation_has_this_id = wlib.predicate({
  parameters: z.strictObject({
    reservation_id: reservation_id,
  }),
})

/** The tool is booked for the day, by whoever. */
export const the_tool_is_booked_for_the_day = wlib.predicate({
  parameters: z.strictObject({
    tool_id: tool_id,
    day: wlib.day,
  }),
})

/** The tool is booked for the day by this member. */
export const the_tool_is_booked_for_the_day_by_this_member = wlib.predicate({
  parameters: z.strictObject({
    tool_id: tool_id,
    day: wlib.day,
    member_id: member_id,
  }),
})
