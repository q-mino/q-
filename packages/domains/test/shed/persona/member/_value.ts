// generated

// The value schemas of `member` under their names, with their output types
// under the same names: one import gives both.

import { z } from 'zod'
import * as value from './value.ts'

/**
 * The name of a tool, as the member reads it among their loans.
 *
 * @see {@link value.tool_name}
 */
export const tool_name = value.tool_name
export type tool_name = z.output<typeof tool_name>

/**
 * Whether a loan's due date has passed, as the member reads it among their
 * loans: the shed's word, adopted and declared here. A new term of `loans`
 * stops the projection from compiling, and `member` decides how its clients
 * see it (PER-17), instead of receiving it unannounced.
 *
 * @see {@link value.loan_term}
 */
export const loan_term = value.loan_term
export type loan_term = z.output<typeof loan_term>

/**
 * Whether the member may bring a loan's tool back, on its row of "my loans"
 * (SC-33): yes, scanning at the desk the tool they bring, which the row
 * cannot know (D51.7); or not this loan.
 *
 * @see {@link value.return_on_the_row}
 */
export const return_on_the_row = value.return_on_the_row
export type return_on_the_row = z.output<typeof return_on_the_row>

/**
 * Whether the member may keep a loan's tool longer, on its row of "my loans"
 * (SC-33): yes; no, someone booked the tool; no, not this loan (past its
 * due date, or back in the shed); no, their card is not valid today,
 * whatever the loan.
 *
 * @see {@link value.extension_on_the_row}
 */
export const extension_on_the_row = value.extension_on_the_row
export type extension_on_the_row = z.output<typeof extension_on_the_row>
