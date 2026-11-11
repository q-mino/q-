import { z } from 'zod'
import { member_id } from '../value.ts'

// The selections over a loan, the subject of this file (DOM-18): predicates
// over the loan a query looks at, which they do not name; their parameters are
// the values of the filter. Composed with wlib.and, wlib.or, wlib.not, as the
// predicates; their value is the adapters'.

export const the_loan_is_ongoing = z.strictObject({})

export const the_loan_is_of_this_member = z.strictObject({
  member_id: member_id,
})
