// generated

// The use cases of `persona/known` from `usecase.ts` (DOM-25): the same objects
// under the same names, each schema with its output type under the same name,
// so that one import gives both. Only this module imports `usecase.ts`.

import { z } from 'zod'
import * as usecase from './usecase.ts'

/**
 * Bruno's phone answers Anna's question on their bond (EXT-8): of what her
 * phone says it offers him (a claim, F2), the extensions his node offers
 * back to L_a, with the majors it serves; greetings at major 1. One page,
 * every entry.
 *
 * @see {@link usecase.the_extensions_in_common}
 */
export const the_extensions_in_common = usecase.the_extensions_in_common

/**
 * The input of `the_extensions_in_common`, declared inline.
 *
 * @see {@link usecase.the_extensions_in_common}
 */
export const the_extensions_in_common_input = usecase.the_extensions_in_common.input
export type the_extensions_in_common_input = z.output<typeof the_extensions_in_common_input>
