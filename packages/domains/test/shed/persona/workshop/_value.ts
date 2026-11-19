// generated

// The values of `persona/workshop` from `value.ts` (DOM-25): the same objects
// under the same names, each schema with its output type under the same name,
// so that one import gives both. Only this module imports `value.ts`.

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
