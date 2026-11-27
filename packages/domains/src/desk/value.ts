import { z } from 'zod'
import { deposits, invitations } from './_scope_value.ts'

// The values of the desk (PER-19, DOM-25): above its personas, what every
// request takes from the desk's interface.

/**
 * Who comes to the counter, as the desk's interface verified it (PER-19):
 * with nothing, anyone, who may deposit, read a stand and take an
 * invitation; with the collect secret R of a mailbox, which the interface
 * turned into its deposit address D = hash(R) (V5), R never in the tree,
 * the `Caller`'s id D; or with the signature of a stand's inviter, which
 * the interface verified with the key the relay's configuration names for
 * that stand (INV-5), the `Caller` the stand it is the inviter of.
 */
export const caller = z.discriminatedUnion('shows', [
  z.strictObject({ shows: z.literal('nothing') }),
  z.strictObject({ shows: z.literal('a_collect_secret'), id: deposits.id.deposit_address }),
  z.strictObject({
    shows: z.literal('the_signature_of_a_stand_s_inviter'),
    stand: invitations.id.stand,
  }),
])
