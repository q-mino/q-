// generated

// The selection predicates of `bonds/address_book` from `bond_selection.ts`
// (DOM-25): the same objects under the same names, branded with their path
// (DOM-24), each schema with its output type under the same name, so that one
// import gives both. Only this module imports `bond_selection.ts`.

import { z } from 'zod'
import * as selection from './bond_selection.ts'

/**
 * The bond has this id.
 *
 * @see {@link selection.the_bond_has_this_id}
 */
export const the_bond_has_this_id =
  selection.the_bond_has_this_id.brand<'bonds/address_book/selection/bond/the_bond_has_this_id'>()
export type the_bond_has_this_id = z.output<typeof the_bond_has_this_id>

/**
 * The bond is in the user's list.
 *
 * @see {@link selection.the_bond_is_kept}
 */
export const the_bond_is_kept =
  selection.the_bond_is_kept.brand<'bonds/address_book/selection/bond/the_bond_is_kept'>()
export type the_bond_is_kept = z.output<typeof the_bond_is_kept>

/**
 * My mailbox of the bond is at this deposit address: a letter deposited there is for this bond.
 *
 * @see {@link selection.my_mailbox_of_the_bond_is_at_this_address}
 */
export const my_mailbox_of_the_bond_is_at_this_address =
  selection.my_mailbox_of_the_bond_is_at_this_address.brand<'bonds/address_book/selection/bond/my_mailbox_of_the_bond_is_at_this_address'>()
export type my_mailbox_of_the_bond_is_at_this_address = z.output<
  typeof my_mailbox_of_the_bond_is_at_this_address
>
