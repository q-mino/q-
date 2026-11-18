import { node, accounts, _persona } from './_scope_node.ts'

// The node of `workshop` (PER-6, D88.1, D91.1): an actor from outside, a
// system with a key the shed gave it, which wears the hat `workshop` (PER-7).
// It gives nothing more: one workshop repairs for the shed, and its leaves
// read no value of auth. Its only I/O is the lookup of auth; then all is pure.

/** Rossi's workshop, by its system, with the key `K-ROSSI`: Marta, Luca and Giorgio are not found here. */
export const workshop = node({
  looks_up: {
    the_hats_of_the_caller: {
      lookup: accounts.lookup.the_hats_of_a_key,
      of: _persona.dsl.the_key_of_the_caller,
      /** A person, or a key the shed did not give: "not found", no reason (D87.5, PER-14). */
      when_not_known: 'not_found',
    },
  },
  is_found_only_if: {
    the_caller_wears_the_hat_of_workshop: () => (found) =>
      found.the_hats_of_the_caller.includes('workshop'),
  },
})
