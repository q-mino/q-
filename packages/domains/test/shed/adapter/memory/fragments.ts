// The fragments of the oracle's reads (TST-2), typed by the candidate of a
// subject (DOM-18): what each domain module declares for its subjects, what
// the read of `index.ts` runs. Each takes the state it reads.

/** A selection predicate: a condition over a candidate of its subject. */
export type Selection<state, candidate> = (state: state) => (candidate: candidate) => boolean

/** Where a query's candidates are. */
export type Source<state, candidate> = (state: state) => readonly candidate[]

/** How a field of an entry reads from a candidate. */
export type Field<state, candidate> = (state: state) => (candidate: candidate) => unknown

/** AND, OR, NOT over the selections of one subject. */
export const selection_operators = <state, candidate>() => ({
  and:
    (components: readonly Selection<state, candidate>[]): Selection<state, candidate> =>
    (state) =>
    (candidate) =>
      components.every((component) => component(state)(candidate)),
  or:
    (components: readonly Selection<state, candidate>[]): Selection<state, candidate> =>
    (state) =>
    (candidate) =>
      components.some((component) => component(state)(candidate)),
  not:
    (operand: Selection<state, candidate>): Selection<state, candidate> =>
    (state) =>
    (candidate) =>
      !operand(state)(candidate),
})
