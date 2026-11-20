// generated

// The node of `persona/self` from `node.ts` (DOM-25): the same objects under
// the same names, each schema with its output type under the same name, so that
// one import gives both. Only this module imports `node.ts`.

import type * as zz from '../../library/index.ts'
import * as node from './node.ts'

/**
 * Anna on her phone: Bruno's letter, signed or not, is not found here.
 *
 * @see {@link node.self}
 */
export const self = node.self

/** The context the node `self` gives to everything below it. */
export type self_context = zz.ContextOf<typeof self>

/** How the node `self` and the nodes above it may close a request (PER-14), for the leaves below it. */
export type self_closes = zz.ClosesOf<typeof self>

/** What the node `self` and the nodes above it add to the commands below it (D105, SC-31). */
export type self_accumulated = zz.AccumulatedOf<typeof self>
