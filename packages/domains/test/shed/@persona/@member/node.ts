import * as accounts from '../../@auth/@accounts/_index.ts'
import { the_account_of_the_caller } from '../_dsl.ts'
import { above } from './_above.ts'

// The node of `member` (PER-6): who wears the hat has an account with the hat
// `member` and a member card, and the card goes down the tree whole, for the
// leaves to give its number to the business as the member (D33) and to read
// its last day. An expired card blocks borrowing, not reading one's loans nor
// returning a tool (A, 13 Nov 2026 (2)): its limit is the leaf's. Its only
// I/O is the lookups of auth; then all is pure.

/** Marta, card M-12, valid until 31 March 2027. */
export const member = above.node({
  looks_up: {
    the_hats_of_the_caller: {
      lookup: accounts.the_hats_of_an_account,
      of: the_account_of_the_caller,
      /** No account, or none known: "not found", no reason (D87.5, PER-14). */
      when_not_known: 'not_found',
    },
    the_member_card_of_the_caller: {
      lookup: accounts.the_member_card_of_an_account,
      of: the_account_of_the_caller,
      /** No card for a member's hat: "not found", no reason (D87.5, PER-14). */
      when_not_known: 'not_found',
    },
  },
  is_found_only_if: {
    the_caller_wears_the_hat_of_member: () => (found) =>
      found.the_hats_of_the_caller.includes('member'),
  },
  gives: () => (found) => ({ card: found.the_member_card_of_the_caller }),
})
