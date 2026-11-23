// The desk's pure functions over its values, added at need. DOM-5

import type { deposits, value } from './_scope_dsl.ts'

/** The caller came with the collect secret of a mailbox, whichever. */
export const the_caller_shows_a_collect_secret = (caller: value.caller): boolean =>
  caller.shows === 'a_collect_secret'

/** The collect secret the caller shows is the one of the mailbox at this address: D = hash(R) (PER-19). */
export const the_caller_holds_the_mailbox =
  (caller: value.caller) =>
  (deposit_address: deposits.id.deposit_address): boolean =>
    caller.shows === 'a_collect_secret' && caller.id === deposit_address
