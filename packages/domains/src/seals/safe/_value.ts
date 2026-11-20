// generated

// The values of `seals/safe` from `value.ts` (DOM-25): the same objects under
// the same names, each schema with its output type under the same name, so that
// one import gives both. Only this module imports `value.ts`.

import { z } from 'zod'
import * as value from './value.ts'

/**
 * The secret of a seed: 32 random bytes, the seed SLIP-0010 takes (A, 6 Nov 2026).
 *
 * @see {@link value.seed_secret}
 */
export const seed_secret = value.seed_secret
export type seed_secret = z.output<typeof seed_secret>

/**
 * How the faces of a seed are derived from it (A, 6 Nov 2026): `slip10-flat`,
 * the face at index i is SLIP-0010's hardened child `m/i'` over Ed25519. A
 * scheme to come (a shareable branch, `m/i'/j'`) is another value.
 *
 * @see {@link value.seed_scheme}
 */
export const seed_scheme = value.seed_scheme
export type seed_scheme = z.output<typeof seed_scheme>

/**
 * The index of a face under its seed: a hardened child, 0 to 2³¹ − 1.
 *
 * @see {@link value.face_index}
 */
export const face_index = value.face_index
export type face_index = z.output<typeof face_index>

/**
 * The index the next face of a seed will take: never one already taken (SEA-2); 2³¹ once every index is.
 *
 * @see {@link value.next_index}
 */
export const next_index = value.next_index
export type next_index = z.output<typeof next_index>

/**
 * A face's Ed25519 public key: the only key of the safe that leaves it (SEA-6).
 *
 * @see {@link value.public_key}
 */
export const public_key = value.public_key
export type public_key = z.output<typeof public_key>

/**
 * A face's private key, SLIP-0010's key of its child: the seed of its Ed25519 key pair.
 *
 * @see {@link value.private_key}
 */
export const private_key = value.private_key
export type private_key = z.output<typeof private_key>

/**
 * A face's chain code, SLIP-0010's: kept for the branches to come (a face as a branch's root).
 *
 * @see {@link value.chain_code}
 */
export const chain_code = value.chain_code
export type chain_code = z.output<typeof chain_code>

/**
 * The keys of a face, as its derivation gives them (`dsl.the_face_at`).
 *
 * @see {@link value.face_keys}
 */
export const face_keys = value.face_keys
export type face_keys = z.output<typeof face_keys>

/**
 * An Ed25519 signature: 64 bytes.
 *
 * @see {@link value.signature}
 */
export const signature = value.signature
export type signature = z.output<typeof signature>

/**
 * What `post` gives the safe to sign or to seal: bytes the safe does not read.
 *
 * @see {@link value.content}
 */
export const content = value.content
export type content = z.output<typeof content>

/**
 * A content sealed for a public key (libsodium's sealed box): only that face's private key opens it.
 *
 * @see {@link value.sealed_content}
 */
export const sealed_content = value.sealed_content
export type sealed_content = z.output<typeof sealed_content>

/**
 * A sealed content tried with a face's private key: opened, with its content, or not (not sealed for that face, or broken).
 *
 * @see {@link value.opening}
 */
export const opening = value.opening
export type opening = z.output<typeof opening>

/**
 * The collect secret R of a mailbox: 32 random bytes, a bearer credential (V5).
 *
 * @see {@link value.collect_secret}
 */
export const collect_secret = value.collect_secret
export type collect_secret = z.output<typeof collect_secret>

/**
 * The deposit address D of a mailbox: BLAKE2b-256 of its collect secret (SEA-4).
 *
 * @see {@link value.deposit_address}
 */
export const deposit_address = value.deposit_address
export type deposit_address = z.output<typeof deposit_address>

/**
 * A seed of the node's user (SEA-2): its secret, its scheme and the index its
 * next face will take. Kept in the safe; nothing of it leaves.
 *
 * @see {@link value.seed}
 */
export const seed = value.seed
export type seed = z.output<typeof seed>

/**
 * Being made, its seed is being drawn; made, it has its keys (SEA-3).
 *
 * @see {@link value.face_status}
 */
export const face_status = value.face_status
export type face_status = z.output<typeof face_status>

/**
 * A face asked for, whose seed the safe is drawing: no seed, no keys yet.
 *
 * @see {@link value.face_being_made}
 */
export const face_being_made = value.face_being_made
export type face_being_made = z.output<typeof face_being_made>

/**
 * A face with its keys, at its index under its seed.
 *
 * @see {@link value.made_face}
 */
export const made_face = value.made_face
export type made_face = z.output<typeof made_face>

/**
 * A face in the safe: its states share every field, so any field reads without narrowing.
 *
 * @see {@link value.face}
 */
export const face = value.face
export type face = z.output<typeof face>

/**
 * What leaves the safe of a face: its id and its public key (SEA-6).
 *
 * @see {@link value.face_of_mine}
 */
export const face_of_mine = value.face_of_mine
export type face_of_mine = z.output<typeof face_of_mine>

/**
 * Being drawn, its secret is being drawn; drawn, it has its R and its D (SEA-4).
 *
 * @see {@link value.mailbox_key_status}
 */
export const mailbox_key_status = value.mailbox_key_status
export type mailbox_key_status = z.output<typeof mailbox_key_status>

/**
 * A mailbox key asked for, whose collect secret the safe is drawing.
 *
 * @see {@link value.mailbox_key_being_drawn}
 */
export const mailbox_key_being_drawn = value.mailbox_key_being_drawn
export type mailbox_key_being_drawn = z.output<typeof mailbox_key_being_drawn>

/**
 * A mailbox key with its collect secret R and its deposit address D.
 *
 * @see {@link value.drawn_mailbox_key}
 */
export const drawn_mailbox_key = value.drawn_mailbox_key
export type drawn_mailbox_key = z.output<typeof drawn_mailbox_key>

/**
 * A mailbox key in the safe: its states share every field.
 *
 * @see {@link value.mailbox_key}
 */
export const mailbox_key = value.mailbox_key
export type mailbox_key = z.output<typeof mailbox_key>

/**
 * What the safe gives of a mailbox key to who collects from the relay: R to show, D to name (V5, SEA-4).
 *
 * @see {@link value.key_shown_to_the_relay}
 */
export const key_shown_to_the_relay = value.key_shown_to_the_relay
export type key_shown_to_the_relay = z.output<typeof key_shown_to_the_relay>
