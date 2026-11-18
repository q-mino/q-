import { z } from 'zod'

// The values of `workshop`, in the words of Rossi's system (GR-3, D91.1): its
// own, so that its surface stays when `tools` changes (PER-17).

/**
 * The id Rossi's system gives a notification, and keeps when it sends it
 * again because the shed did not answer: the identity of the operation
 * (D91.2, SC-34).
 */
export const notification_id = z.string().min(1)
