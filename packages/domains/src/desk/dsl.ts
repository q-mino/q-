// The desk's pure functions over its values, added at need. DOM-5

import type { deposits, invitations, value } from './_scope_dsl.ts'

/** The caller came with the collect secret of a mailbox, whichever. */
export const the_caller_shows_a_collect_secret = (caller: value.caller): boolean =>
  caller.shows === 'a_collect_secret'

/** The collect secret the caller shows is the one of the mailbox at this address: D = hash(R) (PER-19). */
export const the_caller_holds_the_mailbox =
  (caller: value.caller) =>
  (deposit_address: deposits.id.deposit_address): boolean =>
    caller.shows === 'a_collect_secret' && caller.id === deposit_address

/** The caller came with the signature of a stand's inviter, whichever stand (INV-5). */
export const the_caller_is_a_stand_s_inviter = (caller: value.caller): boolean =>
  caller.shows === 'the_signature_of_a_stand_s_inviter'

/** The caller is the inviter of this stand: its signature verified with this stand's key (INV-5). */
export const the_caller_is_the_inviter_of =
  (caller: value.caller) =>
  (stand: invitations.id.stand): boolean =>
    caller.shows === 'the_signature_of_a_stand_s_inviter' && caller.stand === stand

/** What the stand says of a leave it refused (INV-2): its room, or the time; anything else, the leave cannot be. */
export type ARefusedLeave = 'the_stand_is_full' | 'not_takeable_then' | 'the_invitation_cannot_be_left'

/**
 * Why a leave was refused, from its failures (INV-2, INV-5): the time it
 * can be taken until, first, the inviter's own fault; then the stand's
 * room; any other failure (the stand not the inviter's), no reason.
 */
export const why_a_leave_is_refused = (
  failures: readonly { readonly predicate: string }[],
): ARefusedLeave => {
  const the_stand_s = failures.every(
    (failure) =>
      failure.predicate === 'stand/invitations/predicate/the_stand_has_room' ||
      failure.predicate === 'stand/invitations/predicate/it_can_be_taken_until_then',
  )
  if (!the_stand_s || failures.length === 0) return 'the_invitation_cannot_be_left'
  return failures.some(
    (failure) => failure.predicate === 'stand/invitations/predicate/it_can_be_taken_until_then',
  )
    ? 'not_takeable_then'
    : 'the_stand_is_full'
}
