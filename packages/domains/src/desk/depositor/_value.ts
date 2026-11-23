// generated

// The values of `desk/depositor` from `value.ts` (DOM-25): the same objects
// under the same names, each schema with its output type under the same name,
// so that one import gives both. Only this module imports `value.ts`.

import { z } from 'zod'
import * as value from './value.ts'

/**
 * An envelope as a depositor leaves it: sealed, in base64url, at most 64 KiB once decoded.
 *
 * @see {@link value.envelope}
 */
export const envelope = value.envelope
export type envelope = z.output<typeof envelope>
