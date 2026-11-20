import { z } from 'zod'
import { query, AND, deposit_selection, id, value } from './_scope_query.ts'

/** The envelope was left on the mailbox and is still kept. */
export const the_envelope_is_waiting_in_the_mailbox = AND({
  the_envelope_is_on_the_address: deposit_selection.the_envelope_is_on_this_address,
  the_envelope_is_kept: deposit_selection.the_envelope_is_kept,
})

/**
 * The envelopes kept on a mailbox, the oldest first; the deposit's id, the
 * entry's identity, closes the order (LIB-9). Collected as a stream from a
 * position (F5, DOM-17): a collect takes nothing away (MBX-3).
 */
export const the_envelopes_in_a_mailbox = query({
  input: z.strictObject({
    deposit_address: id.deposit_address,
  }),
  fields: value.collected_envelope,
  identity: 'id',
  selection: the_envelope_is_waiting_in_the_mailbox,
  order: { deposited_at: 'ascending' },
  creator: () => (input) => ({
    selection: {
      the_envelope_is_on_the_address: { deposit_address: input.deposit_address },
      the_envelope_is_kept: {},
    },
  }),
})
