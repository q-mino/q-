// generated

// The node of `desk` from `node.ts` (DOM-25): the same objects under the same
// names, each schema with its output type under the same name, so that one
// import gives both. Only this module imports `node.ts`.

import type * as zz from '../library/index.ts'
import * as node from './node.ts'

/**
 * Whoever comes to the relay's counter, with a collect secret, an inviter's signature, or nothing.
 *
 * @see {@link node.desk}
 */
export const desk = node.desk

/** The context the node `desk` gives to everything below it. */
export type desk_context = zz.ContextOf<typeof desk>

/** How the node `desk` and the nodes above it may close a request (PER-14), for the leaves below it. */
export type desk_closes = zz.ClosesOf<typeof desk>

/** What the node `desk` and the nodes above it add to the commands below it (D105, SC-31). */
export type desk_accumulated = zz.AccumulatedOf<typeof desk>
