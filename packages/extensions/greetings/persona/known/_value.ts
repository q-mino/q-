// generated

// The values of `persona/known` from `value.ts` (DOM-25): the same objects
// under the same names, each schema with its output type under the same name,
// so that one import gives both. Only this module imports `value.ts`.

import { z } from 'zod'
import * as value from './value.ts'

/**
 * The words of a greeting, as the peer writes them.
 *
 * @see {@link value.words}
 */
export const words = value.words
export type words = z.output<typeof words>
