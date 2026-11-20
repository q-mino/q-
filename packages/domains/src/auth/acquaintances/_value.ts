// generated

// The values of `auth/acquaintances` from `value.ts` (DOM-25): the same objects
// under the same names, each schema with its output type under the same name,
// so that one import gives both. Only this module imports `value.ts`.

import { z } from 'zod'
import * as value from './value.ts'

/**
 * A face's Ed25519 public key, 32 bytes in base64url with no padding, as the post gives the signer of a letter.
 *
 * @see {@link value.face_key}
 */
export const face_key = value.face_key
export type face_key = z.output<typeof face_key>

/**
 * A deposit address D, in the relay's form (MBX-1): base64url, at most 128 characters. A mailbox of the node's user.
 *
 * @see {@link value.deposit_address}
 */
export const deposit_address = value.deposit_address
export type deposit_address = z.output<typeof deposit_address>

/**
 * An extension, by the name its manifest gives it (EXT-3): `greetings`.
 *
 * @see {@link value.extension_name}
 */
export const extension_name = value.extension_name
export type extension_name = z.output<typeof extension_name>

/**
 * A major of an extension's surface on `known` (PER-17): one it speaks.
 *
 * @see {@link value.major}
 */
export const major = value.major
export type major = z.output<typeof major>

/**
 * The name the user gives a bond: "Bru". Hers, on her node only.
 *
 * @see {@link value.bond_name}
 */
export const bond_name = value.bond_name
export type bond_name = z.output<typeof bond_name>

/**
 * The key of every lookup of the acquaintances (F2, PER-13): the face that
 * signed a letter and the mailbox of mine the letter came to, both verified
 * by the post (a letter re-addressed to another mailbox does not open
 * there). Bruno's K_b, at D_mb, the mailbox Anna keeps for him.
 *
 * @see {@link value.a_face_at_my_mailbox}
 */
export const a_face_at_my_mailbox = value.a_face_at_my_mailbox
export type a_face_at_my_mailbox = z.output<typeof a_face_at_my_mailbox>

/**
 * The bond kept at a mailbox of mine whose face is that key: Anna's L_b,
 * her face F_a, Bruno's K_b, the name she gives him. What `known` gives its
 * leaves and the extensions' mounted folders, whole.
 *
 * @see {@link value.bond_of_a_face}
 */
export const bond_of_a_face = value.bond_of_a_face
export type bond_of_a_face = z.output<typeof bond_of_a_face>

/**
 * What a face presents at a mailbox of mine (BND-7, BND-10): a ready ticket
 * of mine there, or the bond kept there with that face (the crossed QR).
 * What an introduction is for: Carla's ticket, the bond to be L_a, her face
 * F_c, Dario's key K_d. The key is the one the lookup was asked with: the
 * leaf of `unknown` gives the business the verified signer from it, never
 * from the letter's input (PER-8).
 *
 * @see {@link value.ticket_a_face_presents}
 */
export const ticket_a_face_presents = value.ticket_a_face_presents
export type ticket_a_face_presents = z.output<typeof ticket_a_face_presents>

/**
 * The extensions the node offers to a bond (EXT-6, EXT-7), each by its name
 * with the majors of its surface on `known`: greetings, at major 1, to
 * Bruno's bond. Empty when the bond has none offered.
 *
 * @see {@link value.extensions_offered}
 */
export const extensions_offered = value.extensions_offered
export type extensions_offered = z.output<typeof extensions_offered>
