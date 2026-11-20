import { z } from 'zod'
import { id } from './_scope_id.ts'

// The identities of the safe: the values that name an instance (DOM-24).
// Their shape only: the generator brands them with their path in `_id.ts`.

/**
 * A seed in the safe: the one Anna's phone drew with her first face. Chosen
 * by the safe from the operation that keeps it (D75.8, `identity_of`): it
 * never leaves the safe, and tells nothing of the seed's bytes (SEA-2).
 */
export const seed_id = id({ format: z.string().min(1) })

/**
 * A face of the node's user, as the safe files it: named by who asks for it
 * (SEA-3), the key of the link with the face as `bonds` keeps it (GR-3). It
 * tells neither the face's seed nor its index (SEA-6).
 */
export const face_id = id({ format: z.string().min(1) })

/** The key of a mailbox of the node's: named by who asks for it, as a face (SEA-4). */
export const mailbox_key_id = id({ format: z.string().min(1) })
