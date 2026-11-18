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

/**
 * Whether the member may bring a loan's tool back, on its row of "my loans"
 * (SC-33): yes, scanning at the desk the tool they bring, which the row
 * cannot know (D51.7); or not this loan.
 */
export const return_on_the_row = z.enum(['scan_the_tool_you_bring', 'not_this_loan'])

/**
 * Whether the member may keep a loan's tool longer, on its row of "my loans"
 * (SC-33): yes; no, someone booked the tool; no, not this loan (past its
 * due date, or back in the shed); no, their card is not valid today,
 * whatever the loan.
 */
export const extension_on_the_row = z.enum([
  'you_may',
  'someone_booked_the_tool',
  'not_this_loan',
  'your_card_is_not_valid',
])
