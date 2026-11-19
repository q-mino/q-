// Shed's wished library (DOM-25): the library Shed asks for, the requirement
// of the library's steps of the plan. Since part 3.1 the library's types are
// in `domains/src/library/` (zen0), with the values that already had a body:
// this file re-exports it, and declares with no body what is still to be
// built, grouped by the part of the plan that gives each its body. Each part
// moves its declarations into the library, so that its diff shows them leave;
// at 7.5 Shed imports the library and this file is deleted (`docs/plan.md`).

import type {
  Clock,
  Operation,
  ReactionConsumers,
  ReactionState,
  ReactionWirings,
  Registry,
  Versions,
} from '../../src/library/index.ts'

export * from '../../src/library/index.ts'

// Part 7.3, the reactions.

/**
 * A reaction's operation (DOM-16, D91.3, LIB-10): its scope the reaction's
 * path ("system · reaction R"), its id a stable function of the library over
 * that path, the operation that recorded the fact (DOM-10) and the part the
 * reaction reacts to, by its position in the fact (D113.3), so that a fact
 * delivered again is the duplicate branch (DOM-11): Luca retires the ladder,
 * the consumer falls before saving its position, the fact comes again, one
 * work sheet (TST-4). In the stability corpus: it never changes once
 * released.
 */
export declare const reaction_operation: (
  reaction: string,
) => (delivered: { readonly operation: Operation; readonly part: number }) => Operation

/**
 * The consumers of a set of reactions (DOM-16, PER-12, D89.6): internal
 * entries, not personas, one durable consumer per reaction, its own delivery
 * unit, with its own position and dead letters. Each reads its fact log from
 * its position (the first fact the log keeps, with none: in Shed every
 * reaction is there from the start; where a reaction added later starts is
 * the deployment's, D64.3), in the order of the log, so in order per
 * resource; skips the parts of other paths; for each part of its path, in
 * the order of the parts (DOM-16: at most one command per part), read at
 * the current shape (`Versions`: Marta's damaged return, recorded at 1.x
 * and delivered after 2.0.0), translates it purely (D89.3) and invokes its use case with `reaction_operation` over
 * the fact's operation and the part, and the clock's context; a part
 * translated to `nothing` invokes nothing (D88.2). Then, by the outcome of
 * each:
 * - applied (an exact duplicate too, the recorded fact): the next part;
 * - rejected, identity already used: to its dead letter, then the next part;
 * - a technical abort (the port fails, the process falls): it does not
 *   advance, and delivers the fact again from its position (D65.6), the
 *   duplicate branch covering the parts already applied.
 * After the last part it advances.
 * A dead letter holds its part's resources for its reaction (D94.7, D67.3;
 * SC-42): a later part of the reaction's path that touches one of them, by
 * the resources in its envelope (D107), is not delivered; it waits behind
 * (`WaitingPart`), and holds its own resources in turn, so that no part of
 * one of them overtakes it. A part translated to `nothing` waits the same:
 * the hold is by resource, never by what a translation would give. The
 * position goes on past a held part, and the other resources flow: a dead
 * letter stops its resources, never its reaction, nor the other reactions
 * (D89.6). When a letter is delivered at last or discarded
 * (`ReactionConsumers`), the consumer delivers the parts waiting behind it
 * that nothing held before them still holds, in the order of the log, each
 * as a part met for the first time; one refused becomes a dead letter in
 * its place. It reads what it holds from its state when it starts. A
 * consumer that tolerates reordering (D67.3) comes with its case.
 * The contract is the order per resource, not a total one: a
 * consumer may deliver facts of disjoint resources in parallel (partitions
 * by resource, one consumer active per partition at a time, else two
 * instances may swap two facts of one tool), its position then the
 * partition's: the library's and the adapter's, not the domain's (A, 16
 * Nov 2026); what a reaction holds is the reaction's, whatever its
 * partitions. Curried as `effect_executor`: the registry of the
 * reactions; their wirings; the state and the clock.
 */
export declare function reaction_consumers<const registry extends Registry>(reactions: {
  readonly registry: registry
  readonly versions: Versions
}): (
  wirings: ReactionWirings<registry>,
) => (ports: { readonly state: ReactionState; readonly clock: Clock }) => ReactionConsumers
