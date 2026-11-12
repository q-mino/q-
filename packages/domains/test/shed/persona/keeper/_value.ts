import { z } from 'zod'

// The values of `keeper`, in the keeper's words (GR-3): its own, even where
// they match the business's, so that its surface stays when `tools` changes
// (PER-17).

/** Why the keeper takes a tool off the shelf. */
export const retirement_reason = z.enum(['broken', 'lost', 'worn_out', 'given_away'])

/** What the keeper writes down about a tool. */
export const notes = z.string().max(500)
