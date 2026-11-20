// generated

// The effects of `user/activities` from `effect.ts` (DOM-25): the same objects
// under the same names, branded with their path (DOM-24), each schema with its
// output type under the same name, so that one import gives both. Only this
// module imports `effect.ts`.

import { z } from 'zod'
import * as effect from './effect.ts'

/**
 * Carry out an activity (USR-4): its delivery is the port of `user` toward
 * `self` (GR-7), the configurator's, which invokes the leaf the activity
 * names under the activity's id (DOM-12), follows its flow to its end and
 * gives how it ended, the input of the return `end_an_activity`. A fall of
 * the node or of an extension is tried again (`transient`, EXT-15); what
 * cannot be carried out is a held letter, shown (DOM-15, USR-8). Its
 * deliveries are in flight together: a ping that waits for its pong holds no
 * other activity behind it (SC-56, the paper's first guarantee of a queue).
 *
 * @see {@link effect.carry_out_an_activity}
 */
export const carry_out_an_activity =
  effect.carry_out_an_activity.brand<'user/activities/effect/carry_out_an_activity'>()
export type carry_out_an_activity = z.output<typeof carry_out_an_activity>
