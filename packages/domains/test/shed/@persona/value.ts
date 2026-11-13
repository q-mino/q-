import { z } from 'zod'
import * as accounts from '../@auth/@accounts/_index.ts'

// The values of the persona base (D78.7, DOM-25): above every hat, what every
// persona takes from the entry.

/**
 * Who asks, from verified credentials (PER-4): an account, or an anonymous
 * session (D78.7). The entry gives it to every persona, whatever the hat; the
 * node of a persona verifies its hat (PER-7). `visitor` may read its id,
 * opaque, never which of the two it is (PER-1, D78).
 */
export const caller = z.discriminatedUnion('identified_by', [
  z.strictObject({ identified_by: z.literal('account'), id: accounts.account_id }),
  z.strictObject({ identified_by: z.literal('session'), id: accounts.session_id }),
])
