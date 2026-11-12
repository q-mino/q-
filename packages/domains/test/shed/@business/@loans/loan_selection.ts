import { z } from 'zod'
import { member_id } from './_id.ts'
import * as wlib from '../../wlib.ts'

// The selections over a loan, the subject of this file (DOM-18): predicates
// over the loan a query looks at, which they do not name; their parameters are
// the values of the filter. Composed with wlib.AND, wlib.OR, wlib.NOT, as the
// predicates; their value is the adapters'.

export const the_loan_is_ongoing = wlib.selection({
  subject: 'loan',
  parameters: z.strictObject({}),
})

export const the_loan_is_of_this_member = wlib.selection({
  subject: 'loan',
  parameters: z.strictObject({
    member_id: member_id,
  }),
})
