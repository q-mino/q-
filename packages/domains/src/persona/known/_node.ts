// generated

// The node of `persona/known` from `node.ts` (DOM-25): the same objects under
// the same names, each schema with its output type under the same name, so that
// one import gives both. Only this module imports `node.ts`.

import type * as zz from '../../library/index.ts'
import * as node from './node.ts'

/**
 * Bruno, by his key K_b, at D_mb, the mailbox Anna keeps for him: their bond L_b.
 *
 * @see {@link node.known}
 */
export const known = node.known

/** The context the node `known` gives to everything below it. */
export type known_context = zz.ContextOf<typeof known>

/** How the node `known` and the nodes above it may close a request (PER-14), for the leaves below it. */
export type known_closes = zz.ClosesOf<typeof known>

/** What the node `known` and the nodes above it add to the commands below it (D105, SC-31). */
export type known_accumulated = zz.AccumulatedOf<typeof known>
