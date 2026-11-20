// generated

// The queries of `bonds/address_book` from `query.ts` (DOM-25): the same
// objects under the same names, each schema with its output type under the same
// name, so that one import gives both. Only this module imports `query.ts`.

import { z } from 'zod'
import * as query from './query.ts'

/**
 * The bond is the one named, and in the list.
 *
 * @see {@link query.the_bond_is_kept_under_this_id}
 */
export const the_bond_is_kept_under_this_id = query.the_bond_is_kept_under_this_id
export type the_bond_is_kept_under_this_id = z.output<typeof the_bond_is_kept_under_this_id>

/**
 * The bond is in the list, and my mailbox of it is at the address named.
 *
 * @see {@link query.the_bond_is_kept_at_my_mailbox}
 */
export const the_bond_is_kept_at_my_mailbox = query.the_bond_is_kept_at_my_mailbox
export type the_bond_is_kept_at_my_mailbox = z.output<typeof the_bond_is_kept_at_my_mailbox>

/**
 * Anna's faces (BND-3), each with its name, its place in her tree and its
 * key, by name: in stage 1 the one she made at the first start. A face
 * being made is not one yet.
 *
 * @see {@link query.my_faces}
 */
export const my_faces = query.my_faces

/**
 * The input of `my_faces`, declared inline.
 *
 * @see {@link query.my_faces}
 */
export const my_faces_input = query.my_faces.input
export type my_faces_input = z.output<typeof my_faces_input>

/**
 * Anna's list of bonds (BND-6): Bruno, Carla, by the name she gives each,
 * with the face of hers each belongs to and whether they have her yet. A
 * bond she removed is not in it.
 *
 * @see {@link query.my_bonds}
 */
export const my_bonds = query.my_bonds

/**
 * The input of `my_bonds`, declared inline.
 *
 * @see {@link query.my_bonds}
 */
export const my_bonds_input = query.my_bonds.input
export type my_bonds_input = z.output<typeof my_bonds_input>

/**
 * Bruno's card on Anna's phone (BND-1): every value of the bond, the name she
 * gives him and the one he is introduced as, his face and his mailbox, hers,
 * the handshake and the confirmation. No entry for a bond removed.
 *
 * @see {@link query.a_bond}
 */
export const a_bond = query.a_bond

/**
 * The input of `a_bond`, declared inline.
 *
 * @see {@link query.a_bond}
 */
export const a_bond_input = query.a_bond.input
export type a_bond_input = z.output<typeof a_bond_input>

/**
 * A letter Anna's phone collected from one of her mailboxes (BND-4): the
 * bond it came on, which face of hers opens it, and the key it should be
 * signed by. No entry for an address of no bond in her list.
 *
 * @see {@link query.the_bond_at_my_mailbox}
 */
export const the_bond_at_my_mailbox = query.the_bond_at_my_mailbox

/**
 * The input of `the_bond_at_my_mailbox`, declared inline.
 *
 * @see {@link query.the_bond_at_my_mailbox}
 */
export const the_bond_at_my_mailbox_input = query.the_bond_at_my_mailbox.input
export type the_bond_at_my_mailbox_input = z.output<typeof the_bond_at_my_mailbox_input>
