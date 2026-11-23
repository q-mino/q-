// generated

// The identities of `mailbox/deposits` from `id.ts` (DOM-25): the same objects
// under the same names, branded with their path (DOM-24), each schema with its
// output type under the same name, so that one import gives both. Only this
// module imports `id.ts`.

import { z } from 'zod'
import * as id from './id.ts'

/**
 * The deposit address D of a mailbox: the hash of its collect secret R
 * (PER-19, V5), in base64url. The relay never reads its form: any D is a
 * mailbox, which anyone may deposit on, and none is opened or closed.
 *
 * @see {@link id.deposit_address}
 */
export const deposit_address = id.deposit_address.brand<'mailbox/deposits/id/deposit_address'>()
export type deposit_address = z.output<typeof deposit_address>

/**
 * An envelope left on a mailbox: the one Anna's phone left on Bruno's D at
 * 9:02. Chosen by `deposits` from the operation that deposits it (D75.8,
 * `identity_of`): a depositor names no deposit, and a retry of the same
 * deposit is the same one.
 *
 * @see {@link id.deposit_id}
 */
export const deposit_id = id.deposit_id.brand<'mailbox/deposits/id/deposit_id'>()
export type deposit_id = z.output<typeof deposit_id>
