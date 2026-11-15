import { z } from 'zod'
import { selection, id } from './_here_selection.ts'

// The selections over a loan, the subject of this file (DOM-18): predicates
// over the loan a query looks at, which they do not name; their parameters are
// the values of the filter. Composed with AND, OR, NOT, as the
// predicates; their value is the adapters'.

export const the_loan_is_ongoing = selection({
  subject: 'loan',
  parameters: z.strictObject({}),
})

export const the_loan_is_of_this_member = selection({
  subject: 'loan',
  parameters: z.strictObject({
    member_id: id.member_id,
  }),
})
