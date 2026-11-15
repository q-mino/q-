import { lookup, id, value } from './_here_lookup.ts'

// The lookups of `accounts` (PER-9, D43): one key, one value or "not known".
// The node of a persona reads the hats to verify its own (PER-7) and the
// values of its hat (PER-6). Their data is the adapters'.

/** The hats of an account: Giorgio, keeper and member. */
export const the_hats_of_an_account = lookup({ key: id.account_id, value: value.hats })

/** The member card of an account: Marta, card M-12, valid until 31 March 2027. */
export const the_member_card_of_an_account = lookup({
  key: id.account_id,
  value: value.member_card,
})
