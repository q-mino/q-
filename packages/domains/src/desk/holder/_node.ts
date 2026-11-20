// generated

// The node of `desk/holder` from `node.ts` (DOM-25): the same objects under the
// same names, each schema with its output type under the same name, so that one
// import gives both. Only this module imports `node.ts`.

import type * as zz from '../../library/index.ts'
import * as node from './node.ts'

/**
 * Bruno's phone, with the R of his mailbox: who shows none is not found here.
 *
 * @see {@link node.holder}
 */
export const holder = node.holder

/** The context the node `holder` gives to everything below it. */
export type holder_context = zz.ContextOf<typeof holder>

/** How the node `holder` and the nodes above it may close a request (PER-14), for the leaves below it. */
export type holder_closes = zz.ClosesOf<typeof holder>

/** What the node `holder` and the nodes above it add to the commands below it (D105, SC-31). */
export type holder_accumulated = zz.AccumulatedOf<typeof holder>
