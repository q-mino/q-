// generated

// The use cases of `persona/visitor` from `usecase.ts` (DOM-25): the same
// objects under the same names, each schema with its output type under the same
// name, so that one import gives both. Only this module imports `usecase.ts`.

import { z } from 'zod'
import * as usecase from './usecase.ts'

/**
 * Paolo browses the shed: the tools he could borrow, by shelf, without the
 * keeper's notes, a page at a time (SC-22): 50, or as many as his phone asks,
 * up to 100. Each page says how many tools there are, and his phone asks for
 * the next when he scrolls.
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
