// generated

// The values of `persona/known` from `value.ts` (DOM-25): the same objects
// under the same names, each schema with its output type under the same name,
// so that one import gives both. Only this module imports `value.ts`.

import { z } from 'zod'
import * as value from './value.ts'

/**
 * A greeting, as the peer writes it.
 *
 * @see {@link value.greeting}
 */
export const greeting = value.greeting
export type greeting = z.output<typeof greeting>
