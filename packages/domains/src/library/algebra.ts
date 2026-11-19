import type * as z from 'zod'
import type { Component, PathOf } from './component.ts'
import type { Direction } from './query.ts'

// The algebras of an adapter (ADP-8, LIB-14): the operators of the conditions
// and a fragment per predicate, in the adapter's own language, and the
// comparison with a cursor (DOM-20, SC-22). One way, recommended, not
// required.

/**
 * The adapter's fragment for each predicate, under its path, from its parsed
 * parameters: a SQL condition, a MongoDB filter, a function over a
 * transaction. Exhaustive: a forgotten predicate does not compile.
 */
export type PredicateFragments<predicates extends Component, fragment> = {
  readonly [predicate in predicates as PathOf<predicate>]: (
    parameters: z.output<predicate>,
  ) => fragment
}

/**
 * How the adapter composes its fragments: one per predicate, and the boolean
 * operators. One algebra over the predicates serves every command, one over
 * the selection predicates of a subject every query (V12): each has one
 * translation in an adapter (ADP-8).
 */
export interface Algebra<predicates extends Component, fragment> {
  readonly predicate: PredicateFragments<predicates, fragment>
  readonly and: (components: readonly fragment[]) => fragment
  readonly or: (components: readonly fragment[]) => fragment
  readonly not: (operand: fragment) => fragment
}

/**
 * A field of the order key after which a step chooses (DOM-20, D109), or a
 * page starts (SC-22): the adapter's fragment of the field, its direction,
 * and its value, which the library decodes from the cursor (D114).
 */
export interface OrderKeyValue<field> {
  readonly field: field
  readonly direction: Direction
  readonly value: unknown
}

/**
 * The operators of a selection walked by a cursor, a step's instances
 * (DOM-20) or a query's pages (SC-22): a query's, and the comparison with the
 * cursor (`after`): the candidates after the order key, its fields then the
 * identity, lexicographic, a descending field reversed, in the value order of
 * LIB-9. One translation, reused by every step and every query (ADP-8).
 */
export interface CursorAlgebra<predicates extends Component, selection, field> extends Algebra<
  predicates,
  selection
> {
  readonly after: (key: readonly OrderKeyValue<field>[]) => selection
}
