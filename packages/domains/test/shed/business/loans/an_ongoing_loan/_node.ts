// generated

// The node of `business/loans/an_ongoing_loan` from `node.ts` (DOM-25): the
// same objects under the same names, each schema with its output type under the
// same name, so that one import gives both. Only this module imports `node.ts`.

import type * as zz from '../../../../../src/library/index.ts'
import * as node from './node.ts'

/**
 * L7, the drill Marta took home on 2 November, due on the 16th.
 *
 * @see {@link node.an_ongoing_loan}
 */
export const an_ongoing_loan = node.an_ongoing_loan

/** The context the node `an_ongoing_loan` gives to everything below it. */
export type an_ongoing_loan_context = zz.ContextOf<typeof an_ongoing_loan>

/** How the node `an_ongoing_loan` and the nodes above it may close a request (PER-14), for the leaves below it. */
export type an_ongoing_loan_closes = zz.ClosesOf<typeof an_ongoing_loan>

/** What the node `an_ongoing_loan` and the nodes above it add to the commands below it (D105, SC-31). */
export type an_ongoing_loan_accumulated = zz.AccumulatedOf<typeof an_ongoing_loan>
