import * as accounts from '../../@auth/@accounts/_index.ts'
import { the_account_of_the_caller } from '../_dsl.ts'
import { above } from './_above.ts'

// The node of `keeper` (PER-6): who wears the hat has an account with the hat
// `keeper` (PER-7). It gives nothing more: the keeper's leaves read no value
// of auth. Its only I/O is the lookup of auth; then all is pure.

/** Giorgio keeps the shed: Marta, a member only, is not found here. */
export const keeper = above.node({
  looks_up: {
    the_hats_of_the_caller: {
      lookup: accounts.the_hats_of_an_account,
      of: the_account_of_the_caller,
      /** No account, or none known: "not found", no reason (D87.5, PER-14). */
      when_not_known: 'not_found',
    },
  },
  is_found_only_if: {
    the_caller_wears_the_hat_of_keeper: () => (found) =>
      found.the_hats_of_the_caller.includes('keeper'),
  },
})
