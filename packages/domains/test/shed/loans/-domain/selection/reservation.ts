import { z } from 'zod'
import { day } from '../../../wlib.ts'
import { member_id } from '../$id.ts'

// The selections over a reservation, the subject of this file (DOM-18).

export const the_reservation_is_booked = z.strictObject({})

export const the_reservation_is_of_this_member = z.strictObject({
  member_id: member_id,
})

/** The reserved day is this day or a later one. */
export const the_reservation_is_from_this_day_on = z.strictObject({
  day: day,
})
