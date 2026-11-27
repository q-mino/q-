// generated

// The values of `desk` from `value.ts` (DOM-25): the same objects under the
// same names, each schema with its output type under the same name, so that one
// import gives both. Only this module imports `value.ts`.

import { z } from 'zod'
import * as value from './value.ts'

/**
 * Who comes to the counter, as the desk's interface verified it (PER-19):
 * with nothing, anyone, who may deposit, read a stand and take an
 * invitation; with the collect secret R of a mailbox, which the interface
 * turned into its deposit address D = hash(R) (V5), R never in the tree,
 * the `Caller`'s id D; or with the signature of a stand's inviter, which
 * the interface verified with the key the relay's configuration names for
 * that stand (INV-5), the `Caller` the stand it is the inviter of.
 *
 * @see {@link value.caller}
 */
export const caller = value.caller
export type caller = z.output<typeof caller>
