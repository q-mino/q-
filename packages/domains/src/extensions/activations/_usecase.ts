// generated

// The use cases of `extensions/activations` from `usecase.ts` (DOM-25): the
// same objects under the same names, each schema with its output type under the
// same name, so that one import gives both. Only this module imports
// `usecase.ts`.

import * as usecase from './usecase.ts'

/**
 * An extension is activated, its manifest accepted.
 *
 * @see {@link usecase.activate_an_extension}
 */
export const activate_an_extension = usecase.activate_an_extension

/**
 * An extension is deactivated.
 *
 * @see {@link usecase.deactivate_an_extension}
 */
export const deactivate_an_extension = usecase.deactivate_an_extension

/**
 * The offer of an extension is withdrawn from a bond.
 *
 * @see {@link usecase.withdraw_the_offer_from_a_bond}
 */
export const withdraw_the_offer_from_a_bond = usecase.withdraw_the_offer_from_a_bond

/**
 * An extension is offered to a bond again.
 *
 * @see {@link usecase.offer_an_extension_to_a_bond}
 */
export const offer_an_extension_to_a_bond = usecase.offer_an_extension_to_a_bond

/**
 * A bond is asked for the extensions in common.
 *
 * @see {@link usecase.ask_a_bond_for_the_extensions_in_common}
 */
export const ask_a_bond_for_the_extensions_in_common =
  usecase.ask_a_bond_for_the_extensions_in_common

/**
 * What came back of a question about the extensions in common is learned: the return of the request.
 *
 * @see {@link usecase.learn_the_extensions_in_common}
 */
export const learn_the_extensions_in_common = usecase.learn_the_extensions_in_common

/**
 * An installed extension, with whether it is active.
 *
 * @see {@link usecase.an_extension}
 */
export const an_extension = usecase.an_extension

/**
 * The extensions offered to a bond.
 *
 * @see {@link usecase.the_extensions_offered_to_a_bond}
 */
export const the_extensions_offered_to_a_bond = usecase.the_extensions_offered_to_a_bond

/**
 * The extensions in common with a bond, for what its face offers.
 *
 * @see {@link usecase.the_extensions_in_common}
 */
export const the_extensions_in_common = usecase.the_extensions_in_common
