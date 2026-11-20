import { z } from 'zod'
import { selection, id, value } from './_scope_selection.ts'

// The selections over a bond, the subject of this file (DOM-18): predicates
// over the bond a query looks at, which they do not name. Their value is
// the adapters'.

/** The bond has this id. */
export const the_bond_has_this_id = selection({
  subject: 'bond',
  parameters: z.strictObject({
    bond_id: id.bond_id,
  }),
})

/** The bond is in the user's list. */
export const the_bond_is_kept = selection({
  subject: 'bond',
  parameters: z.strictObject({}),
})

/** My mailbox of the bond is at this deposit address: a letter deposited there is for this bond. */
export const my_mailbox_of_the_bond_is_at_this_address = selection({
  subject: 'bond',
  parameters: z.strictObject({
    deposit_address: value.deposit_address,
  }),
})

/** The bond's ticket is ready: its mailbox is collected for an introduction (BND-11). */
export const its_ticket_is_ready = selection({
  subject: 'bond',
  parameters: z.strictObject({}),
})
