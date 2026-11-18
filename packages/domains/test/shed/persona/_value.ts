// generated

// The value schemas of the persona base under their names, with their output
// types under the same names: one import gives both.

import { z } from 'zod'
import * as value from './value.ts'

/**
 * Who asks, from verified credentials (PER-4): an account, or an anonymous
 * session (D78.7), a person signed in or not; or a key the shed gave a
 * system outside it, which signs its calls (SC-34, D88.1, D91.1): neither a
 * person nor an internal entry (PER-12), an actor from outside. The entry
 * gives it to every persona, whatever the hat; the node of a persona
 * verifies its hat (PER-7). `visitor` may read its id, opaque, never which
 * of the three it is (PER-1, D78).
 *
 * @see {@link value.caller}
 */
export const caller = value.caller
export type caller = z.output<typeof caller>
