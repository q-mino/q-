// generated

// The use cases of `member` under their names (DOM-2), the leaves of its tree.

import { z } from 'zod'
import * as usecase from './usecase.ts'

/**
 * Marta takes the drill home, while her card is valid.
 *
 * @see {@link usecase.borrow_a_tool}
 */
export const borrow_a_tool = usecase.borrow_a_tool

/**
 * The input of `borrow_a_tool`, declared inline.
 *
 * @see {@link usecase.borrow_a_tool}
 */
export const borrow_a_tool_input = usecase.borrow_a_tool.input
export type borrow_a_tool_input = z.output<typeof borrow_a_tool_input>

/**
 * Gianni takes the drill he booked for Thursday, from the row of his
 * reservation, while his card is valid (SC-10).
 *
 * @see {@link usecase.take_the_tool_you_booked}
 */
export const take_the_tool_you_booked = usecase.take_the_tool_you_booked

/**
 * The input of `take_the_tool_you_booked`, declared inline.
 *
 * @see {@link usecase.take_the_tool_you_booked}
 */
export const take_the_tool_you_booked_input = usecase.take_the_tool_you_booked.input
export type take_the_tool_you_booked_input = z.output<typeof take_the_tool_you_booked_input>

/**
 * Marta opens "my loans": the tools she has at home, when each is due and
 * whether it is overdue, then follows them live; a loan appears, the due
 * date passes on one, a return takes it away. When the due date passes she
 * reads "your loan is overdue", with the row. Her card may have expired: she
 * still sees what she must bring back.
 *
 * @see {@link usecase.my_loans}
 */
export const my_loans = usecase.my_loans

/**
 * The input of `my_loans`, declared inline.
 *
 * @see {@link usecase.my_loans}
 */
export const my_loans_input = usecase.my_loans.input
export type my_loans_input = z.output<typeof my_loans_input>

/**
 * Gianni opens "my reservations": the tools he booked, from today on, the
 * closest day first, then follows them live; a booking appears, a
 * cancellation takes one away. When a tool he booked goes to the workshop
 * he reads "the tool you booked is in repair", with the row: the notice the
 * desk recorded for his reservation, a part of a step of its round, which
 * the stream projects as the part that touches the row (A, 16 Nov 2026 (6)).
 *
 * @see {@link usecase.my_reservations}
 */
export const my_reservations = usecase.my_reservations

/**
 * The input of `my_reservations`, declared inline.
 *
 * @see {@link usecase.my_reservations}
 */
export const my_reservations_input = usecase.my_reservations.input
export type my_reservations_input = z.output<typeof my_reservations_input>

/**
 * Gianni opens "in the workshop", among his reservations: those whose tool
 * is in repair, which may not be ready on their day. On Tuesday the drill
 * he booked for Thursday goes to the workshop and its row comes in; on
 * Friday it is back in service and the row goes: facts of `tools`, which
 * touch no reservation, by what they change of the selection (SC-20).
 *
 * @see {@link usecase.my_reservations_in_the_workshop}
 */
export const my_reservations_in_the_workshop = usecase.my_reservations_in_the_workshop

/**
 * The input of `my_reservations_in_the_workshop`, declared inline.
 *
 * @see {@link usecase.my_reservations_in_the_workshop}
 */
export const my_reservations_in_the_workshop_input = usecase.my_reservations_in_the_workshop.input
export type my_reservations_in_the_workshop_input = z.output<
  typeof my_reservations_in_the_workshop_input
>

/**
 * Marta brings the drill back, and her screen follows what her return sets
 * going (D58.2, A, 16 Nov 2026 (5)): whole, it ends there; damaged, it stays
 * open until the workshop takes the drill in, a fact of `tools` that a
 * standing order records with the correlation of her return, or until its
 * wait is over. The workshop's own end (the drill back in service on
 * Friday) is not her flow.
 *
 * @see {@link usecase.return_a_tool}
 */
export const return_a_tool = usecase.return_a_tool

/**
 * The input of `return_a_tool`, declared inline.
 *
 * @see {@link usecase.return_a_tool}
 */
export const return_a_tool_input = usecase.return_a_tool.input
export type return_a_tool_input = z.output<typeof return_a_tool_input>
