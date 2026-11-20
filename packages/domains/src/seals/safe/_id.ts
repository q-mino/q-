// generated

// The identities of `seals/safe` from `id.ts` (DOM-25): the same objects under
// the same names, branded with their path (DOM-24), each schema with its output
// type under the same name, so that one import gives both. Only this module
// imports `id.ts`.

import { z } from 'zod'
import * as id from './id.ts'

/**
 * A seed in the safe: the one Anna's phone drew with her first face. Chosen
 * by the safe from the operation that keeps it (D75.8, `identity_of`): it
 * never leaves the safe, and tells nothing of the seed's bytes (SEA-2).
 *
 * @see {@link id.seed_id}
 */
export const seed_id = id.seed_id.brand<'seals/safe/id/seed_id'>()
export type seed_id = z.output<typeof seed_id>

/**
 * A face of the node's user, as the safe files it: named by who asks for it
 * (SEA-3), the key of the link with the face as `bonds` keeps it (GR-3). It
 * tells neither the face's seed nor its index (SEA-6).
 *
 * @see {@link id.face_id}
 */
export const face_id = id.face_id.brand<'seals/safe/id/face_id'>()
export type face_id = z.output<typeof face_id>

/**
 * The key of a mailbox of the node's: named by who asks for it, as a face (SEA-4).
 *
 * @see {@link id.mailbox_key_id}
 */
export const mailbox_key_id = id.mailbox_key_id.brand<'seals/safe/id/mailbox_key_id'>()
export type mailbox_key_id = z.output<typeof mailbox_key_id>
