import { z } from 'zod'
import * as wlib from '../../../../src/library/index.ts'
import { selection, id, tools } from './_scope_selection.ts'

// The selections over a reservation, the subject of this file (DOM-18).

export const the_reservation_is_booked = selection({
  subject: 'reservation',
  parameters: z.strictObject({}),
})

export const the_reservation_is_of_this_member = selection({
  subject: 'reservation',
  parameters: z.strictObject({
    member_id: id.member_id,
  }),
})

export const the_reservation_is_of_this_tool = selection({
  subject: 'reservation',
  parameters: z.strictObject({
    tool_id: tools.id.tool_id,
  }),
})

/** The reserved day is this day or a later one. */
export const the_reservation_is_from_this_day_on = selection({
  subject: 'reservation',
  parameters: z.strictObject({
    day: wlib.day,
  }),
})

/**
 * The tool held by the reservation is in the workshop: a selection over the
 * state of `tools`, which `loans` sees as its own view of the tools (GR-3),
 * and the adapter reads from the catalogue (SC-20).
 */
export const the_tool_of_the_reservation_is_in_the_workshop = selection({
  subject: 'reservation',
  parameters: z.strictObject({}),
})
