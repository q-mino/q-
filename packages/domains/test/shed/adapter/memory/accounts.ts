// The data of `accounts` in the in-memory oracle (TST-2): the hats and the
// member cards, by account. Auth's data is its adapters' (D43): a token, a
// table, an identity provider; here two maps that a test fills.

import type * as zz from '../../../../src/library/index.ts'
import type * as accounts_lookup from '../../auth/accounts/_lookup.ts'
import type { account_id, key_id } from '../../auth/accounts/_id.ts'
import type { hats, member_card } from '../../auth/accounts/_value.ts'

/**
 * The hats and the member cards, by account: an account with no card has
 * none; the hats of the keys the shed gave (`K-ROSSI`, `workshop`, SC-34).
 */
export interface AccountsState {
  readonly hats: ReadonlyMap<account_id, hats>
  readonly member_cards: ReadonlyMap<account_id, member_card>
  readonly key_hats: ReadonlyMap<key_id, hats>
}

/** A value of a map, or "not known" when it has none (D30). */
const answer = <value>(value: value | undefined): zz.Answer<value> =>
  value === undefined ? { answer: 'not_known' } : { answer: 'known', value }

export const accounts_lookups = (
  get: () => AccountsState,
): zz.LookupAdapter<typeof accounts_lookup> => ({
  the_hats_of_an_account: (key) => Promise.resolve(answer(get().hats.get(key))),
  the_hats_of_a_key: (key) => Promise.resolve(answer(get().key_hats.get(key))),
  the_member_card_of_an_account: (key) => Promise.resolve(answer(get().member_cards.get(key))),
})
