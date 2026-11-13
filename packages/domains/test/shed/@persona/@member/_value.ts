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
