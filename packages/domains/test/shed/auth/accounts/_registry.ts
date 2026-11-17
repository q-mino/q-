// generated

// The path registry of `accounts` (DOM-24): every path with its component, in
// the order of the files.

import type * as wlib from '../../wlib.ts'
import * as id from './_id.ts'
import * as lookup from './_lookup.ts'
import * as value from './_value.ts'

export const registry = {
  'auth/accounts/id/account_id': id.account_id,
  'auth/accounts/id/session_id': id.session_id,
  'auth/accounts/id/card_id': id.card_id,
  'auth/accounts/lookup/the_hats_of_an_account': lookup.the_hats_of_an_account,
  'auth/accounts/lookup/the_member_card_of_an_account': lookup.the_member_card_of_an_account,
  'auth/accounts/value/hat': value.hat,
  'auth/accounts/value/hats': value.hats,
  'auth/accounts/value/member_card': value.member_card,
} satisfies wlib.Registry
