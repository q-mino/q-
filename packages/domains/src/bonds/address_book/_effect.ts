// generated

// The effects of `bonds/address_book` from `effect.ts` (DOM-25): the same
// objects under the same names, branded with their path (DOM-24), each schema
// with its output type under the same name, so that one import gives both. Only
// this module imports `effect.ts`.

import { z } from 'zod'
import * as effect from './effect.ts'

/**
 * Wait until the ticket expires, 48 hours after it was asked for (BND-8).
 * No world: the executor gives the payload back to its return,
 * `let_a_ticket_expire`, which lets it expire only if no one used it.
 *
 * @see {@link effect.wait_until_the_ticket_expires}
 */
export const wait_until_the_ticket_expires =
  effect.wait_until_the_ticket_expires.brand<'bonds/address_book/effect/wait_until_the_ticket_expires'>()
export type wait_until_the_ticket_expires = z.output<typeof wait_until_the_ticket_expires>

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
 *
 * @see {@link effect.send_my_introduction}
 */
export const send_my_introduction =
  effect.send_my_introduction.brand<'bonds/address_book/effect/send_my_introduction'>()
export type send_my_introduction = z.output<typeof send_my_introduction>
