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

/**
 * The ticket is the one named, and ready.
 *
 * @see {@link query.the_ticket_is_ready_under_this_id}
 */
export const the_ticket_is_ready_under_this_id = query.the_ticket_is_ready_under_this_id
export type the_ticket_is_ready_under_this_id = z.output<typeof the_ticket_is_ready_under_this_id>

/**
 * The ticket is ready, and its mailbox is at the address named.
 *
 * @see {@link query.the_ticket_is_ready_at_my_mailbox}
 */
export const the_ticket_is_ready_at_my_mailbox = query.the_ticket_is_ready_at_my_mailbox
export type the_ticket_is_ready_at_my_mailbox = z.output<typeof the_ticket_is_ready_at_my_mailbox>

/**
 * The ticket Anna shows Bruno, or sends Carla in a link (BND-8): her face's
 * key and the name it is introduced as, her mailbox for the bond to be,
 * until when it holds. Its secret is the safe's signature, joined where the
 * ticket is drawn (BND-9). No entry for a ticket being prepared, used or
 * expired.
 *
 * @see {@link query.my_ticket}
 */
export const my_ticket = query.my_ticket

/**
 * The input of `my_ticket`, declared inline.
 *
 * @see {@link query.my_ticket}
 */
export const my_ticket_input = query.my_ticket.input
export type my_ticket_input = z.output<typeof my_ticket_input>

/**
 * An introduction Carla's phone collected from a mailbox of hers (BND-10):
 * the ticket it came for, ready, and her face it is for. No entry for an
 * address of no ready ticket; a bond made already is `the_bond_at_my_mailbox`'s.
 *
 * @see {@link query.the_ticket_at_my_mailbox}
 */
export const the_ticket_at_my_mailbox = query.the_ticket_at_my_mailbox

/**
 * The input of `the_ticket_at_my_mailbox`, declared inline.
 *
 * @see {@link query.the_ticket_at_my_mailbox}
 */
export const the_ticket_at_my_mailbox_input = query.the_ticket_at_my_mailbox.input
export type the_ticket_at_my_mailbox_input = z.output<typeof the_ticket_at_my_mailbox_input>

/**
 * The bond is kept, or its ticket is ready.
 *
 * @see {@link query.my_mailbox_of_the_bond_is_collected}
 */
export const my_mailbox_of_the_bond_is_collected = query.my_mailbox_of_the_bond_is_collected
export type my_mailbox_of_the_bond_is_collected = z.output<
  typeof my_mailbox_of_the_bond_is_collected
>

/**
 * The mailboxes Anna's phone collects from (BND-11): those of her ready
 * tickets, where introductions come, and those of her kept bonds, where
 * their letters come. A ticket expired and a bond removed are not among
 * them.
 *
 * @see {@link query.the_mailboxes_i_collect}
 */
export const the_mailboxes_i_collect = query.the_mailboxes_i_collect

/**
 * The input of `the_mailboxes_i_collect`, declared inline.
 *
 * @see {@link query.the_mailboxes_i_collect}
 */
export const the_mailboxes_i_collect_input = query.the_mailboxes_i_collect.input
export type the_mailboxes_i_collect_input = z.output<typeof the_mailboxes_i_collect_input>
