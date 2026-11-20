// generated

// The use cases of `persona/self` from `usecase.ts` (DOM-25): the same objects
// under the same names, each schema with its output type under the same name,
// so that one import gives both. Only this module imports `usecase.ts`.

import { z } from 'zod'
import * as usecase from './usecase.ts'

/**
 * Anna taps "Saluta" on the screen of her bond with Bruno (EXT-16): the
 * action invokes this leaf with the place's data, the bond, and her greeting
 * goes, waiting for Bruno's greeting back.
 *
 * @see {@link usecase.greet_a_bond}
 */
export const greet_a_bond = usecase.greet_a_bond

/**
 * The input of `greet_a_bond`, declared inline.
 *
 * @see {@link usecase.greet_a_bond}
 */
export const greet_a_bond_input = usecase.greet_a_bond.input
export type greet_a_bond_input = z.output<typeof greet_a_bond_input>
