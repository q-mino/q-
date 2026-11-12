// generated

// The value schemas of `loans` under their names, with their output types under
// the same names: one import gives both.

import { z } from 'zod'
import * as value from './@value.ts'

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
 * The tool is with the member.
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
 * A closed loan: the tool is back.
 *
 * @see {@link value.returned_loan}
 */
export const returned_loan = value.returned_loan
export type returned_loan = z.output<typeof returned_loan>

/**
 * Grows with the steps: `cancelled` (step 8).
 *
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
 * What a member sees of an ongoing loan: the tool, with its name, and the dates.
 *
 * @see {@link value.ongoing_loan_entry}
 */
export const ongoing_loan_entry = value.ongoing_loan_entry
export type ongoing_loan_entry = z.output<typeof ongoing_loan_entry>

/**
 * What a member sees of a reservation: the tool, with its name, and the day.
 *
 * @see {@link value.reservation_entry}
 */
export const reservation_entry = value.reservation_entry
export type reservation_entry = z.output<typeof reservation_entry>
