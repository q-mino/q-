import { z } from 'zod'
import * as accounts from '../../@auth/@accounts/_index.ts'
import { the_card_is_valid_on } from './_dsl.ts'
import { above } from './_above.ts'

// The node of `member` (PER-6): who wears the hat has a member card, valid
// today, and its number goes down the tree, for the leaves to give the
// business as the member (D33). Its only I/O is the lookup of auth; then all
// is pure.

/** Marta, card M-12, valid until 31 March 2027: she may borrow today. */
export const member = above.node({
  /** What the entry gives at the top of the tree: the `Caller`, verified (PER-4). */
  takes: z.strictObject({ caller: z.strictObject({ id: accounts.account_id }) }),
  lookups: {
    card: {
      lookup: accounts.the_member_card_of_an_account,
      key: (context) => context.caller.id,
      /** No card for a member's hat: "not found", no reason (D87.5, PER-14). */
      when_not_known: 'not_found',
    },
  },
  limits: {
    the_member_card_is_valid_today: (context) => (found) =>
      the_card_is_valid_on(context.now)(found.card),
  },
  gives: () => (found) => ({ card: found.card.id }),
})
