// generated

// The values of `desk/passer_by` from `value.ts` (DOM-25): the same objects
// under the same names, each schema with its output type under the same name,
// so that one import gives both. Only this module imports `value.ts`.

import { z } from 'zod'
import * as value from './value.ts'

/**
 * A ticket as a passer-by takes it: the text after `ticket=` in its link, base64url, at most 4 096 characters.
 *
 * @see {@link value.ticket}
 */
export const ticket = value.ticket
export type ticket = z.output<typeof ticket>
