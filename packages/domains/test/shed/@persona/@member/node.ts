import * as accounts from '../../@auth/@accounts/_index.ts'
import { the_account_of_the_caller } from '../_dsl.ts'
import { the_card_is_valid_on } from './_dsl.ts'
import { above } from './_above.ts'

// The node of `member` (PER-6): who wears the hat has an account with the hat
// `member` and a member card, valid today, and its number goes down the tree,
// for the leaves to give the business as the member (D33). Its only I/O is
// the lookups of auth; then all is pure.

/** Marta, card M-12, valid until 31 March 2027: she may borrow today. */
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
  is_refused_unless: {
    the_member_card_is_valid_today: (context) => (found) =>
      the_card_is_valid_on(context.now)(found.the_member_card_of_the_caller),
  },
  gives: () => (found) => ({ card: found.the_member_card_of_the_caller.id }),
})
