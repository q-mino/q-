import { z } from 'zod'
import { id } from './_scope_id.ts'

// The identities of the activities (USR-1, DOM-12, DOM-24).

/**
 * An activity: what she asked her node, Anna's "ping Bruno" at 10:00. Drawn
 * at random before the first attempt (DOM-12, WEB-5), so that every attempt
 * to carry it out is one operation on `self`, and a fall in between meets the
 * recorded fact again (D73.6, DOM-11).
 */
export const activity_id = id({ format: z.string().min(1).max(64) })
