import { z } from 'zod'
import { read_use_case_over, value, _desk, deposits } from './_scope_usecase.ts'
import * as zz from '../../library/index.ts'

// The use cases of `holder`, the leaves of its tree (PER-6, PER-19): who
// collects from a mailbox with its collect secret R (V5). A collect takes
// nothing away (MBX-3): the envelopes stay until their seven days are over.

/**
 * Bruno's phone collects his mailbox from where it left off (F5, DOM-17):
 * with no position, the envelopes kept on his D and the position they are
 * at, then each one deposited after it, live; from a position, the stream
 * alone. The phone keeps the last position it read, and compares positions
 * only by order. An envelope discarded after its seven days leaves the
 * mailbox. The address is the one the phone names, and the secret it shows
 * must be that mailbox's: with another one's R, refused.
 */
export const collect_the_envelopes = read_use_case_over({
  use_case: deposits.usecase.the_envelopes_in_a_mailbox,
  input: z.strictObject({
    deposit_address: deposits.id.deposit_address,
  }),
  is_refused_unless: {
    /** Bruno's R opens his mailbox, not Anna's. */
    the_collect_secret_is_the_mailboxs: (context) => (input) =>
      _desk.dsl.the_caller_holds_the_mailbox(context.caller)(input.deposit_address),
  },
  creator: () => (input) => ({ query: { deposit_address: input.deposit_address } }),
  entry: z.strictObject({
    deposit_id: deposits.id.deposit_id,
    deposited_at: zz.date_time,
    envelope: value.envelope,
  }),
  projection: (entry) => ({
    deposit_id: entry.id,
    deposited_at: entry.deposited_at,
    envelope: entry.envelope,
  }),
  stream: { identity: 'deposit_id' },
})
