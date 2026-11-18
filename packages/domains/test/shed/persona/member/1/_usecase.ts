// generated

// The leaves of `member` 1.x under their names (DOM-2, A, 16 Nov 2026 (7)):
// those over the next major's, with their inputs, and the delegated, with
// the next major's inputs, delegated as their leaves (DOM-24, C, 18 Nov 2026
// (7)), so that the registry of 1.x is its whole map. Only this module
// imports `usecase.ts`.

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
 * The input of `borrow_a_tool` at 1.x, declared inline.
 *
 * @see {@link usecase.borrow_a_tool}
 */
export const borrow_a_tool_input = usecase.borrow_a_tool.input
export type borrow_a_tool_input = z.output<typeof borrow_a_tool_input>

/** @see {@link usecase.return_a_tool} */
export const return_a_tool = usecase.return_a_tool

/**
 * The input of `return_a_tool` at 1.x: the next major's, delegated as its leaf.
 *
 * @see {@link usecase.return_a_tool}
 */
export const return_a_tool_input = delegate(next.return_a_tool_input)
export type return_a_tool_input = next.return_a_tool_input

/**
 * Marta's old phone opens "my loans": each loan due at an instant, the last of its due day.
 *
 * @see {@link usecase.my_loans}
 */
export const my_loans = usecase.my_loans

/**
 * The input of `my_loans` at 1.x, declared inline.
 *
 * @see {@link usecase.my_loans}
 */
export const my_loans_input = usecase.my_loans.input
export type my_loans_input = z.output<typeof my_loans_input>

/** @see {@link usecase.my_reservations} */
export const my_reservations = usecase.my_reservations

/**
 * The input of `my_reservations` at 1.x: the next major's, delegated as its leaf.
 *
 * @see {@link usecase.my_reservations}
 */
export const my_reservations_input = delegate(next.my_reservations_input)
export type my_reservations_input = next.my_reservations_input
