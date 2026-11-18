import type { Component } from './component.ts'
import type { Outcomes } from './command.ts'
import type { Failure, PathFailures } from './state_adapter.ts'

// Applicability (SC-33, D47, D51): whether a command would apply, evaluated
// at a read, on each entry, by the same pass as the write (D51.1), with the
// values known at the read; the leaves whose parameters the caller gives
// later are not known (D51.3). Strong Kleene logic (D51.4); the value not
// known lives only here (D51.6).

/** A truth of an applicability: true, false, or not known before the caller gives their input (D51.4). */
export type Truth = boolean | 'not_known'

export const $GivenByTheCaller: unique symbol = Symbol('GivenByTheCaller')

/** The mark of a field the caller gives later (D51.3): opaque, carried, never read. */
export interface GivenByTheCaller {
  readonly [$GivenByTheCaller]: true
}

/** An input whose every field may be one the caller gives later. */
export type Partly<input> = { readonly [field in keyof input]: input[field] | GivenByTheCaller }

/**
 * A leaf evaluated at a read: where it stands, as a failure names it
 * (`Failure`, `PathFailure`), and whether it holds there (a NOT in its
 * components counted): a failure is a leaf that does not hold, so one
 * function of the persona reads a rejection and a row.
 */
export type Evaluated<failure> = failure & { readonly holds: Truth }

/**
 * The applicability of a command on an entry (D47.2, D51): its value
 * composed, the nodes of its path, its branches in OR and, at a leaf, its
 * limits in AND, outside (D105); the branch it would apply, when its
 * branches tell it (D51.5: every one before it false, it true), an
 * "already done" one too, which applies (D95); every leaf, each with its
 * value, a node's once, with no branch (D105); at a leaf, every limit with
 * its value. Raw, in the paper's terms: a persona projects it into its own
 * words, as a rejection (PER-18).
 */
export interface Applicability<
  outcomes extends Outcomes,
  leaves extends Component = never,
  limits extends string = never,
> {
  readonly value: Truth
  readonly branch?: Exclude<keyof outcomes, 'rejected'> & string
  readonly leaves: readonly Evaluated<Failure<outcomes> | PathFailures<leaves>>[]
  readonly limits: Readonly<Record<limits, Truth>>
}

/**
 * A field of a command's input the caller gives later, not known at the
 * read (D51.3): Marta scans, at the desk, the tool she brings back. Explicit,
 * so that a field forgotten does not become not known unannounced. The
 * library carries it through the creators to the leaves, which are not known
 * where it reaches them; a creator binds and does not read it (a choice on
 * the input is a branch's, DOM-5): one that reads it leaves every leaf of
 * the command not known, a limit that reads it its own value (D51.4). [Q, C,
 * 18 Nov 2026 (2)]
 */
export const given_by_the_caller: GivenByTheCaller = { [$GivenByTheCaller]: true }
