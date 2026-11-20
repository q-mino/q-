// generated

// The facts of `bonds/address_book` from `fact.ts` (DOM-25): the same objects
// under the same names, branded with their path (DOM-24), each schema with its
// output type under the same name, so that one import gives both. Only this
// module imports `fact.ts`.

import { z } from 'zod'
import * as fact from './fact.ts'

/**
 * The user gave a bond a new name (BND-6): Anna calls Bruno "Bru". A partial
 * value, the bond's id and its name; the name Bruno is introduced as stays.
 *
 * @see {@link fact.a_bond_has_been_renamed}
 */
export const a_bond_has_been_renamed =
  fact.a_bond_has_been_renamed.brand<'bonds/address_book/fact/a_bond_has_been_renamed'>()
export type a_bond_has_been_renamed = z.output<typeof a_bond_has_been_renamed>

/**
 * The user removed a bond from her list (BND-6): a partial value, its id, its
 * new status and when. The rest of the bond stays, out of the list.
 *
 * @see {@link fact.a_bond_has_been_removed}
 */
export const a_bond_has_been_removed =
  fact.a_bond_has_been_removed.brand<'bonds/address_book/fact/a_bond_has_been_removed'>()
export type a_bond_has_been_removed = z.output<typeof a_bond_has_been_removed>

/**
 * Nothing to do (DOM-6): the bond was removed already, its first removal stands.
 *
 * @see {@link fact.a_bond_has_been_removed_again}
 */
export const a_bond_has_been_removed_again =
  fact.a_bond_has_been_removed_again.brand<'bonds/address_book/fact/a_bond_has_been_removed_again'>()
export type a_bond_has_been_removed_again = z.output<typeof a_bond_has_been_removed_again>
