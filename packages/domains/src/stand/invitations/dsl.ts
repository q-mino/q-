// The domain's pure functions over its values, added at need: usable by the
// adapters, the interface and the client. Not concepts of the library. DOM-5

import { date_time } from '../../library/index.ts'
import type { value } from './_scope_dsl.ts'

/** How many invitations a stand holds at most, neither taken nor taken away (INV-2). */
export const the_room_on_a_stand = 5

/** A ticket's life (BND-8): an invitation can be taken at most 48 hours after it is left. */
const a_ticket_s_life_in_milliseconds = 48 * 60 * 60 * 1000

/**
 * An invitation left now can be taken until then (INV-2): after now, and
 * not more than a ticket's life after it.
 */
export const it_can_be_taken_until =
  (now: date_time) =>
  (takeable_until: date_time): boolean => {
    const left = Date.parse(now)
    const until = Date.parse(takeable_until)
    return until > left && until - left <= a_ticket_s_life_in_milliseconds
  }

export const an_invitation_is_there = (
  the_invitation: value.invitation | undefined,
): the_invitation is value.invitation => the_invitation !== undefined

export const the_invitation_is_on_the_stand = (
  the_invitation: value.invitation | undefined,
): boolean => the_invitation?.status === 'on_the_stand'

export const the_invitation_has_been_taken = (
  the_invitation: value.invitation | undefined,
): boolean => the_invitation?.status === 'taken'

/** Whether a stand with so many invitations on it has room for one more (INV-2). */
export const there_is_room_with = (on_the_stand: number): boolean =>
  on_the_stand < the_room_on_a_stand
