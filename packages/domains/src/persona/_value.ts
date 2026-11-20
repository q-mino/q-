// generated

// The values of `persona` from `value.ts` (DOM-25): the same objects under the
// same names, each schema with its output type under the same name, so that one
// import gives both. Only this module imports `value.ts`.

import { z } from 'zod'
import * as value from './value.ts'

/**
 * A face's Ed25519 public key, 32 bytes in base64url with no padding: the key a letter's signature holds for.
 *
 * @see {@link value.face_key}
 */
export const face_key = value.face_key
export type face_key = z.output<typeof face_key>

/**
 * A deposit address D, in the relay's form (MBX-1): a mailbox of the node's user, where a letter came.
 *
 * @see {@link value.deposit_address}
 */
export const deposit_address = value.deposit_address
export type deposit_address = z.output<typeof deposit_address>

/**
 * What the post noted of an anonymous letter's signature (PER-2): none, or
 * one that does not hold, with the face it claims, never taken for it. Dario
 * signs with a key, then changes a byte of the letter: "invalid signature,
 * claimed face K_d".
 *
 * @see {@link value.annotation}
 */
export const annotation = value.annotation
export type annotation = z.output<typeof annotation>

/**
 * Who asks (PER-4), as the kernel's entry gives it to every persona, the
 * same whatever the persona; the node of each verifies its own (PER-7).
 * The user of this node, from the app (Anna on her phone); a face, by the
 * key a letter's signature holds for, to the mailbox of mine it came to,
 * both verified by the post (a letter re-addressed to another mailbox does
 * not reach a persona); or anonymous, a letter with no signature or one
 * that does not hold (PER-2), its id the hash of its envelope: with no
 * stable sender, every letter is a new operation (PER-4).
 *
 * @see {@link value.caller}
 */
export const caller = value.caller
export type caller = z.output<typeof caller>
