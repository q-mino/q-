// generated

// The node of `workshop` (PER-6), with the context it gives.

import type * as wlib from '../../wlib.ts'
import * as node from './node.ts'

/**
 * Rossi's workshop, by its system, with the key `K-ROSSI`: Marta, Luca and Giorgio are not found here.
 *
 * @see {@link node.workshop}
 */
export const workshop = node.workshop

/** The context the node `workshop` gives to everything below it. */
export type workshop_context = wlib.ContextOf<typeof workshop>

/** How the node `workshop` and the nodes above it may close a request (PER-14), for the leaves below it. */
export type workshop_closes = wlib.ClosesOf<typeof workshop>
