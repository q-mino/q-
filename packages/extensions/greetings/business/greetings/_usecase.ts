// generated

// The use cases of `business/greetings` from `usecase.ts` (DOM-25): the same
// objects under the same names, each schema with its output type under the same
// name, so that one import gives both. Only this module imports `usecase.ts`.

import * as usecase from './usecase.ts'

/**
 * A bond is greeted, and asked for a greeting back.
 *
 * @see {@link usecase.greet_a_bond}
 */
export const greet_a_bond = usecase.greet_a_bond

/**
 * A greeting is closed with what came back: the return of the request.
 *
 * @see {@link usecase.close_a_greeting}
 */
export const close_a_greeting = usecase.close_a_greeting

/**
 * A bond that greeted the node is greeted back.
 *
 * @see {@link usecase.greet_a_bond_back}
 */
export const greet_a_bond_back = usecase.greet_a_bond_back
