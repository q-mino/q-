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
 * Bruno's phone introduces him to Anna's ticket (BND-10): a request of the
 * kernel's to the leaf `introduce_myself` of her `unknown`, on her ticket's
 * mailbox, with her ticket's secret and his side of the bond, the name his
 * face is introduced as and his mailbox of the bond (his ticket's). Its
 * delivery is the kernel's, through its port of requests (F7, F4, DOM-14),
 * which signs it with his face; it reads his side of the bond (`a_bond`,
 * `my_faces`): what is not in the payload, since a creator reads no state.
 * No return: nothing comes back to the address book; her answer closes the
 * request, and her letters, if any, come in as letters. Its deliveries are
 * in flight together, none waiting for another's response (F7, SC-56).
 */
export const send_my_introduction = effect({
  payload: z.strictObject({
    bond_id: id.bond_id,
    their_ticket: value.their_ticket,
  }),
  order: 'any',
})
