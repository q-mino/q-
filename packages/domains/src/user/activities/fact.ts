import { z } from 'zod'
import { date_time } from '../../library/index.ts'
import { fact, id, value } from './_scope_fact.ts'

// The facts of the activities (USR-1, USR-4).

/** An activity has been asked (USR-2): her gesture, kept with its id before the first attempt (DOM-12). */
export const an_activity_has_been_asked = fact({
  payload: z.strictObject({
    activity: value.an_asked_activity,
  }),
})

/** An activity asked already has been asked again: nothing changes (DOM-6). */
export const an_activity_has_been_asked_again = fact({
  payload: z.strictObject({
    activity_id: id.activity_id,
  }),
})

/** An activity has ended (USR-3): how, in her words, and when. */
export const an_activity_has_ended = fact({
  payload: z.strictObject({
    activity_id: id.activity_id,
    how_it_ended: value.how_it_ended,
    at: date_time,
  }),
})
