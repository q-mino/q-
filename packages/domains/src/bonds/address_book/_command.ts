// generated

// The commands of `bonds/address_book` from `command.ts` (DOM-25): the same
// objects under the same names, each schema with its output type under the same
// name, so that one import gives both. Only this module imports `command.ts`.

import { z } from 'zod'
import * as command from './command.ts'

/**
 * Anna calls Bruno "Bru" on her phone (BND-6): the name she gives the bond,
 * hers only. The name Bruno is introduced as stays beside it, and nothing
 * goes to him. A bond she removed has no name to change: refused.
 *
 * @see {@link command.rename_a_bond}
 */
export const rename_a_bond = command.rename_a_bond

/**
 * The input of `rename_a_bond`, declared inline.
 *
 * @see {@link command.rename_a_bond}
 */
export const rename_a_bond_input = command.rename_a_bond.input
export type rename_a_bond_input = z.output<typeof rename_a_bond_input>

/**
 * Anna removes Bruno from her list (BND-6), the screens' "Elimina e basta":
 * her phone collects his mailbox no more, and tells him nothing. A bond
 * removed already records that nothing changes (DOM-6).
 *
 * @see {@link command.remove_a_bond}
 */
export const remove_a_bond = command.remove_a_bond

/**
 * The input of `remove_a_bond`, declared inline.
 *
 * @see {@link command.remove_a_bond}
 */
export const remove_a_bond_input = command.remove_a_bond.input
export type remove_a_bond_input = z.output<typeof remove_a_bond_input>
