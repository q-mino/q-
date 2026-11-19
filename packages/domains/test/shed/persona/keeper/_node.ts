// generated

// The node of `persona/keeper` from `node.ts` (DOM-25): the same objects under
// the same names, each schema with its output type under the same name, so that
// one import gives both. Only this module imports `node.ts`.

import type * as wlib from '../../../../src/library/index.ts'
import * as node from './node.ts'

/**
 * Giorgio keeps the shed: Marta, a member only, is not found here.
 *
 * @see {@link node.keeper}
 */
export const keeper = node.keeper

/** The context the node `keeper` gives to everything below it. */
export type keeper_context = wlib.ContextOf<typeof keeper>

/** How the node `keeper` and the nodes above it may close a request (PER-14), for the leaves below it. */
export type keeper_closes = wlib.ClosesOf<typeof keeper>

/** What the node `keeper` and the nodes above it add to the commands below it (D105, SC-31). */
export type keeper_accumulated = wlib.AccumulatedOf<typeof keeper>
