// generated

// The use cases of `bonds/address_book` from `usecase.ts` (DOM-25): the same
// objects under the same names, each schema with its output type under the same
// name, so that one import gives both. Only this module imports `usecase.ts`.

import * as usecase from './usecase.ts'

/**
 * The user gives a bond a name of hers.
 *
 * @see {@link usecase.rename_a_bond}
 */
export const rename_a_bond = usecase.rename_a_bond

/**
 * The user removes a bond from her list.
 *
 * @see {@link usecase.remove_a_bond}
 */
export const remove_a_bond = usecase.remove_a_bond

/**
 * The user's faces.
 *
 * @see {@link usecase.my_faces}
 */
export const my_faces = usecase.my_faces

/**
 * The user's list of bonds.
 *
 * @see {@link usecase.my_bonds}
 */
export const my_bonds = usecase.my_bonds

/**
 * A bond of the user's, whole.
 *
 * @see {@link usecase.a_bond}
 */
export const a_bond = usecase.a_bond

/**
 * The bond a letter came for, by the mailbox of mine it was deposited on.
 *
 * @see {@link usecase.the_bond_at_my_mailbox}
 */
export const the_bond_at_my_mailbox = usecase.the_bond_at_my_mailbox
