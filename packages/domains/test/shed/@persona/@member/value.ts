import { z } from 'zod'

// The values of `member`, in the member's words (GR-3): its own, even where
// they match the business's or another persona's, so that its surface stays
// when `loans` changes (PER-17).

/** The name of a tool, as the member reads it among their loans. */
export const tool_name = z.string().min(1).max(80)

/**
 * Whether a loan's due date has passed, as the member reads it among their
 * loans: the shed's word, adopted and declared here. A new term of `loans`
 * stops the projection from compiling, and `member` decides how its clients
 * see it (PER-17), instead of receiving it unannounced.
 */
export const loan_term = z.enum(['running', 'overdue'])
