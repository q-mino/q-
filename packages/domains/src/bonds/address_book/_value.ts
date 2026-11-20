// generated

// The values of `bonds/address_book` from `value.ts` (DOM-25): the same objects
// under the same names, each schema with its output type under the same name,
// so that one import gives both. Only this module imports `value.ts`.

import { z } from 'zod'
import * as value from './value.ts'

/**
 * An Ed25519 public key, 32 bytes in base64url with no padding: 43 characters, the last of the 16 whose two low bits are zero.
 *
 * @see {@link value.face_key}
 */
export const face_key = value.face_key
export type face_key = z.output<typeof face_key>

/**
 * The name a face is introduced as: "Anna". Its user's, shown to whoever she bonds with.
 *
 * @see {@link value.face_name}
 */
export const face_name = value.face_name
export type face_name = z.output<typeof face_name>

/**
 * Where a face sits in its user's tree of faces (BND-3): at the top, or
 * under another of her faces. Data of hers, never of the keys: moving a face
 * changes no key, and no key tells a position. In stage 1 the one face is at
 * the top; a face under another comes with stage 2 ("more faces").
 *
 * @see {@link value.face_position}
 */
export const face_position = value.face_position
export type face_position = z.output<typeof face_position>

/**
 * Being made, the safe is drawing its seed; made, it has its public key (SEA-3).
 *
 * @see {@link value.face_status}
 */
export const face_status = value.face_status
export type face_status = z.output<typeof face_status>

/**
 * A face named by its user, whose keys the safe is making: no public key yet.
 *
 * @see {@link value.face_being_made}
 */
export const face_being_made = value.face_being_made
export type face_being_made = z.output<typeof face_being_made>

/**
 * A face with its public key, which the safe made: it can be shown, and bonded.
 *
 * @see {@link value.made_face}
 */
export const made_face = value.made_face
export type made_face = z.output<typeof made_face>

/**
 * A face of the node's user: its states share every field, so any field reads without narrowing.
 *
 * @see {@link value.face}
 */
export const face = value.face
export type face = z.output<typeof face>

/**
 * What the user's screens read of a face of hers: its name, its place in her tree, its key.
 *
 * @see {@link value.face_of_mine}
 */
export const face_of_mine = value.face_of_mine
export type face_of_mine = z.output<typeof face_of_mine>

/**
 * The address of a relay, where a mailbox is deposited on and collected
 * from: an `https` URL, as a ticket carries it (BND-4). The peer's is its
 * claim (F2).
 *
 * @see {@link value.relay_address}
 */
export const relay_address = value.relay_address
export type relay_address = z.output<typeof relay_address>

/**
 * The relays of a mailbox: a list, of one relay in stage 1 (§ Stage 1 of the
 * plan). Preferred relays of a face, overridden per bond, come later, and
 * widen the list.
 *
 * @see {@link value.relays}
 */
export const relays = value.relays
export type relays = z.output<typeof relays>

/**
 * A deposit address D, in the relay's form (MBX-1): base64url, at most 128 characters.
 *
 * @see {@link value.deposit_address}
 */
export const deposit_address = value.deposit_address
export type deposit_address = z.output<typeof deposit_address>

/**
 * Their face, in a bond: its key, which signs their letters and which mine are sealed for, and the name it is introduced as.
 *
 * @see {@link value.their_face}
 */
export const their_face = value.their_face
export type their_face = z.output<typeof their_face>

/**
 * Their mailbox, in a bond: where my node deposits for them, as they declared it at the introduction (BND-4).
 *
 * @see {@link value.their_mailbox}
 */
export const their_mailbox = value.their_mailbox
export type their_mailbox = z.output<typeof their_mailbox>

/**
 * My mailbox, in a bond: the one they deposit on for me, one for each bond
 * (BND-4). Its key's reference in the safe, which collects with its R; its D
 * and its relays, which I declared to them.
 *
 * @see {@link value.my_mailbox}
 */
export const my_mailbox = value.my_mailbox
export type my_mailbox = z.output<typeof my_mailbox>

/**
 * The name I give a bond: "Annina". Mine, on my node only; theirs stays as they introduced themselves.
 *
 * @see {@link value.bond_name}
 */
export const bond_name = value.bond_name
export type bond_name = z.output<typeof bond_name>

/**
 * In person, the crossed QR; at a distance, a link (BND-5).
 *
 * @see {@link value.handshake_way}
 */
export const handshake_way = value.handshake_way
export type handshake_way = z.output<typeof handshake_way>

/**
 * How the bond was made, as my node saw it (BND-5): in person or at a
 * distance, and when, by my clock. Information, not a guarantee (F6).
 *
 * @see {@link value.handshake}
 */
export const handshake = value.handshake
export type handshake = z.output<typeof handshake>

/**
 * Whether they have me (BND-5): the confirmation is awaited until a letter
 * of theirs comes on the bond, and received from then, with when it came by
 * my clock.
 *
 * @see {@link value.confirmation}
 */
export const confirmation = value.confirmation
export type confirmation = z.output<typeof confirmation>

/**
 * Kept, in the user's list; removed, by her, for good (BND-6).
 *
 * @see {@link value.bond_status}
 */
export const bond_status = value.bond_status
export type bond_status = z.output<typeof bond_status>

/**
 * A bond in the user's list: one of her faces, exactly one, with their face
 * (BND-1), their mailbox and hers, the name she gives them and what her node
 * noted of the handshake.
 *
 * @see {@link value.kept_bond}
 */
export const kept_bond = value.kept_bond
export type kept_bond = z.output<typeof kept_bond>

/**
 * A bond the user removed: out of her list, its letters no longer collected (BND-6).
 *
 * @see {@link value.removed_bond}
 */
export const removed_bond = value.removed_bond
export type removed_bond = z.output<typeof removed_bond>

/**
 * A bond of the node's user: its states share every field, so any field reads without narrowing.
 *
 * @see {@link value.bond}
 */
export const bond = value.bond
export type bond = z.output<typeof bond>

/**
 * A bond in the user's list: whom, by the name she gives them and theirs, with which face of hers, and whether they have her.
 *
 * @see {@link value.bond_in_the_list}
 */
export const bond_in_the_list = value.bond_in_the_list
export type bond_in_the_list = z.output<typeof bond_in_the_list>

/**
 * A bond as a whole, for its card and for whoever writes on it (`post`, step 10): every value but its status.
 *
 * @see {@link value.bond_card}
 */
export const bond_card = value.bond_card
export type bond_card = z.output<typeof bond_card>

/**
 * The bond a letter came for, by the mailbox of mine it was deposited on
 * (BND-4): which face of mine opens it, and the key it should be signed by.
 *
 * @see {@link value.bond_at_my_mailbox}
 */
export const bond_at_my_mailbox = value.bond_at_my_mailbox
export type bond_at_my_mailbox = z.output<typeof bond_at_my_mailbox>
