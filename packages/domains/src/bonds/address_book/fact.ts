import { z } from 'zod'
import { fact, id, value } from './_scope_fact.ts'

// The facts of the address book carry the change of its state (DOM-5, V9):
// every value they write, and the adapters materialize it.

/**
 * The user gave a bond a new name (BND-6): Anna calls Bruno "Bru". A partial
 * value, the bond's id and its name; the name Bruno is introduced as stays.
 */
export const a_bond_has_been_renamed = fact({
  payload: z.strictObject({
    renamed_bond: value.kept_bond.pick({ id: true, name: true }),
  }),
})

/**
 * The user removed a bond from her list (BND-6): a partial value, its id, its
 * new status and when. The rest of the bond stays, out of the list.
 */
export const a_bond_has_been_removed = fact({
  payload: z.strictObject({
    removed_bond: value.removed_bond.pick({ id: true, status: true, removed_at: true }),
  }),
})

/** Nothing to do (DOM-6): the bond was removed already, its first removal stands. */
export const a_bond_has_been_removed_again = fact({
  payload: z.strictObject({
    bond_id: id.bond_id,
  }),
})
