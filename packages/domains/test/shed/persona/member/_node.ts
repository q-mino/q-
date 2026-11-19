// generated

// The node of `persona/member` from `node.ts` (DOM-25): the same objects under
// the same names, each schema with its output type under the same name, so that
// one import gives both. Only this module imports `node.ts`.

import type * as zz from '../../../../src/library/index.ts'
import * as node from './node.ts'

/**
 * Marta, card M-12, valid until 31 March 2027.
 *
 * @see {@link node.member}
 */
export const member = node.member

/** The context the node `member` gives to everything below it. */
export type member_context = zz.ContextOf<typeof member>

/** How the node `member` and the nodes above it may close a request (PER-14), for the leaves below it. */
export type member_closes = zz.ClosesOf<typeof member>

/** What the node `member` and the nodes above it add to the commands below it (D105, SC-31). */
export type member_accumulated = zz.AccumulatedOf<typeof member>
