// generated

// The node of `persona` from `node.ts` (DOM-25): the same objects under the
// same names, each schema with its output type under the same name, so that one
// import gives both. Only this module imports `node.ts`.

import type * as wlib from '../wlib.ts'
import * as node from './node.ts'

/**
 * Whoever asks, Marta signed in or Luca with no account: the `Caller`, verified.
 *
 * @see {@link node.persona}
 */
export const persona = node.persona

/** The context the node `persona` gives to everything below it. */
export type persona_context = wlib.ContextOf<typeof persona>

/** How the node `persona` and the nodes above it may close a request (PER-14), for the leaves below it. */
export type persona_closes = wlib.ClosesOf<typeof persona>

/** What the node `persona` and the nodes above it add to the commands below it (D105, SC-31). */
export type persona_accumulated = wlib.AccumulatedOf<typeof persona>
