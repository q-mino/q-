// generated

// The identities of `bonds/address_book` from `id.ts` (DOM-25): the same
// objects under the same names, branded with their path (DOM-24), each schema
// with its output type under the same name, so that one import gives both. Only
// this module imports `id.ts`.

import { z } from 'zod'
import * as id from './id.ts'

/**
 * A face of the node's user, as the address book files it: Anna's face
 * "Anna", shown to everyone she bonds with in stage 1. The key of the link
 * with the face the safe keeps (GR-3, SEA-3), so the face's opaque reference
 * to its keys: it tells neither its seed nor its index, and the address book
 * reaches no secret through it (BND-2).
 *
 * @see {@link id.face_id}
 */
export const face_id = id.face_id.brand<'bonds/address_book/id/face_id'>()
export type face_id = z.output<typeof face_id>

/**
 * A bond of the node's user: Anna's with Bruno, from the ticket she showed
 * him or presented to his (BND-7). Named on the node (DOM-12) when the ticket
 * is asked for; the key of her mailbox of the bond in the safe has it too
 * (BND-2).
 *
 * @see {@link id.bond_id}
 */
export const bond_id = id.bond_id.brand<'bonds/address_book/id/bond_id'>()
export type bond_id = z.output<typeof bond_id>
