import { z } from 'zod'

// The values of `visitor`, in the visitor's words (GR-3): its own, even where
// they match the business's, so that its surface stays when `tools` changes
// (PER-17).

/** A shelf of the shed, as the visitor browses it. */
export const category = z.enum(['garden', 'power', 'hand', 'ladder'])

/** The shelves a visitor browses: at least one. */
export const categories = z.array(category).min(1)

/** The name of a tool, as the visitor reads it. */
export const tool_name = z.string().min(1).max(80)
