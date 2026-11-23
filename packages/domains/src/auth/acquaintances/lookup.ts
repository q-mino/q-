import { lookup, value } from './_scope_lookup.ts'

// The lookups of the acquaintances (PER-9, GR-4): one key, one value or "not
// known". The node of a persona reads the bond or the ticket of the face
// that signed a letter at the mailbox it came to; the kernel's entry reads
// what the node offers that bond (EXT-6). Their data is the adapters', over
// the read use cases of `bonds` and `extensions`; the comparisons are the
// nodes' and the kernel's, never auth's.

/**
 * The bond kept at a mailbox of mine whose face is that key: Bruno's K_b at
 * D_mb gives L_b, Anna's face F_a, "Bruno". Not known when no bond is kept
 * at that mailbox, or the one kept there is another face's: Bruno's key at
 * D_mc, the mailbox of Anna's bond with Carla, is a known key outside its
 * bond.
 */
export const the_bond_of_a_face_at_my_mailbox = lookup({
  key: value.a_face_at_my_mailbox,
  value: value.bond_of_a_face,
})

/**
 * The ticket a face presents at a mailbox of mine: Dario's K_d at the
 * mailbox of Carla's ready ticket gives the bond to be and her face; at
 * the mailbox of a bond kept with that face (the crossed QR), that bond.
 * Not known when neither a ready ticket nor a bond with that face is at
 * that mailbox.
 */
export const the_ticket_a_face_presents_at_my_mailbox = lookup({
  key: value.a_face_at_my_mailbox,
  value: value.ticket_a_face_presents,
})

/**
 * The extensions the node offers to the bond of a key (EXT-6): Bruno's K_b
 * at D_mb, greetings at major 1. Not known when the face has no bond kept
 * at that mailbox (the routing then stays silent: not offered, F8); an
 * empty list when the bond has none offered. Read by the kernel's entry
 * before the gate, not by a node.
 */
export const the_extensions_offered_to_the_bond_of_a_key = lookup({
  key: value.a_face_at_my_mailbox,
  value: value.extensions_offered,
})
