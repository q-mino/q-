import { node, acquaintances, _persona } from './_scope_node.ts'

// The node of `known` (PER-6, PER-7): who wears it is a face whose letter
// came to the mailbox of mine of a bond kept with that face. The bond goes
// down the tree whole, for the kernel's leaves and the extensions' mounted
// folders to read (EXT-11: the kernel's adapter maps it to `boundary`'s
// bond). Its only I/O is auth's lookup; then all is pure.

/** Bruno, by his key K_b, at D_mb, the mailbox Anna keeps for him: their bond L_b. */
export const known = node({
  looks_up: {
    the_bond_of_the_caller: {
      lookup: acquaintances.lookup.the_bond_of_a_face_at_my_mailbox,
      of: _persona.dsl.a_face_at_my_mailbox,
      /**
       * No face, no bond kept at that mailbox, or one kept there with
       * another face (a known key outside its bond): "not found", no
       * reason (D87.5, PER-14), traced (F6).
       */
      when_not_known: 'not_found',
    },
  },
  gives: () => (found) => ({ bond: found.the_bond_of_the_caller }),
})
