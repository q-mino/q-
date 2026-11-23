import { z } from 'zod'
import { id } from './_scope_id.ts'

// The identities of `deposits`: the values that name an instance (DOM-24).
// Their shape only: the generator brands them with their path in `_id.ts`.

/**
 * The deposit address D of a mailbox: the hash of its collect secret R
 * (PER-19, V5), in base64url. The relay never reads its form: any D is a
 * mailbox, which anyone may deposit on, and none is opened or closed.
 */
export const deposit_address = id({ format: z.string().regex(/^[A-Za-z0-9_-]{1,128}$/) })

/**
 * An envelope left on a mailbox: the one Anna's phone left on Bruno's D at
 * 9:02. Chosen by `deposits` from the operation that deposits it (D75.8,
 * `identity_of`): a depositor names no deposit, and a retry of the same
 * deposit is the same one.
 */
export const deposit_id = id({ format: z.string().min(1) })
