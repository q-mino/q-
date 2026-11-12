// The state of `loans` in the in-memory oracle (TST-2). Its view of the tools
// is read from the state of `tools`: the import of `./tools.ts` is the link
// (GR-3, V11), typed, and the arrow `loans → tools` that dependency-cruiser
// shows (GR-1). Where the view of `loans` means what `tools` means, the
// fragment reuses the `dsl` of `tools`. Its reads are typed by subject
// (DOM-18): a loan, a reservation.

import type * as wlib from '../../wlib.ts'
import type * as loans_fact from '../../business/loans/fact.ts'
import type * as loans_predicate from '../../business/loans/predicate.ts'
import type { loan_id, reservation_id } from '../../business/loans/id.ts'
import type { loan, reservation } from '../../business/loans/value.ts'
import type {
  the_ongoing_loans_of_a_member,
  the_reservations_of_a_member,
} from '../../business/loans/query.ts'
import type * as loans_selection from '../../business/loans/selection/index.ts'
import type { tool_id } from '../../business/tools/id.ts'
import * as tools_dsl from '../../business/tools/dsl.ts'
import { selection_operators, type Field, type Selection, type Source } from './fragments.ts'
import type { ToolsState } from './tools.ts'

/** The loans and the reservations, by id. */
export interface LoansState {
  readonly loans: ReadonlyMap<loan_id, loan>
  readonly reservations: ReadonlyMap<reservation_id, reservation>
}

/** What the predicates of `loans` read: its state, and the state of `tools` for its view of the tools. */
type Reads = LoansState & ToolsState

const ongoing = (state: Reads): readonly loan[] =>
  [...state.loans.values()].filter((the_loan) => the_loan.progress.stage === 'ongoing')

/** Every reservation is booked until a reservation can be cancelled (step 8): then a filter on the stage. */
const booked = (state: Reads): readonly reservation[] => [...state.reservations.values()]

export const loans_fragments: wlib.PredicateFragments<
  wlib.PredicatesIn<typeof loans_predicate>,
  (state: Reads) => boolean
> = {
  // The link: the view of `loans` over the tools, read from `tools`.
  'loans/predicate/a_tool_has_this_id': (p) => (state) =>
    tools_dsl.the_tool_is_in_the_catalogue(state.tools.get(p.tool_id)),
  'loans/predicate/the_tool_is_in_service': (p) => (state) =>
    tools_dsl.the_tool_is_in_service(state.tools.get(p.tool_id)),

  'loans/predicate/a_loan_has_this_id': (p) => (state) => state.loans.has(p.loan_id),
  'loans/predicate/the_loan_is_ongoing': (p) => (state) =>
    state.loans.get(p.loan_id)?.progress.stage === 'ongoing',
  'loans/predicate/the_loan_is_returned': (p) => (state) =>
    state.loans.get(p.loan_id)?.progress.stage === 'returned',
  'loans/predicate/the_tool_is_on_loan': (p) => (state) =>
    ongoing(state).some((the_loan) => the_loan.tool_id === p.tool_id),
  'loans/predicate/the_tool_is_on_loan_to_this_member': (p) => (state) =>
    ongoing(state).some(
      (the_loan) => the_loan.tool_id === p.tool_id && the_loan.member_id === p.member_id,
    ),
  'loans/predicate/a_reservation_has_this_id': (p) => (state) =>
    state.reservations.has(p.reservation_id),
  'loans/predicate/the_tool_is_booked_for_the_day': (p) => (state) =>
    booked(state).some(
      (the_reservation) => the_reservation.tool_id === p.tool_id && the_reservation.day === p.day,
    ),
  'loans/predicate/the_tool_is_booked_for_the_day_by_this_member': (p) => (state) =>
    booked(state).some(
      (the_reservation) =>
        the_reservation.tool_id === p.tool_id &&
        the_reservation.day === p.day &&
        the_reservation.member_id === p.member_id,
    ),
}

/** The name of a tool, read from the catalogue of `tools`: the link of the view of `loans`. */
const the_name_of_the_tool =
  (state: Reads) =>
  (the_thing: { readonly tool_id: tool_id }): string | undefined =>
    state.tools.get(the_thing.tool_id)?.name

// The reads of the subject `loans/selection/loan`: a loan.

export const loan_selection: wlib.Algebra<
  wlib.SelectionsIn<typeof loans_selection.loan>,
  Selection<Reads, loan>
> = {
  ...selection_operators<Reads, loan>(),
  predicate: {
    'loans/selection/loan/the_loan_is_ongoing': () => () => (the_loan) =>
      the_loan.progress.stage === 'ongoing',
    'loans/selection/loan/the_loan_is_of_this_member': (p) => () => (the_loan) =>
      the_loan.member_id === p.member_id,
  },
}

const the_loans: Source<Reads, loan> = (state) => [...state.loans.values()]

export const loan_sources: {
  readonly the_ongoing_loans_of_a_member: wlib.QuerySource<
    wlib.FieldsOf<typeof the_ongoing_loans_of_a_member>,
    Source<Reads, loan>,
    Field<Reads, loan>
  >
} = {
  the_ongoing_loans_of_a_member: {
    from: the_loans,
    fields: {
      id: () => (the_loan) => the_loan.id,
      tool_id: () => (the_loan) => the_loan.tool_id,
      tool_name: the_name_of_the_tool,
      start_date: () => (the_loan) => the_loan.start_date,
      due_date: () => (the_loan) => the_loan.due_date,
    },
  },
}

// The reads of the subject `loans/selection/reservation`: a reservation.

export const reservation_selection: wlib.Algebra<
  wlib.SelectionsIn<typeof loans_selection.reservation>,
  Selection<Reads, reservation>
> = {
  ...selection_operators<Reads, reservation>(),
  predicate: {
    // Every reservation is booked until one can be cancelled (step 8): then a test of the stage.
    'loans/selection/reservation/the_reservation_is_booked': () => () => () => true,
    'loans/selection/reservation/the_reservation_is_of_this_member':
      (p) => () => (the_reservation) =>
        the_reservation.member_id === p.member_id,
    'loans/selection/reservation/the_reservation_is_from_this_day_on':
      (p) => () => (the_reservation) =>
        the_reservation.day >= p.day,
  },
}

const the_reservations: Source<Reads, reservation> = (state) => [...state.reservations.values()]

export const reservation_sources: {
  readonly the_reservations_of_a_member: wlib.QuerySource<
    wlib.FieldsOf<typeof the_reservations_of_a_member>,
    Source<Reads, reservation>,
    Field<Reads, reservation>
  >
} = {
  the_reservations_of_a_member: {
    from: the_reservations,
    fields: {
      id: () => (the_reservation) => the_reservation.id,
      tool_id: () => (the_reservation) => the_reservation.tool_id,
      tool_name: the_name_of_the_tool,
      day: () => (the_reservation) => the_reservation.day,
    },
  },
}

export const loans_writes: wlib.FactWrites<
  wlib.FactsIn<typeof loans_fact>,
  (state: LoansState) => LoansState
> = {
  'loans/fact/a_tool_has_been_lent':
    ({ new_loan }) =>
    (state) => ({ ...state, loans: new Map(state.loans).set(new_loan.id, new_loan) }),
  'loans/fact/the_member_already_has_the_tool': () => (state) => state,
  'loans/fact/a_tool_has_been_returned':
    ({ returned_loan }) =>
    (state) => {
      const the_loan = state.loans.get(returned_loan.id)
      return the_loan === undefined
        ? state
        : {
            ...state,
            loans: new Map(state.loans).set(returned_loan.id, {
              ...the_loan,
              progress: returned_loan.progress,
            }),
          }
    },
  'loans/fact/the_loan_was_already_returned': () => (state) => state,
  'loans/fact/a_tool_has_been_booked':
    ({ new_reservation }) =>
    (state) => ({
      ...state,
      reservations: new Map(state.reservations).set(new_reservation.id, new_reservation),
    }),
  'loans/fact/the_member_already_booked_the_tool': () => (state) => state,
}
