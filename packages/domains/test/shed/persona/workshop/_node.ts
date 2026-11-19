// generated

// The node of `persona/workshop` from `node.ts` (DOM-25): the same objects
// under the same names, each schema with its output type under the same name,
// so that one import gives both. Only this module imports `node.ts`.

import type * as wlib from '../../../../src/library/index.ts'
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

/** What the node `workshop` and the nodes above it add to the commands below it (D105, SC-31). */
export type workshop_accumulated = wlib.AccumulatedOf<typeof workshop>
