import * as wlib from '../../wlib.ts'
import { account_id } from './_id.ts'
import { hats, member_card } from './_value.ts'

// The lookups of `accounts` (PER-9, D43): one key, one value or "not known".
// The interface reads the hats to verify the one asked (PER-5); a node of a
// persona reads the values of its hat (PER-6). Their data is the adapters'.

/** The hats of an account: Giorgio, keeper and member. */
export const the_hats_of_an_account = wlib.lookup({ key: account_id, value: hats })

/** The member card of an account: Marta, card M-12, valid until 31 March 2027. */
export const the_member_card_of_an_account = wlib.lookup({ key: account_id, value: member_card })
