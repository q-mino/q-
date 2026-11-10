// The state of `loans` in the in-memory oracle (TST-2). Its view of the tools
// is read from the state of `tools`: the import of `./tools.ts` is the link
// (GR-3, V11), typed, and the arrow `loans → tools` that dependency-cruiser
// shows (GR-1). Where the view of `loans` means what `tools` means, the
// fragment reuses the `dsl` of `tools`.

import type * as wlib from '../../wlib.ts'
import type * as loans_fact from '../../loans/-domain/$fact.ts'
import type * as loans_predicate from '../../loans/-domain/$predicate.ts'
import type { $loan, $loan_id, $reservation, $reservation_id } from '../../loans/-domain/$value.ts'
import * as tools_dsl from '../../tools/-domain/dsl.ts'
import type { ToolsState } from './tools.ts'

/** The loans and the reservations, by id. */
export interface LoansState {
  readonly loans: ReadonlyMap<$loan_id, $loan>
  readonly reservations: ReadonlyMap<$reservation_id, $reservation>
}

/** What the predicates of `loans` read: its state, and the state of `tools` for its view of the tools. */
type Reads = LoansState & ToolsState

const ongoing = (state: Reads): readonly $loan[] =>
  [...state.loans.values()].filter((the_loan) => the_loan.progress.stage === 'ongoing')

/** Every reservation is booked until a reservation can be cancelled (step 8): then a filter on the stage. */
const booked = (state: Reads): readonly $reservation[] => [...state.reservations.values()]

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
