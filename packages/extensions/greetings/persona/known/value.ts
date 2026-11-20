import { z } from 'zod'

// The values of `known` in the test extension (EXT-11): what a bonded face
// sends it, in its own words.

/** The words of a greeting, as the peer writes them. */
export const words = z.string().min(1).max(280)
