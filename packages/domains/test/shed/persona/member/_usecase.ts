// generated

// The use cases of `persona/member` from `usecase.ts` (DOM-25): the same
// objects under the same names, each schema with its output type under the same
// name, so that one import gives both. Only this module imports `usecase.ts`.

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
 * reservation (R8) in "my reservations", while his card is valid: the desk
 * lends it and takes the reservation up, one fact in two parts (SC-10). The
 * leaf answers from the loan, the branch's own part; R8 leaves his "my
 * reservations" by its stream, from the reservation's part.
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
 * Marta asks the desk for her week every Monday (SC-43): from the next
 * Monday on, at the start of the shed's day, her phone shows "your week at
 * the shed", and opens her loans and her reservations, read when she looks.
 * Asked again, she already gets it.
 *
 * @see {@link usecase.send_me_my_week_on_mondays}
 */
export const send_me_my_week_on_mondays = usecase.send_me_my_week_on_mondays

/**
 * The input of `send_me_my_week_on_mondays`, declared inline.
 *
 * @see {@link usecase.send_me_my_week_on_mondays}
 */
export const send_me_my_week_on_mondays_input = usecase.send_me_my_week_on_mondays.input
export type send_me_my_week_on_mondays_input = z.output<typeof send_me_my_week_on_mondays_input>

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

/**
 * Marta keeps the drill two more weeks, from the row of L7 in "my loans",
 * while her card is valid (SC-31): she sends the loan, the tool and the due
 * day the row shows, and the desk moves the due day on, unless someone
 * booked the drill up to then; the row follows by its stream. The loan is
 * the target of the node above the business's leaf (`an_ongoing_loan`),
 * given beside the rest of the input, flat. Told apart, a booking by someone
 * else; any other failure, the loan's or the node's, the member need not
 * know which.
 *
 * @see {@link usecase.extend_your_loan}
 */
export const extend_your_loan = usecase.extend_your_loan

/**
 * The input of `extend_your_loan`, declared inline.
 *
 * @see {@link usecase.extend_your_loan}
 */
export const extend_your_loan_input = usecase.extend_your_loan.input
export type extend_your_loan_input = z.output<typeof extend_your_loan_input>

/**
 * Marta opens "my loans": the tools she has at home, when each is due and
 * whether it is overdue, then follows them live; a loan appears, the due
 * date passes on one, a return takes it away, a tool renamed by the keeper
 * shows its new name (SC-19). When the due date passes she
 * reads "your loan is overdue", with the row. Her card may have expired: she
 * still sees what she must bring back.
 *
 * Each row tells which of its buttons is active (SC-33): bring it back,
 * always, scanning at the desk the tool she brings, which the row cannot
 * know; keep it longer, from the row as she would send it, unless someone
 * booked the tool (the ladder, booked by Gianni for Thursday), the loan is
 * past its due date (the sander), or her card is not valid today. Gianni
 * books the drill while she reads: its row changes.
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
 * Marta follows the shelf live (SC-32): the tools of the shed in service,
 * by shelf and name, and as they go out, come back or go to the workshop,
 * her phone follows. A benefit of an active card, not a trade of its own
 * (D77: a value from auth limits it, not another persona): with her card
 * expired she is refused and told why, and reads the catalogue once, as
 * anyone does (`visitor`), until she renews it.
 *
 * @see {@link usecase.the_shelf}
 */
export const the_shelf = usecase.the_shelf

/**
 * The input of `the_shelf`, declared inline.
 *
 * @see {@link usecase.the_shelf}
 */
export const the_shelf_input = usecase.the_shelf.input
export type the_shelf_input = z.output<typeof the_shelf_input>
