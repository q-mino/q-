// generated

// The values of `persona/known` from `value.ts` (DOM-25): the same objects
// under the same names, each schema with its output type under the same name,
// so that one import gives both. Only this module imports `value.ts`.

import { z } from 'zod'
import * as value from './value.ts'

/**
 * The text of a message, as the peer writes it (MSG-4): a plain string, no refinement (EXT-4).
 *
 * @see {@link value.text}
 */
export const text = value.text
export type text = z.output<typeof text>
