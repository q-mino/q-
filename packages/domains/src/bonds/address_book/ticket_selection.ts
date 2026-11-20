import { z } from 'zod'
import { selection, id, value } from './_scope_selection.ts'

// The selections over a ticket to show, the subject of this file (DOM-18): a
// ticket of the bond to be, with the face it is for (BND-8). Their value is
// the adapters'.

/** The ticket is the bond's with this id. */
export const the_ticket_has_this_id = selection({
  subject: 'ticket',
  parameters: z.strictObject({
    bond_id: id.bond_id,
  }),
})

/** The ticket is ready: shown, and used by no one yet. */
export const the_ticket_is_ready = selection({
  subject: 'ticket',
  parameters: z.strictObject({}),
})

/** The ticket's mailbox is at this deposit address: an introduction deposited there is for it. */
export const the_ticket_s_mailbox_is_at_this_address = selection({
  subject: 'ticket',
  parameters: z.strictObject({
    deposit_address: value.deposit_address,
  }),
})
