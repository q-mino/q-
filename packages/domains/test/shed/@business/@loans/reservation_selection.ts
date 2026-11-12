import { z } from 'zod'
import { member_id } from './_id.ts'
import * as wlib from '../../wlib.ts'

// The selections over a reservation, the subject of this file (DOM-18).

export const the_reservation_is_booked = wlib.selection({
  subject: 'reservation',
  parameters: z.strictObject({}),
})

export const the_reservation_is_of_this_member = wlib.selection({
  subject: 'reservation',
  parameters: z.strictObject({
    member_id: member_id,
  }),
})

/** The reserved day is this day or a later one. */
export const the_reservation_is_from_this_day_on = wlib.selection({
  subject: 'reservation',
  parameters: z.strictObject({
    day: wlib.day,
  }),
})
