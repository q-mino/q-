import { node, acquaintances, _persona } from './_scope_node.ts'

// The node of `unknown` (PER-6, PER-7, PER-11): who wears it is a face that
// presents a ticket of mine at its mailbox, a ready ticket, or the bond
// kept there with that face (the crossed QR). The ticket goes down whole:
// the bond to be, my face, and the key that signed the letter, which the
// leaf gives the business as their face's key (PER-8). Its only I/O is
// auth's lookup; then all is pure.

/** Dario, by his key K_d, at the mailbox of Carla's ready ticket: the bond to be. */
export const unknown = node({
  looks_up: {
    the_ticket_of_the_caller: {
      lookup: acquaintances.lookup.the_ticket_a_face_presents_at_my_mailbox,
      of: _persona.dsl.a_face_at_my_mailbox,
      /**
       * No face, or no ready ticket and no bond with that face at that
       * mailbox: "not found", no reason (D87.5, PER-14), traced (F6).
       */
      when_not_known: 'not_found',
    },
  },
  gives: () => (found) => ({ ticket: found.the_ticket_of_the_caller }),
})
