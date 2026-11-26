import { z } from 'zod'

// The values of `known` in messaging (EXT-11): what a bonded face sends it,
// in its own words.

/** The text of a message, as the peer writes it (MSG-4): a plain string, no refinement (EXT-4). */
export const text = z.string().min(1).max(4_000)
