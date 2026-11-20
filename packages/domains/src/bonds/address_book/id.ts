import { z } from 'zod'
import { id } from './_scope_id.ts'

// The identities of the address book: the values that name an instance
// (DOM-24). Their shape only: the generator brands them with their path in
// `_id.ts`.

/**
 * A face of the node's user, as the address book files it: Anna's face
 * "Anna", shown to everyone she bonds with in stage 1. The key of the link
 * with the face the safe keeps (GR-3, SEA-3), so the face's opaque reference
 * to its keys: it tells neither its seed nor its index, and the address book
 * reaches no secret through it (BND-2).
 */
export const face_id = id({ format: z.string().min(1) })

/**
 * A bond of the node's user: Anna's with Bruno, made at the handshake.
 * Named on the node (DOM-12), by the introduction that makes it (step 11.2).
 */
export const bond_id = id({ format: z.string().min(1) })

/**
 * A mailbox of the node's user, one for each bond, where its peer deposits
 * for her: the key of the link with the mailbox key the safe keeps (GR-3,
 * SEA-4), so its opaque reference to the collect secret.
 */
export const mailbox_id = id({ format: z.string().min(1) })
