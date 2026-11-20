import { z } from 'zod'

// The values of `self` in the test extension (EXT-11): what the user of the
// node writes, in its own words.

/** A greeting, as the user writes it to a bond. */
export const greeting = z.string().min(1).max(280)
