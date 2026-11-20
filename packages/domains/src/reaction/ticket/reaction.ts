import { reaction, address_book, safe } from './_scope_reaction.ts'

// The procedure of a ticket: what the offices of the node do when the user
// asks for a ticket (GR-9, DOM-16, BND-8). A standing order speaks the
// language of both offices; neither knows it.

/**
 * When the address book asks for a ticket, the safe draws the key of the
 * mailbox of the bond to be, under the bond's id (SEA-4, BND-2): Anna shows
 * Bruno her QR, and its mailbox is hers for him.
 */
export const the_safe_draws_the_key_of_the_ticket_s_mailbox = reaction({
  when: address_book.fact.a_ticket_has_been_asked_for,
  invokes: safe.usecase.draw_a_mailbox_key,
  translation: (fact) => ({ mailbox_key_id: fact.ticket_being_prepared.id }),
})

/**
 * When the safe has drawn a mailbox key, the address book keeps its D on the
 * ticket, which is ready: of the safe's fact, the key's id and its D only,
 * never its collect secret (SEA-7). In stage 1 every mailbox key of the
 * node is a ticket's (BND-7).
 */
export const the_ticket_gets_its_mailbox = reaction({
  when: safe.fact.a_mailbox_key_has_been_drawn,
  invokes: address_book.usecase.keep_the_mailbox_of_a_ticket,
  translation: (fact) => ({
    bond_id: fact.drawn_mailbox_key.id,
    deposit_address: fact.drawn_mailbox_key.deposit_address,
  }),
})
