import { z } from 'zod'
import { tool_id } from '../tools/id.ts'
import { date_time_string, day } from '../../wlib.ts'
import { loan_id, member_id, reservation_id } from './id.ts'

// The tools, as `loans` sees them: the shed's tools it lends. `loans` keeps its
// own view of the tools (GR-3, V11), and imports of `tools` only its
// identities, the key of the link; the state adapter links the rest.

/** The name of a tool: in `loans` a value of its view, which the adapter reads from the catalogue. */
export const tool_name = z.string().min(1)

export const loan_stage = z.enum(['ongoing', 'returned'])

/** How the tool came back. */
export const return_condition = z.enum(['good', 'damaged'])

/** The tool is with the member. */
export const loan_ongoing = z.strictObject({
  stage: z.literal(loan_stage.enum.ongoing),
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
  id: loan_id,
  tool_id: tool_id,
  member_id: member_id,
  start_date: date_time_string,
  due_date: date_time_string,
  progress: loan_progress,
})

/** A loan in its course: the tool is with the member. */
export const ongoing_loan = loan.extend({
  progress: loan_ongoing,
})

/** A closed loan: the tool is back. */
export const returned_loan = loan.extend({
  progress: loan_returned,
})

/** Grows with the steps: `cancelled` (step 8). */
export const reservation_stage = z.enum(['booked'])

/** The tool is held for the member on the day. */
export const reservation_booked = z.strictObject({
  stage: z.literal(reservation_stage.enum.booked),
})

/** Where a reservation is in its course. */
export const reservation_progress = z.discriminatedUnion('stage', [reservation_booked])

/** A reservation: a tool held for a member on a day. By nesting, as a loan. */
export const reservation = z.strictObject({
  id: reservation_id,
  tool_id: tool_id,
  member_id: member_id,
  day: day,
  booking_date: date_time_string,
  progress: reservation_progress,
})

/** A reservation in force. */
export const booked_reservation = reservation.extend({
  progress: reservation_booked,
})

/** What a member sees of an ongoing loan: the tool, with its name, and the dates. */
export const ongoing_loan_entry = ongoing_loan
  .pick({ id: true, tool_id: true, start_date: true, due_date: true })
  .extend({ tool_name: tool_name })

/** What a member sees of a reservation: the tool, with its name, and the day. */
export const reservation_entry = booked_reservation
  .pick({ id: true, tool_id: true, day: true })
  .extend({ tool_name: tool_name })
