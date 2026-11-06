import { dueAfter } from './dates.ts'
import type { Lend, Loan } from './loans.types.ts'

// The command form comes with the interpreter (step 1b): for now, the loan the command creates.
export const lend = (input: Lend): Loan => ({
  book: input.book,
  reader: input.reader,
  due: dueAfter(input.on, 14),
})
