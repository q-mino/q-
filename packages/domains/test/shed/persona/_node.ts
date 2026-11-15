// generated

// The node of the persona base (PER-6), with the context it gives.

import type * as wlib from '../wlib.ts'
import * as node from './node.ts'

/**
 * Whoever asks, Marta signed in or Luca with no account: the `Caller`, verified.
 *
 * @see {@link node.persona}
 */
export const persona = node.persona

/** The context the node `persona` gives to every persona below it. */
export type persona_context = wlib.ContextOf<typeof persona>

/** How the node `persona` and the nodes above it may close a request (PER-14), for the leaves below it. */
export type persona_closes = wlib.ClosesOf<typeof persona>
