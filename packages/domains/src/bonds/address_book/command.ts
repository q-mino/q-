import { z } from 'zod'
import { command, id, fact, predicate, value } from './_scope_command.ts'

/**
 * Anna calls Bruno "Bru" on her phone (BND-6): the name she gives the bond,
 * hers only. The name Bruno is introduced as stays beside it, and nothing
 * goes to him. A bond she removed has no name to change: refused.
 */
export const rename_a_bond = command({
  input: z.strictObject({
    bond_id: id.bond_id,
    name: value.bond_name,
  }),
  outcomes: {
    the_bond_is_kept_so_it_is_renamed: [predicate.the_bond_is_kept, fact.a_bond_has_been_renamed],
  },
  creator: () => (input) => ({
    the_bond_is_kept_so_it_is_renamed: [
      { bond_id: input.bond_id },
      { renamed_bond: { id: input.bond_id, name: input.name } },
    ],
  }),
})

/**
 * Anna removes Bruno from her list (BND-6), the screens' "Elimina e basta":
 * her phone collects his mailbox no more, and tells him nothing. A bond
 * removed already records that nothing changes (DOM-6).
 */
export const remove_a_bond = command({
  input: z.strictObject({
    bond_id: id.bond_id,
  }),
  outcomes: {
    the_bond_is_kept_so_it_is_removed: [predicate.the_bond_is_kept, fact.a_bond_has_been_removed],
    the_bond_is_removed_already_so_nothing_changes: [
      predicate.the_bond_is_removed,
      fact.a_bond_has_been_removed_again,
    ],
  },
  creator: (context) => (input) => ({
    the_bond_is_kept_so_it_is_removed: [
      { bond_id: input.bond_id },
      { removed_bond: { id: input.bond_id, status: 'removed', removed_at: context.now } },
    ],
    the_bond_is_removed_already_so_nothing_changes: [
      { bond_id: input.bond_id },
      { bond_id: input.bond_id },
    ],
  }),
})
