import * as z from 'zod'

/** A book lent to a reader, due back on a day. */
export const loan = z.strictObject({ book: z.string(), reader: z.string(), due: z.number().int() })

/** Lend a book to a reader, on a day. */
export const lend = z.strictObject({ book: z.string(), reader: z.string(), on: z.number().int() })

/** Whether a loan is past its due day. */
export const isLate = z.strictObject({ loan: z.string(), today: z.number().int() })
