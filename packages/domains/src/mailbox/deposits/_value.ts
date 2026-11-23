// generated

// The values of `mailbox/deposits` from `value.ts` (DOM-25): the same objects
// under the same names, each schema with its output type under the same name,
// so that one import gives both. Only this module imports `value.ts`.

import { z } from 'zod'
import * as value from './value.ts'

/**
 * An envelope as the relay keeps it: sealed, so opaque to it (F2), in
 * base64url, at most 64 KiB once decoded (87 382 characters). The relay
 * neither opens it nor reads who sent it.
 *
 * @see {@link value.envelope}
 */
export const envelope = value.envelope
export type envelope = z.output<typeof envelope>

/**
 * Kept, the holder collects it; discarded, seven days after its deposit, for good (MBX-2).
 *
 * @see {@link value.deposit_status}
 */
export const deposit_status = value.deposit_status
export type deposit_status = z.output<typeof deposit_status>

/**
 * An envelope on its mailbox, as the relay received it, at the time it received it, by its clock.
 *
 * @see {@link value.kept_deposit}
 */
export const kept_deposit = value.kept_deposit
export type kept_deposit = z.output<typeof kept_deposit>

/**
 * An envelope the relay threw away: what is left of the deposit, its envelope gone.
 *
 * @see {@link value.discarded_deposit}
 */
export const discarded_deposit = value.discarded_deposit
export type discarded_deposit = z.output<typeof discarded_deposit>

/**
 * A deposit on a mailbox: its states share every field, so any field reads without narrowing.
 *
 * @see {@link value.deposit}
 */
export const deposit = value.deposit
export type deposit = z.output<typeof deposit>

/**
 * What the holder collects of a deposit: which one, when the relay received it, and the envelope.
 *
 * @see {@link value.collected_envelope}
 */
export const collected_envelope = value.collected_envelope
export type collected_envelope = z.output<typeof collected_envelope>
