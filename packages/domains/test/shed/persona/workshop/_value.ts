// generated

// The value schemas of `workshop` under their names, with their output types
// under the same names: one import gives both.

import { z } from 'zod'
import * as value from './value.ts'

/**
 * The id Rossi's system gives a notification, and keeps when it sends it
 * again because the shed did not answer: the identity of the operation
 * (D91.2, SC-34).
 *
 * @see {@link value.notification_id}
 */
export const notification_id = value.notification_id
export type notification_id = z.output<typeof notification_id>
