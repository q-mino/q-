import { z } from 'zod'
import * as wlib from '../../wlib.ts'
import here, { id } from './_here_selection.ts'

// The selections over a reservation, the subject of this file (DOM-18).

export const the_reservation_is_booked = here.selection({
  subject: 'reservation',
  parameters: z.strictObject({}),
})

export const the_reservation_is_of_this_member = here.selection({
  subject: 'reservation',
  parameters: z.strictObject({
    member_id: id.member_id,
  }),
})

/** The reserved day is this day or a later one. */
export const the_reservation_is_from_this_day_on = here.selection({
  subject: 'reservation',
  parameters: z.strictObject({
    day: wlib.day,
  }),
})
