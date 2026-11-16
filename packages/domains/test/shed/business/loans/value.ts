import { z } from 'zod'
import { cursor, date_time_string, day } from '../../wlib.ts'
import { id, tools } from './_scope_value.ts'

// The tools, as `loans` sees them: the shed's tools it lends. `loans` keeps its
// own view of the tools (GR-3, V11), and imports of `tools` only its
// identities, the key of the link; the state adapter links the rest.

/** The name of a tool: in `loans` a value of its view, which the adapter reads from the catalogue. */
export const tool_name = z.string().min(1)

export const loan_stage = z.enum(['ongoing', 'returned'])

/** How the tool came back. */
export const return_condition = z.enum(['good', 'damaged'])

/**
 * Whether the due date has passed on a loan the member still has: a stamp
 * on the loan's card, not a stage. The tool is with the member either way,
 * and every desk of the office handles the loan alike; only the stamp
 * changes, by a fact (time is not a fact, D68.3).
 */
export const loan_term = z.enum(['running', 'overdue'])

/** The tool is with the member, its term running or overdue. */
export const loan_ongoing = z.strictObject({
  stage: z.literal(loan_stage.enum.ongoing),
  term: loan_term,
})

/** The tool is back: when, and how. Late or on time is derived (dsl). */
export const loan_returned = z.strictObject({
  stage: z.literal(loan_stage.enum.returned),
  return_date: date_time_string,
  condition: return_condition,
})

/** Where a loan is in its course: each stage has only its own fields. */
export const loan_progress = z.discriminatedUnion('stage', [loan_ongoing, loan_returned])

/**
 * A loan. The fields every stage shares stay flat; the stage is nested in
 * `progress`, a discriminated union of stages with only their own fields.
 */
export const loan = z.strictObject({
  id: id.loan_id,
  tool_id: tools.id.tool_id,
  member_id: id.member_id,
  start_date: date_time_string,
  due_date: date_time_string,
  progress: loan_progress,
})

/** A loan in its course: the tool is with the member. */
export const ongoing_loan = loan.extend({
  progress: loan_ongoing,
})

/** A loan whose due date has passed while the member still has the tool. */
export const overdue_loan = loan.extend({
  progress: loan_ongoing.extend({
    term: z.literal(loan_term.enum.overdue),
  }),
})

/** A closed loan: the tool is back. */
export const returned_loan = loan.extend({
  progress: loan_returned,
})

export const reservation_stage = z.enum(['booked', 'cancelled'])

/** The tool is held for the member on the day. */
export const reservation_booked = z.strictObject({
  stage: z.literal(reservation_stage.enum.booked),
})

/**
 * The tool is no longer held: the desk cancelled the reservation, when. Why
 * (the tool retired) is the work sheet's, not the reservation's.
 */
export const reservation_cancelled = z.strictObject({
  stage: z.literal(reservation_stage.enum.cancelled),
  cancellation_date: date_time_string,
})

/** Where a reservation is in its course. */
export const reservation_progress = z.discriminatedUnion('stage', [
  reservation_booked,
  reservation_cancelled,
])

/** A reservation: a tool held for a member on a day. By nesting, as a loan. */
export const reservation = z.strictObject({
  id: id.reservation_id,
  tool_id: tools.id.tool_id,
  member_id: id.member_id,
  day: day,
  booking_date: date_time_string,
  progress: reservation_progress,
})

/** A reservation in force. */
export const booked_reservation = reservation.extend({
  progress: reservation_booked,
})

/** A reservation the desk cancelled. */
export const cancelled_reservation = reservation.extend({
  progress: reservation_cancelled,
})

/** What a member sees of an ongoing loan: the tool, with its name, the dates, and whether its due date has passed. */
export const ongoing_loan_entry = ongoing_loan
  .pick({ id: true, tool_id: true, start_date: true, due_date: true })
  .extend({ tool_name: tool_name, term: loan_term })

/** What a member sees of a reservation: the tool, with its name, and the day. */
export const reservation_entry = booked_reservation
  .pick({ id: true, tool_id: true, day: true })
  .extend({ tool_name: tool_name })

export const cancellation_stage = z.enum(['cancelling', 'complete'])

/**
 * The desk goes through the tool's reservations still ahead (booked, from
 * the day of the retirement on: the tool and the start date are the
 * selection's parameters, D97.1), one at a time, the closest day first, then
 * by id (D109); the cursor marks the last one handled, none before the first
 * (D112.1). The library's, opaque: the desk never writes it.
 */
export const cancellation_cancelling = z.strictObject({
  stage: z.literal(cancellation_stage.enum.cancelling),
  cursor: cursor.optional(),
})

/** No reservation of the tool is left ahead: the sheet is closed (D112.2). */
export const cancellation_complete = z.strictObject({
  stage: z.literal(cancellation_stage.enum.complete),
  end_date: date_time_string,
})

/** Where the cancellation of a tool's reservations is in its course. */
export const cancellation_progress = z.discriminatedUnion('stage', [
  cancellation_cancelling,
  cancellation_complete,
])

/**
 * The desk's work sheet: the reservations of a tool, cancelled one at a
 * time, a process with a cursor (DOM-20, DOM-23, D97, D112), whose state is
 * its own aggregate in `loans`. One per tool: a tool is retired once, for
 * good. By nesting, as a loan.
 */
export const cancellation_of_reservations = z.strictObject({
  tool_id: tools.id.tool_id,
  start_date: date_time_string,
  progress: cancellation_progress,
})

/** A cancellation under way. */
export const cancellation_under_way = cancellation_of_reservations.extend({
  progress: cancellation_cancelling,
})

/** A closed cancellation: no reservation of the tool is left ahead. */
export const completed_cancellation = cancellation_of_reservations.extend({
  progress: cancellation_complete,
})
