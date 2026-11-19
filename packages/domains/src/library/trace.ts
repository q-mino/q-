import type { Semver } from './format.ts'
import type { Operation, correlation } from './context.ts'

// The trace of a tree (F6, PER-14, D54, D106; part 6.2): what a request
// answered with no fact leaves behind, for the user of the node. A caller
// reads what its leaf's words tell (`not_found`, no reason); the trace keeps
// what the library knows of why. Eventual and without guarantees: no
// position, no delivery promised, never atomic with anything; the fact is
// what counts, never the trace (D54).

/**
 * A field of a request's input that its schema refused (D106.3: which
 * field, which rule): where in the input, the rule's code, its message.
 */
export interface TracedIssue {
  readonly field: readonly (string | number)[]
  readonly rule: string
  readonly message: string
}

/** A lookup of a node not known (D30, D87.5): its name, and whether its key or its value was not known. */
export interface NotKnown {
  readonly lookup: string
  readonly not_known: 'key' | 'value'
}

/**
 * A predicate a business rejection names (DOM-6, D105.4): its branch, none
 * for a path's, its components' names, its path. A leaf's projection may
 * tell its caller less (`the_tool_is_not_available`); the trace keeps them.
 */
export interface TracedFailure {
  readonly branch?: string
  readonly components: readonly string[]
  readonly predicate: string
}

/**
 * Why a request was answered with no fact, by the check of PER-5 that closed
 * it, named as the library knows it:
 *
 * - `the_gate`: the version the message carries out of the tree's window
 *   (PER-17, part 6.4), with the version the tree speaks and its oldest
 *   major, as the caller reads them;
 * - `not_a_leaf`: the major the version picks has no leaf at the path
 *   (D106.3, D72.7: a leaf added at a later major);
 * - `the_input`: the leaf's input not in its schema, each field and rule
 *   (D106.3); for a leaf whose input names its operation, one that names
 *   none (SC-34); at a past major, the input of the request's major, or the
 *   next major's it goes forward to (`to_next`, PER-17);
 * - `a_lookup`: a node's lookups not known, a perimeter (D87.5), each named;
 * - `a_perimeter`: a node's perimeter, the first that fails (PER-14);
 * - `limits`: a node's or the leaf's limits, every failed one, by the path
 *   of where they stand (PER-5.5);
 * - `the_business`: the use case below, a command's rejection with every
 *   predicate it names, the identity already used (DOM-11), or an input or
 *   a cursor it does not take (DOM-21, SC-22).
 */
export type TraceReason =
  | { readonly closed_by: 'the_gate'; readonly current: Semver; readonly oldest: number }
  | { readonly closed_by: 'not_a_leaf'; readonly major: number }
  | { readonly closed_by: 'the_input'; readonly issues: readonly TracedIssue[] }
  | { readonly closed_by: 'a_lookup'; readonly node: string; readonly lookups: readonly NotKnown[] }
  | { readonly closed_by: 'a_perimeter'; readonly node: string; readonly perimeter: string }
  | { readonly closed_by: 'limits'; readonly at: string; readonly reasons: readonly string[] }
  | {
      readonly closed_by: 'the_business'
      readonly outcome:
        | { readonly outcome: 'rejected'; readonly failures: readonly TracedFailure[] }
        | { readonly outcome: 'identity_already_used' }
        | {
            readonly outcome: 'invalid_request'
            readonly reason: 'input_not_in_schema' | 'cursor_not_in_schema'
          }
    }

/**
 * An entry of a tree's trace (F6, PER-14, D54, D56, D106.3; part 6.2): a
 * request the tree answered with no fact, as an event with its envelope
 * (D54): the leaf it invoked, by its path (the hat its segment, PER-7);
 * what the entry gave the top, the `Caller` with the request's `now`, who
 * asked and when (D56); the version the message carried; for a command, the
 * operation as far as the request named it (its scope alone when its input
 * names the id and does not parse, SC-34) and its correlation, so that a
 * retry rejected again is another entry under the same operation (D79.2:
 * the rejection stays in the trace); the input as sent, the letter as it
 * came; the event its caller read; and why (`TraceReason`), which the event
 * may hide from the caller (PER-14), never from the user of the node (F6).
 * It never leaves the node (PER-18). Only what records no fact: an applied
 * outcome is its fact, and a read answered is no rejection (D66.1: tracing
 * reads is a deployment's choice, with its case).
 */
export interface Traced<given> {
  readonly path: string
  readonly given: given
  readonly version: Semver
  readonly operation?: Operation | Pick<Operation, 'scope'>
  readonly correlation?: correlation
  readonly sent: unknown
  readonly answered: { readonly event: string }
  readonly why: TraceReason
}

/**
 * The trace of a tree, a port the configurator gives its ports (F6): the
 * library hands it each entry as it answers, and waits for nothing, so that
 * no answer depends on it; where it is kept, for how long, and whether it
 * outlives a fall are the adapter's (eventual, without guarantees, D54).
 * Every tree has one: a rejection is never lost in silence by omission.
 */
export type Trace<given> = (traced: Traced<given>) => void
