import { z } from 'zod'
import { deposits } from './_scope_value.ts'

// The values of the desk (PER-19, DOM-25): above its two personas, what
// every request takes from the desk's interface.

/**
 * Who comes to the counter, as the desk's interface verified it (PER-19):
 * with nothing, anyone, who may deposit; or with the collect secret R of a
 * mailbox, which the interface turned into its deposit address D = hash(R)
 * (V5). R never enters the tree: the `Caller`'s id is D.
 */
export const caller = z.discriminatedUnion('shows', [
  z.strictObject({ shows: z.literal('nothing') }),
  z.strictObject({ shows: z.literal('a_collect_secret'), id: deposits.id.deposit_address }),
])
