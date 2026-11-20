// generated

// The values of `desk` from `value.ts` (DOM-25): the same objects under the
// same names, each schema with its output type under the same name, so that one
// import gives both. Only this module imports `value.ts`.

import { z } from 'zod'
import * as value from './value.ts'

/**
 * Who comes to the counter, as the desk's interface verified it (PER-19):
 * with nothing, anyone, who may deposit; or with the collect secret R of a
 * mailbox, which the interface turned into its deposit address D = hash(R)
 * (V5). R never enters the tree: the `Caller`'s id is D.
 *
 * @see {@link value.caller}
 */
export const caller = value.caller
export type caller = z.output<typeof caller>
