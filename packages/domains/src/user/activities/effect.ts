import { z } from 'zod'
import { effect, id, value } from './_scope_effect.ts'

// The effect of the activities (USR-4, LIB-12): the library's queue.

/**
 * Carry out an activity (USR-4): its delivery is the port of `user` toward
 * `self` (GR-7), the configurator's, which invokes the leaf the activity
 * names under the activity's id (DOM-12), follows its flow to its end and
 * gives how it ended, the input of the return `end_an_activity`. A fall of
 * the node or of an extension is tried again (`transient`, EXT-15); what
 * cannot be carried out is a held letter, shown (DOM-15, USR-8). Its
 * deliveries are in flight together: a ping that waits for its pong holds no
 * other activity behind it (SC-56, the paper's first guarantee of a queue).
 */
export const carry_out_an_activity = effect({
  payload: z.strictObject({
    activity_id: id.activity_id,
    what: value.what_is_asked,
  }),
  order: 'any',
})
