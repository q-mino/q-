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
