// generated

// The node of `member` (PER-6), with the context it gives.

import type * as wlib from '../../wlib.ts'
import * as node from './node.ts'

/**
 * Marta, card M-12, valid until 31 March 2027: she may borrow today.
 *
 * @see {@link node.member}
 */
export const member = node.member

/** The context the node `member` gives to everything below it. */
export type member_context = wlib.ContextOf<typeof member>
