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
 * A bond of the node's user: Anna's with Bruno, from the ticket she showed
 * him or presented to his (BND-7). Named on the node (DOM-12) when the ticket
 * is asked for; the key of her mailbox of the bond in the safe has it too
 * (BND-2).
 */
export const bond_id = id({ format: z.string().min(1) })
