// generated

// The values of `business/loans` from `value.ts` (DOM-25): the same objects
// under the same names, each schema with its output type under the same name,
// so that one import gives both. Only this module imports `value.ts`.

import { z } from 'zod'
import * as value from './value.ts'

/**
 * The name of a tool: in `loans` a value of its view, which the adapter reads from the catalogue.
 *
 * @see {@link value.tool_name}
 */
export const tool_name = value.tool_name
export type tool_name = z.output<typeof tool_name>

/**
 * @see {@link value.loan_stage}
 */
export const loan_stage = value.loan_stage
export type loan_stage = z.output<typeof loan_stage>

/**
 * How the tool came back.
 *
 * @see {@link value.return_condition}
 */
export const return_condition = value.return_condition
export type return_condition = z.output<typeof return_condition>

/**
 * Whether the due date has passed on a loan the member still has: a stamp
 * on the loan's card, not a stage. The tool is with the member either way,
 * and every desk of the office handles the loan alike; only the stamp
 * changes, by a fact (time is not a fact, D68.3).
 *
 * @see {@link value.loan_term}
 */
export const loan_term = value.loan_term
export type loan_term = z.output<typeof loan_term>

/**
 * The tool is with the member, its term running or overdue.
 *
 * @see {@link value.loan_ongoing}
 */
export const loan_ongoing = value.loan_ongoing
export type loan_ongoing = z.output<typeof loan_ongoing>

/**
 * The tool is back: when, and how. Late or on time is derived (dsl).
 *
 * @see {@link value.loan_returned}
 */
export const loan_returned = value.loan_returned
export type loan_returned = z.output<typeof loan_returned>

/**
 * Where a loan is in its course: each stage has only its own fields.
 *
 * @see {@link value.loan_progress}
 */
export const loan_progress = value.loan_progress
export type loan_progress = z.output<typeof loan_progress>

/**
 * A loan. The fields every stage shares stay flat; the stage is nested in
 * `progress`, a discriminated union of stages with only their own fields.
 *
 * @see {@link value.loan}
 */
export const loan = value.loan
export type loan = z.output<typeof loan>

/**
 * A loan in its course: the tool is with the member.
 *
 * @see {@link value.ongoing_loan}
 */
export const ongoing_loan = value.ongoing_loan
export type ongoing_loan = z.output<typeof ongoing_loan>

/**
 * A loan whose due date has passed while the member still has the tool.
 *
 * @see {@link value.overdue_loan}
 */
export const overdue_loan = value.overdue_loan
export type overdue_loan = z.output<typeof overdue_loan>

/**
 * A closed loan: the tool is back.
 *
 * @see {@link value.returned_loan}
 */
export const returned_loan = value.returned_loan
export type returned_loan = z.output<typeof returned_loan>

/**
 * @see {@link value.reservation_stage}
 */
export const reservation_stage = value.reservation_stage
export type reservation_stage = z.output<typeof reservation_stage>

/**
 * The tool is held for the member on the day.
 *
 * @see {@link value.reservation_booked}
 */
export const reservation_booked = value.reservation_booked
export type reservation_booked = z.output<typeof reservation_booked>

/**
 * The member took the tool on its day (SC-10): the loan that took the
 * reservation up, which the tool is now out on.
 *
 * @see {@link value.reservation_taken_up}
 */
export const reservation_taken_up = value.reservation_taken_up
export type reservation_taken_up = z.output<typeof reservation_taken_up>

/**
 * The tool is no longer held: the desk cancelled the reservation, when. Why
 * (the tool retired) is the work sheet's, not the reservation's.
 *
 * @see {@link value.reservation_cancelled}
 */
export const reservation_cancelled = value.reservation_cancelled
export type reservation_cancelled = z.output<typeof reservation_cancelled>

/**
 * Where a reservation is in its course.
 *
 * @see {@link value.reservation_progress}
 */
export const reservation_progress = value.reservation_progress
export type reservation_progress = z.output<typeof reservation_progress>

/**
 * A reservation: a tool held for a member on a day. By nesting, as a loan.
 *
 * @see {@link value.reservation}
 */
export const reservation = value.reservation
export type reservation = z.output<typeof reservation>

/**
 * A reservation in force.
 *
 * @see {@link value.booked_reservation}
 */
export const booked_reservation = value.booked_reservation
export type booked_reservation = z.output<typeof booked_reservation>

/**
 * A reservation the member took up, taking the tool on its day.
 *
 * @see {@link value.taken_up_reservation}
 */
export const taken_up_reservation = value.taken_up_reservation
export type taken_up_reservation = z.output<typeof taken_up_reservation>

/**
 * A reservation the desk cancelled.
 *
 * @see {@link value.cancelled_reservation}
 */
export const cancelled_reservation = value.cancelled_reservation
export type cancelled_reservation = z.output<typeof cancelled_reservation>

/**
 * What a member sees of an ongoing loan: the tool, with its name, the dates, and whether its due date has passed.
 *
 * @see {@link value.ongoing_loan_entry}
 */
export const ongoing_loan_entry = value.ongoing_loan_entry
export type ongoing_loan_entry = z.output<typeof ongoing_loan_entry>

/**
 * How many loans: a count of the desk's register (SC-21).
 *
 * @see {@link value.number_of_loans}
 */
export const number_of_loans = value.number_of_loans
export type number_of_loans = z.output<typeof number_of_loans>

/**
 * A tool of the shed, as the desk names it: the tool, with its name.
 *
 * @see {@link value.tool_of_the_shed_entry}
 */
export const tool_of_the_shed_entry = value.tool_of_the_shed_entry
export type tool_of_the_shed_entry = z.output<typeof tool_of_the_shed_entry>

/**
 * What a member sees of a reservation: the tool, with its name, and the day.
 *
 * @see {@link value.reservation_entry}
 */
export const reservation_entry = value.reservation_entry
export type reservation_entry = z.output<typeof reservation_entry>

/**
 * @see {@link value.cancellation_stage}
 */
export const cancellation_stage = value.cancellation_stage
export type cancellation_stage = z.output<typeof cancellation_stage>

/**
 * The desk goes through the tool's reservations still ahead (booked, from
 * the day of the retirement on: the tool and the start date are the
 * selection's parameters, D97.1), one at a time, the closest day first, then
 * by id (D109); the cursor marks the last one handled, none before the first
 * (D112.1). The library's, opaque: the desk never writes it.
 *
 * @see {@link value.cancellation_cancelling}
 */
export const cancellation_cancelling = value.cancellation_cancelling
export type cancellation_cancelling = z.output<typeof cancellation_cancelling>

/**
 * No reservation of the tool is left ahead: the sheet is closed (D112.2).
 *
 * @see {@link value.cancellation_complete}
 */
export const cancellation_complete = value.cancellation_complete
export type cancellation_complete = z.output<typeof cancellation_complete>

/**
 * Where the cancellation of a tool's reservations is in its course.
 *
 * @see {@link value.cancellation_progress}
 */
export const cancellation_progress = value.cancellation_progress
export type cancellation_progress = z.output<typeof cancellation_progress>

/**
 * The desk's work sheet: the reservations of a tool, cancelled one at a
 * time, a process with a cursor (DOM-20, DOM-23, D97, D112), whose state is
 * its own aggregate in `loans`. One per tool: a tool is retired once, for
 * good. By nesting, as a loan.
 *
 * @see {@link value.cancellation_of_reservations}
 */
export const cancellation_of_reservations = value.cancellation_of_reservations
export type cancellation_of_reservations = z.output<typeof cancellation_of_reservations>

/**
 * A cancellation under way.
 *
 * @see {@link value.cancellation_under_way}
 */
export const cancellation_under_way = value.cancellation_under_way
export type cancellation_under_way = z.output<typeof cancellation_under_way>

/**
 * A closed cancellation: no reservation of the tool is left ahead.
 *
 * @see {@link value.completed_cancellation}
 */
export const completed_cancellation = value.completed_cancellation
export type completed_cancellation = z.output<typeof completed_cancellation>

/**
 * @see {@link value.repair_notice_round_stage}
 */
export const repair_notice_round_stage = value.repair_notice_round_stage
export type repair_notice_round_stage = z.output<typeof repair_notice_round_stage>

/**
 * The desk goes round the members who booked a tool sent to repair: the
 * tool's reservations still ahead (booked, from the day of the repair on:
 * the tool and the start date are the selection's parameters, D97.1), one
 * at a time, the closest day first, then by id (D109); the cursor marks the
 * last one handled, none before the first (D112.1). The library's, opaque.
 *
 * @see {@link value.repair_notice_round_notifying}
 */
export const repair_notice_round_notifying = value.repair_notice_round_notifying
export type repair_notice_round_notifying = z.output<typeof repair_notice_round_notifying>

/**
 * No reservation of the tool is left ahead: the round is over (D112.2).
 *
 * @see {@link value.repair_notice_round_complete}
 */
export const repair_notice_round_complete = value.repair_notice_round_complete
export type repair_notice_round_complete = z.output<typeof repair_notice_round_complete>

/**
 * Where the round of the notices of a repair is in its course.
 *
 * @see {@link value.repair_notice_round_progress}
 */
export const repair_notice_round_progress = value.repair_notice_round_progress
export type repair_notice_round_progress = z.output<typeof repair_notice_round_progress>

/**
 * The desk's round of the notices of a repair: when a tool goes to the
 * workshop, the desk notifies, one at a time, the members who booked it,
 * and their reservations stay (A, 16 Nov 2026 (4)). A process with a cursor
 * (DOM-20, DOM-23), its own aggregate in `loans`, keyed by the stay in
 * repair (`tools`' `repair_id`, DOM-12): a tool repaired twice gets two
 * rounds. By nesting, as a loan.
 *
 * @see {@link value.repair_notice_round}
 */
export const repair_notice_round = value.repair_notice_round
export type repair_notice_round = z.output<typeof repair_notice_round>

/**
 * A round of notices under way.
 *
 * @see {@link value.repair_notice_round_under_way}
 */
export const repair_notice_round_under_way = value.repair_notice_round_under_way
export type repair_notice_round_under_way = z.output<typeof repair_notice_round_under_way>

/**
 * A round of notices over: no reservation of the tool is left ahead.
 *
 * @see {@link value.completed_repair_notice_round}
 */
export const completed_repair_notice_round = value.completed_repair_notice_round
export type completed_repair_notice_round = z.output<typeof completed_repair_notice_round>

/**
 * The week's summary the desk sends a member every Monday, which the member
 * asked for (SC-43): who gets it, and the Monday it waits for, at the start
 * of the shed's day. One per member; it goes on until the member stops it
 * (with its case).
 *
 * @see {@link value.weekly_summary}
 */
export const weekly_summary = value.weekly_summary
export type weekly_summary = z.output<typeof weekly_summary>
