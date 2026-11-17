// The state of `loans` in the in-memory oracle (TST-2). Its view of the tools
// is read from the state of `tools`: the import of `./tools.ts` is the link
// (GR-3, V11), typed, and the arrow `loans → tools` that dependency-cruiser
// shows (GR-1). Where the view of `loans` means what `tools` means, the
// fragment reuses the `dsl` of `tools`. Its reads are typed by subject
// (DOM-18): a loan, a reservation.

import type * as wlib from '../../wlib.ts'
import type * as loans_fact from '../../business/loans/_fact.ts'
import type * as loans_predicate from '../../business/loans/_predicate.ts'
import type { loan_id, reservation_id } from '../../business/loans/_id.ts'
import type {
  cancellation_of_reservations,
  cancellation_progress,
  loan,
  loan_progress,
  repair_notice_round,
  repair_notice_round_progress,
  reservation,
  reservation_progress,
} from '../../business/loans/_value.ts'
import type {
  the_ongoing_loans_of_a_member,
  the_reservations_of_a_member,
  the_reservations_of_a_member_in_the_workshop,
} from '../../business/loans/_query.ts'
import type {
  continue_the_cancellation_of_reservations,
  continue_the_repair_notice_round,
} from '../../business/loans/_command.ts'
import type * as loan_selections from '../../business/loans/_loan_selection.ts'
import type * as reservation_selections from '../../business/loans/_reservation_selection.ts'
import type { repair_id, tool_id } from '../../business/tools/_id.ts'
import * as tools_dsl from '../../business/tools/_dsl.ts'
import * as loans_dsl from '../../business/loans/_dsl.ts'
import {
  selection_operators,
  type Field,
  type ProcessRead,
  type Selection,
  type Source,
} from './fragments.ts'
import type { ToolsState } from './tools.ts'

/**
 * The loans and the reservations, by id; the desk's work sheets, by tool;
 * its rounds of the notices of a repair, by stay in repair.
 */
export interface LoansState {
  readonly loans: ReadonlyMap<loan_id, loan>
  readonly reservations: ReadonlyMap<reservation_id, reservation>
  readonly cancellations: ReadonlyMap<tool_id, cancellation_of_reservations>
  readonly notice_rounds: ReadonlyMap<repair_id, repair_notice_round>
}

/** What the predicates of `loans` read: its state, and the state of `tools` for its view of the tools. */
type Reads = LoansState & ToolsState

const ongoing = (state: Reads): readonly loan[] =>
  [...state.loans.values()].filter(loans_dsl.the_loan_is_ongoing)

/** The reservations that hold their tool for their day. */
const booked = (state: Reads): readonly reservation[] =>
  [...state.reservations.values()].filter(loans_dsl.the_reservation_is_booked)

export const loans_fragments: wlib.PredicateFragments<
  wlib.PredicatesIn<typeof loans_predicate>,
  (state: Reads) => boolean
> = {
  // The link: the view of `loans` over the tools, read from `tools`.
  'business/loans/predicate/a_tool_has_this_id': (p) => (state) =>
    tools_dsl.the_tool_is_in_the_catalogue(state.tools.get(p.tool_id)),
  'business/loans/predicate/the_tool_is_in_service': (p) => (state) =>
    tools_dsl.the_tool_is_in_service(state.tools.get(p.tool_id)),

  'business/loans/predicate/a_loan_has_this_id': (p) => (state) => state.loans.has(p.loan_id),
  'business/loans/predicate/the_loan_is_ongoing': (p) => (state) =>
    loans_dsl.the_loan_is_ongoing(state.loans.get(p.loan_id)),
  'business/loans/predicate/the_loan_is_returned': (p) => (state) =>
    loans_dsl.the_loan_is_returned(state.loans.get(p.loan_id)),
  'business/loans/predicate/the_loan_is_of_this_tool': (p) => (state) =>
    state.loans.get(p.loan_id)?.tool_id === p.tool_id,
  'business/loans/predicate/the_loan_is_of_this_member': (p) => (state) =>
    state.loans.get(p.loan_id)?.member_id === p.member_id,
  'business/loans/predicate/the_loan_is_due_on_this_day': (p) => (state) =>
    state.loans.get(p.loan_id)?.due_day === p.due_day,
  'business/loans/predicate/the_due_date_of_the_loan_is_still_ahead': (p) => (state) =>
    loans_dsl.the_due_date_of_the_loan_is_still_ahead(state.loans.get(p.loan_id))(p.now),
  'business/loans/predicate/the_tool_is_on_loan': (p) => (state) =>
    ongoing(state).some((the_loan) => the_loan.tool_id === p.tool_id),
  'business/loans/predicate/the_tool_is_on_loan_to_this_member': (p) => (state) =>
    ongoing(state).some(
      (the_loan) => the_loan.tool_id === p.tool_id && the_loan.member_id === p.member_id,
    ),
  'business/loans/predicate/a_reservation_has_this_id': (p) => (state) =>
    state.reservations.has(p.reservation_id),
  'business/loans/predicate/the_reservation_is_booked': (p) => (state) =>
    loans_dsl.the_reservation_is_booked(state.reservations.get(p.reservation_id)),
  'business/loans/predicate/the_tool_is_booked_for_the_day': (p) => (state) =>
    booked(state).some(
      (the_reservation) => the_reservation.tool_id === p.tool_id && the_reservation.day === p.day,
    ),
  'business/loans/predicate/the_tool_is_booked_for_the_day_by_this_member': (p) => (state) =>
    booked(state).some(
      (the_reservation) =>
        the_reservation.tool_id === p.tool_id &&
        the_reservation.day === p.day &&
        the_reservation.member_id === p.member_id,
    ),
  'business/loans/predicate/the_reservation_holds_the_tool_for_the_member_on_the_day':
    (p) => (state) =>
      loans_dsl.the_reservation_holds_the_tool_for_the_member_on_the_day(
        state.reservations.get(p.reservation_id),
      )(p),
  'business/loans/predicate/the_reservation_of_the_member_has_been_taken_up': (p) => (state) =>
    loans_dsl.the_reservation_of_the_member_has_been_taken_up(
      state.reservations.get(p.reservation_id),
    )(p),
  'business/loans/predicate/a_cancellation_of_the_reservations_of_the_tool_has_begun':
    (p) => (state) =>
      state.cancellations.has(p.tool_id),
  'business/loans/predicate/the_notice_round_of_the_repair_has_begun': (p) => (state) =>
    state.notice_rounds.has(p.repair_id),
}

/** The name of a tool, read from the catalogue of `tools`: the link of the view of `loans`. */
const the_name_of_the_tool =
  (state: Reads) =>
  (the_thing: { readonly tool_id: tool_id }): string | undefined =>
    state.tools.get(the_thing.tool_id)?.name

// The reads of the subject `business/loans/selection/loan`: a loan.

export const loan_selection: wlib.Algebra<
  wlib.SelectionsIn<typeof loan_selections>,
  Selection<Reads, loan>
> = {
  ...selection_operators<Reads, loan>(),
  predicate: {
    'business/loans/selection/loan/the_loan_is_ongoing': () => () => loans_dsl.the_loan_is_ongoing,
    'business/loans/selection/loan/the_loan_is_of_this_member': (p) => () => (the_loan) =>
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
      due_day: () => (the_loan) => the_loan.due_day,
      term: () => loans_dsl.the_term_of_the_loan,
    },
  },
}

// The reads of the subject `business/loans/selection/reservation`: a reservation.

export const reservation_selection: wlib.Algebra<
  wlib.SelectionsIn<typeof reservation_selections>,
  Selection<Reads, reservation>
> = {
  ...selection_operators<Reads, reservation>(),
  predicate: {
    'business/loans/selection/reservation/the_reservation_is_booked': () => () =>
      loans_dsl.the_reservation_is_booked,
    'business/loans/selection/reservation/the_reservation_is_of_this_member':
      (p) => () => (the_reservation) =>
        the_reservation.member_id === p.member_id,
    'business/loans/selection/reservation/the_reservation_is_of_this_tool':
      (p) => () => (the_reservation) =>
        the_reservation.tool_id === p.tool_id,
    'business/loans/selection/reservation/the_reservation_is_from_this_day_on':
      (p) => () => (the_reservation) =>
        the_reservation.day >= p.day,
    // The link: the view of `loans` over the tools, read from `tools` (SC-20).
    'business/loans/selection/reservation/the_tool_of_the_reservation_is_in_the_workshop':
      () => (state) => (the_reservation) =>
        tools_dsl.the_tool_is_under_repair(state.tools.get(the_reservation.tool_id)),
  },
}

const the_reservations: Source<Reads, reservation> = (state) => [...state.reservations.values()]

/** A member's reservation, as the member sees it: the tool with its name, and the day. */
const the_reservation_entry = {
  from: the_reservations,
  fields: {
    id: () => (the_reservation: reservation) => the_reservation.id,
    tool_id: () => (the_reservation: reservation) => the_reservation.tool_id,
    tool_name: the_name_of_the_tool,
    day: () => (the_reservation: reservation) => the_reservation.day,
  },
}

export const reservation_sources: {
  readonly the_reservations_of_a_member: wlib.QuerySource<
    wlib.FieldsOf<typeof the_reservations_of_a_member>,
    Source<Reads, reservation>,
    Field<Reads, reservation>
  >
  readonly the_reservations_of_a_member_in_the_workshop: wlib.QuerySource<
    wlib.FieldsOf<typeof the_reservations_of_a_member_in_the_workshop>,
    Source<Reads, reservation>,
    Field<Reads, reservation>
  >
} = {
  the_reservations_of_a_member: the_reservation_entry,
  the_reservations_of_a_member_in_the_workshop: the_reservation_entry,
}

// The reads of the steps of `loans` (DOM-20): the work sheet by its tool, the
// round of notices by its stay in repair; both walk the reservations, whole,
// one subject, so one selection serves both (`StepAdapter`).

const the_whole_reservation = {
  id: () => (the_reservation: reservation) => the_reservation.id,
  tool_id: () => (the_reservation: reservation) => the_reservation.tool_id,
  member_id: () => (the_reservation: reservation) => the_reservation.member_id,
  day: () => (the_reservation: reservation) => the_reservation.day,
  booking_date: () => (the_reservation: reservation) => the_reservation.booking_date,
  progress: () => (the_reservation: reservation) => the_reservation.progress,
}

export const reservation_steps: {
  readonly continue_the_cancellation_of_reservations: wlib.StepSource<
    typeof continue_the_cancellation_of_reservations,
    ProcessRead<Reads>,
    Source<Reads, reservation>,
    Field<Reads, reservation>
  >
  readonly continue_the_repair_notice_round: wlib.StepSource<
    typeof continue_the_repair_notice_round,
    ProcessRead<Reads>,
    Source<Reads, reservation>,
    Field<Reads, reservation>
  >
} = {
  continue_the_cancellation_of_reservations: {
    reads: (input) => (state) => state.cancellations.get(input.tool_id),
    from: the_reservations,
    fields: the_whole_reservation,
  },
  continue_the_repair_notice_round: {
    reads: (input) => (state) => state.notice_rounds.get(input.repair_id),
    from: the_reservations,
    fields: the_whole_reservation,
  },
}

/**
 * The one rule of a change of stage, by nesting: the new progress replaces
 * the old, whole; tool, member and dates stay as they were.
 */
const with_the_progress =
  (changed: { readonly id: loan_id; readonly progress: loan_progress }) =>
  (state: LoansState): LoansState => {
    const the_loan = state.loans.get(changed.id)
    return the_loan === undefined
      ? state
      : {
          ...state,
          loans: new Map(state.loans).set(changed.id, { ...the_loan, progress: changed.progress }),
        }
  }

/** A loan's tool corrected (SC-13): member, dates and stage stay as they were. */
const with_the_tool =
  (changed: { readonly id: loan_id; readonly tool_id: tool_id }) =>
  (state: LoansState): LoansState => {
    const the_loan = state.loans.get(changed.id)
    return the_loan === undefined
      ? state
      : {
          ...state,
          loans: new Map(state.loans).set(changed.id, { ...the_loan, tool_id: changed.tool_id }),
        }
  }

/** A reservation's change of stage, by nesting, as a loan's. */
const with_the_reservation_progress =
  (changed: { readonly id: reservation_id; readonly progress: reservation_progress }) =>
  (state: LoansState): LoansState => {
    const the_reservation = state.reservations.get(changed.id)
    return the_reservation === undefined
      ? state
      : {
          ...state,
          reservations: new Map(state.reservations).set(changed.id, {
            ...the_reservation,
            progress: changed.progress,
          }),
        }
  }

/** A work sheet's change of stage, by nesting: the tool and the start date stay. */
const with_the_sheet_progress =
  (changed: { readonly tool_id: tool_id; readonly progress: cancellation_progress }) =>
  (state: LoansState): LoansState => {
    const the_sheet = state.cancellations.get(changed.tool_id)
    return the_sheet === undefined
      ? state
      : {
          ...state,
          cancellations: new Map(state.cancellations).set(changed.tool_id, {
            ...the_sheet,
            progress: changed.progress,
          }),
        }
  }

/** A round's change of stage, by nesting: the stay in repair, the tool and the start date stay. */
const with_the_round_progress =
  (changed: { readonly repair_id: repair_id; readonly progress: repair_notice_round_progress }) =>
  (state: LoansState): LoansState => {
    const the_round = state.notice_rounds.get(changed.repair_id)
    return the_round === undefined
      ? state
      : {
          ...state,
          notice_rounds: new Map(state.notice_rounds).set(changed.repair_id, {
            ...the_round,
            progress: changed.progress,
          }),
        }
  }

export const loans_writes: wlib.FactWrites<
  wlib.FactsIn<typeof loans_fact>,
  (state: LoansState) => LoansState
> = {
  'business/loans/fact/a_tool_has_been_lent':
    ({ new_loan }) =>
    (state) => ({ ...state, loans: new Map(state.loans).set(new_loan.id, new_loan) }),
  'business/loans/fact/the_member_already_has_the_tool': () => (state) => state,
  'business/loans/fact/a_tool_has_been_returned': ({ returned_loan }) =>
    with_the_progress(returned_loan),
  'business/loans/fact/the_loan_was_already_returned': () => (state) => state,
  'business/loans/fact/the_member_has_been_reminded_of_the_due_date': () => (state) => state,
  'business/loans/fact/the_loan_was_returned_before_the_reminder': () => (state) => state,
  'business/loans/fact/the_due_date_came_before_the_reminder': () => (state) => state,
  'business/loans/fact/a_loan_has_become_overdue': ({ overdue_loan }) =>
    with_the_progress(overdue_loan),
  'business/loans/fact/the_loan_was_returned_before_it_became_overdue': () => (state) => state,
  'business/loans/fact/the_due_day_was_not_over': () => (state) => state,
  'business/loans/fact/the_tool_of_a_loan_has_been_corrected': ({ corrected_loan }) =>
    with_the_tool(corrected_loan),
  'business/loans/fact/the_tool_of_the_loan_was_already_corrected': () => (state) => state,
  'business/loans/fact/the_tool_was_corrected_before_the_reminder': () => (state) => state,
  'business/loans/fact/a_tool_has_been_booked':
    ({ new_reservation }) =>
    (state) => ({
      ...state,
      reservations: new Map(state.reservations).set(new_reservation.id, new_reservation),
    }),
  'business/loans/fact/the_member_already_booked_the_tool': () => (state) => state,
  'business/loans/fact/the_cancellation_of_the_reservations_of_a_tool_has_begun':
    ({ new_cancellation }) =>
    (state) => ({
      ...state,
      cancellations: new Map(state.cancellations).set(new_cancellation.tool_id, new_cancellation),
    }),
  'business/loans/fact/a_reservation_has_been_taken_up': ({ taken_up_reservation }) =>
    with_the_reservation_progress(taken_up_reservation),
  'business/loans/fact/the_reservation_was_already_taken_up': () => (state) => state,
  'business/loans/fact/a_reservation_has_been_cancelled': ({ cancelled_reservation }) =>
    with_the_reservation_progress(cancelled_reservation),
  'business/loans/fact/the_cancellation_has_advanced':
    ({ tool_id, cursor }) =>
    (state) =>
      with_the_sheet_progress({ tool_id, progress: { stage: 'cancelling', cursor } })(state),
  'business/loans/fact/the_cancellation_of_the_reservations_of_a_tool_is_complete': ({
    completed_cancellation,
  }) => with_the_sheet_progress(completed_cancellation),
  'business/loans/fact/a_repair_notice_round_has_begun':
    ({ new_round }) =>
    (state) => ({
      ...state,
      notice_rounds: new Map(state.notice_rounds).set(new_round.repair_id, new_round),
    }),
  'business/loans/fact/a_member_has_been_notified_of_the_repair': () => (state) => state,
  'business/loans/fact/the_repair_notice_round_has_advanced':
    ({ repair_id, cursor }) =>
    (state) =>
      with_the_round_progress({ repair_id, progress: { stage: 'notifying', cursor } })(state),
  'business/loans/fact/the_repair_notice_round_is_complete': ({ completed_round }) =>
    with_the_round_progress(completed_round),
}
