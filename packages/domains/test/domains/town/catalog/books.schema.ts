import * as z from 'zod'

/** A book of the catalog, with the copies on the shelf. */
export const book = z.strictObject({ title: z.string(), copies: z.number().int().nonnegative() })

/** Whether a book has a copy on the shelf. */
export const isAvailable = z.strictObject({ book: z.string() })
