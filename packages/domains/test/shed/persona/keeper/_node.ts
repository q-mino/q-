// generated

// The node of `keeper` (PER-6), with the context it gives.

import type * as wlib from '../../wlib.ts'
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
