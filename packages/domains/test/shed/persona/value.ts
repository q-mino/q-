import { z } from 'zod'
import { accounts } from './_scope_value.ts'

// The values of the persona base (D78.7, DOM-25): above every hat, what every
// persona takes from the entry.

/**
 * Who asks, from verified credentials (PER-4): an account, or an anonymous
 * session (D78.7), a person signed in or not; or a key the shed gave a
 * system outside it, which signs its calls (SC-34, D88.1, D91.1): neither a
 * person nor an internal entry (PER-12), an actor from outside. The entry
 * gives it to every persona, whatever the hat; the node of a persona
 * verifies its hat (PER-7). `visitor` may read its id, opaque, never which
 * of the three it is (PER-1, D78).
 */
export const caller = z.discriminatedUnion('identified_by', [
  z.strictObject({ identified_by: z.literal('account'), id: accounts.id.account_id }),
  z.strictObject({ identified_by: z.literal('session'), id: accounts.id.session_id }),
  z.strictObject({ identified_by: z.literal('key'), id: accounts.id.key_id }),
])
