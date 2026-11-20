import { z } from 'zod'
import { effect, id, value } from './_scope_effect.ts'

// The effects of the address book (DOM-13): what it asks of the world,
// queued by a branch with its fact, never run by the domain (D12).

/**
 * Wait until the ticket expires, 48 hours after it was asked for (BND-8).
 * No world: the executor gives the payload back to its return,
 * `let_a_ticket_expire`, which lets it expire only if no one used it.
 */
export const wait_until_the_ticket_expires = effect({
  payload: z.strictObject({
    bond_id: id.bond_id,
  }),
})

/**
 * Bruno's phone introduces him to Anna's ticket (BND-10): a letter of
 * introduction deposited on her ticket's mailbox, on its relays, with her
 * ticket's secret and his own ticket, the one he shows or one prepared for
 * it. `post` delivers it (F4, DOM-14, step 10), signing it with his face and
 * reading his side of the bond (`a_bond`, `my_faces`): what is not in the
 * payload, since a creator reads no state. No return: nothing comes back
 * to the address book; her letter, if any, comes in as a letter.
 */
export const send_my_introduction = effect({
  payload: z.strictObject({
    bond_id: id.bond_id,
    their_ticket: value.their_ticket,
  }),
})
