// generated

// The use cases of `persona/member/1` from `usecase.ts` (DOM-25): the same
// objects under the same names, each schema with its output type under the same
// name, so that one import gives both. Only this module imports `usecase.ts`.

import { z } from 'zod'
import { delegate, next } from './_scope_usecase.ts'
import * as usecase from './usecase.ts'

/**
 * Marta's old phone borrows the drill, and reads when it is due as an instant.
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
 * @see {@link usecase.return_a_tool}
 */
export const return_a_tool = usecase.return_a_tool

/**
 * The input of `return_a_tool`, delegated to the next major's (DOM-24, PER-17).
 *
 * @see {@link usecase.return_a_tool}
 */
export const return_a_tool_input = delegate(next.return_a_tool_input)
export type return_a_tool_input = next.return_a_tool_input

/**
 * Marta's old phone opens "my loans": each loan due at an instant, the last of its due day in the shed's zone.
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
 * @see {@link usecase.my_reservations}
 */
export const my_reservations = usecase.my_reservations

/**
 * The input of `my_reservations`, delegated to the next major's (DOM-24, PER-17).
 *
 * @see {@link usecase.my_reservations}
 */
export const my_reservations_input = delegate(next.my_reservations_input)
export type my_reservations_input = next.my_reservations_input
