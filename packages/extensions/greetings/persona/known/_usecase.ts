// generated

// The use cases of `persona/known` from `usecase.ts` (DOM-25): the same objects
// under the same names, each schema with its output type under the same name,
// so that one import gives both. Only this module imports `usecase.ts`.

import { z } from 'zod'
import * as usecase from './usecase.ts'

/**
 * Anna's greeting reaches Bruno's node on their bond (F7): the office
 * greets her back, and the leaf answers with its words, the response to her
 * request.
 *
 * @see {@link usecase.greet}
 */
export const greet = usecase.greet

/**
 * The input of `greet`, declared inline.
 *
 * @see {@link usecase.greet}
 */
export const greet_input = usecase.greet.input
export type greet_input = z.output<typeof greet_input>
