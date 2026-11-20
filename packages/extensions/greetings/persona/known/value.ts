import { z } from 'zod'

// The values of `known` in the test extension (EXT-11): what a bonded face
// sends it, in its own words.

/** A greeting, as the peer writes it. */
export const greeting = z.string().min(1).max(280)
