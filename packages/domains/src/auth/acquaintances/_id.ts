// generated

// The identities of `auth/acquaintances` from `id.ts` (DOM-25): the same
// objects under the same names, branded with their path (DOM-24), each schema
// with its output type under the same name, so that one import gives both. Only
// this module imports `id.ts`.

import { z } from 'zod'
import * as id from './id.ts'

/**
 * A bond, as auth names it: the same key the address book gives Anna's bond
 * with Bruno, L_b, linked by the adapter. The bond a letter from Bruno's
 * face comes on, at the mailbox of Anna's it was deposited on.
 *
 * @see {@link id.bond_id}
 */
export const bond_id = id.bond_id.brand<'auth/acquaintances/id/bond_id'>()
export type bond_id = z.output<typeof bond_id>

/**
 * A face of the node's user, the one a bond belongs to: Anna's face F_a,
 * which opens Bruno's letters on L_b and in whose name her node answers.
 *
 * @see {@link id.face_id}
 */
export const face_id = id.face_id.brand<'auth/acquaintances/id/face_id'>()
export type face_id = z.output<typeof face_id>
