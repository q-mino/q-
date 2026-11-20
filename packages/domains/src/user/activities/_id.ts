// generated

// The identities of `user/activities` from `id.ts` (DOM-25): the same objects
// under the same names, branded with their path (DOM-24), each schema with its
// output type under the same name, so that one import gives both. Only this
// module imports `id.ts`.

import { z } from 'zod'
import * as id from './id.ts'

/**
 * An activity: what she asked her node, Anna's "ping Bruno" at 10:00. Drawn
 * at random before the first attempt (DOM-12, WEB-5), so that every attempt
 * to carry it out is one operation on `self`, and a fall in between meets the
 * recorded fact again (D73.6, DOM-11).
 *
 * @see {@link id.activity_id}
 */
export const activity_id = id.activity_id.brand<'user/activities/id/activity_id'>()
export type activity_id = z.output<typeof activity_id>
