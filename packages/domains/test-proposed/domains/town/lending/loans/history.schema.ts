import * as z from 'zod'

/** A loan closed: the book came back on a day. A folder `loans/` merges with the modules `loans.*.ts` (LIB-16). */
export const entry = z.strictObject({
  book: z.string(),
  reader: z.string(),
  returned: z.number().int(),
})
