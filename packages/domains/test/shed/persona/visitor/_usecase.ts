// generated

// The use cases of `visitor` under their names (DOM-2), the leaves of its tree.

import { z } from 'zod'
import * as usecase from './usecase.ts'

/**
 * Luca browses the shed: the tools he could borrow, by shelf, without the keeper's notes.
 *
 * @see {@link usecase.the_catalogue}
 */
export const the_catalogue = usecase.the_catalogue

/**
 * The input of `the_catalogue`, declared inline.
 *
 * @see {@link usecase.the_catalogue}
 */
export const the_catalogue_input = usecase.the_catalogue.input
export type the_catalogue_input = z.output<typeof the_catalogue_input>
