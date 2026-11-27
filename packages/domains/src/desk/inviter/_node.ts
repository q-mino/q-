// generated

// The node of `desk/inviter` from `node.ts` (DOM-25): the same objects under
// the same names, each schema with its output type under the same name, so that
// one import gives both. Only this module imports `node.ts`.

import type * as zz from '../../library/index.ts'
import * as node from './node.ts'

/**
 * The assistant, signing with its stand's key: who shows no such signature is not found here.
 *
 * @see {@link node.inviter}
 */
export const inviter = node.inviter

/** The context the node `inviter` gives to everything below it. */
export type inviter_context = zz.ContextOf<typeof inviter>

/** How the node `inviter` and the nodes above it may close a request (PER-14), for the leaves below it. */
export type inviter_closes = zz.ClosesOf<typeof inviter>

/** What the node `inviter` and the nodes above it add to the commands below it (D105, SC-31). */
export type inviter_accumulated = zz.AccumulatedOf<typeof inviter>
