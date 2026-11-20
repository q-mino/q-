import { z } from 'zod'
import { selection, id } from './_scope_selection.ts'

// The selections over a deposit, the subject of this file (DOM-18):
// predicates over the deposit a query looks at, which they do not name.
// Their value is the adapters'.

/** The envelope was left on this deposit address. */
export const the_envelope_is_on_this_address = selection({
  subject: 'deposit',
  parameters: z.strictObject({
    deposit_address: id.deposit_address,
  }),
})

/** The envelope is still kept: its seven days are running. */
export const the_envelope_is_kept = selection({
  subject: 'deposit',
  parameters: z.strictObject({}),
})
