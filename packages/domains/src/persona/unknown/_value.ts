// generated

// The values of `persona/unknown` from `value.ts` (DOM-25): the same objects
// under the same names, each schema with its output type under the same name,
// so that one import gives both. Only this module imports `value.ts`.

import { z } from 'zod'
import * as value from './value.ts'

/**
 * The name the face is introduced as: "Dario". Its user's, shown to whoever it bonds with.
 *
 * @see {@link value.face_name}
 */
export const face_name = value.face_name
export type face_name = z.output<typeof face_name>

/**
 * The address of a relay: an `https` URL.
 *
 * @see {@link value.relay_address}
 */
export const relay_address = value.relay_address
export type relay_address = z.output<typeof relay_address>

/**
 * The relays of a mailbox: one in stage 1.
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
 * The face's mailbox for the bond, as it declares it (F2): where the node it introduces itself to deposits for it.
 *
 * @see {@link value.mailbox}
 */
export const mailbox = value.mailbox
export type mailbox = z.output<typeof mailbox>

/**
 * The secret of the ticket presented (BND-9): 64 bytes in base64url, 86 characters.
 *
 * @see {@link value.ticket_secret}
 */
export const ticket_secret = value.ticket_secret
export type ticket_secret = z.output<typeof ticket_secret>
