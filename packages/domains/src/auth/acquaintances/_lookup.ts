// generated

// The lookups of `auth/acquaintances` from `lookup.ts` (DOM-25): the same
// objects under the same names, each schema with its output type under the same
// name, so that one import gives both. Only this module imports `lookup.ts`.

import * as lookup from './lookup.ts'

/**
 * The bond kept at a mailbox of mine whose face is that key: Bruno's K_b at
 * D_mb gives L_b, Anna's face F_a, "Bruno". Not known when no bond is kept
 * at that mailbox, or the one kept there is another face's: Bruno's key at
 * D_mc, the mailbox of Anna's bond with Carla, is a known key outside its
 * bond.
 *
 * @see {@link lookup.the_bond_of_a_face_at_my_mailbox}
 */
export const the_bond_of_a_face_at_my_mailbox = lookup.the_bond_of_a_face_at_my_mailbox

/**
 * The ticket a face presents at a mailbox of mine: Dario's K_d at the
 * mailbox of Carla's ready ticket gives the bond to be and her face; at
 * the mailbox of a bond kept with that face (the crossed QR), that bond.
 * Not known when neither a ready ticket nor a bond with that face is at
 * that mailbox.
 *
 * @see {@link lookup.the_ticket_a_face_presents_at_my_mailbox}
 */
export const the_ticket_a_face_presents_at_my_mailbox =
  lookup.the_ticket_a_face_presents_at_my_mailbox

/**
 * The extensions the node offers to the bond of a key (EXT-6): Bruno's K_b
 * at D_mb, greetings at major 1. Not known when the face has no bond kept
 * at that mailbox (the routing then stays silent: not offered, F8); an
 * empty list when the bond has none offered. Read by the kernel's entry
 * before the gate, not by a node.
 *
 * @see {@link lookup.the_extensions_offered_to_the_bond_of_a_key}
 */
export const the_extensions_offered_to_the_bond_of_a_key =
  lookup.the_extensions_offered_to_the_bond_of_a_key
