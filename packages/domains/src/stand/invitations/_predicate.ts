// generated

// The predicates of `stand/invitations` from `predicate.ts` (DOM-25): the same
// objects under the same names, branded with their path (DOM-24), each schema
// with its output type under the same name, so that one import gives both. Only
// this module imports `predicate.ts`.

import { z } from 'zod'
import * as predicate from './predicate.ts'

/**
 * An invitation with this id is in the relay's hands, whatever its state.
 *
 * @see {@link predicate.an_invitation_has_this_id}
 */
export const an_invitation_has_this_id =
  predicate.an_invitation_has_this_id.brand<'stand/invitations/predicate/an_invitation_has_this_id'>()
export type an_invitation_has_this_id = z.output<typeof an_invitation_has_this_id>

/**
 * The stand holds fewer invitations than its room, neither taken nor taken away (INV-2).
 *
 * @see {@link predicate.the_stand_has_room}
 */
export const the_stand_has_room =
  predicate.the_stand_has_room.brand<'stand/invitations/predicate/the_stand_has_room'>()
export type the_stand_has_room = z.output<typeof the_stand_has_room>

/**
 * An invitation left now can be taken until then: after now, within a ticket's life (INV-2).
 *
 * @see {@link predicate.it_can_be_taken_until_then}
 */
export const it_can_be_taken_until_then =
  predicate.it_can_be_taken_until_then.brand<'stand/invitations/predicate/it_can_be_taken_until_then'>()
export type it_can_be_taken_until_then = z.output<typeof it_can_be_taken_until_then>

/**
 * This invitation is on this stand, neither taken nor taken away (INV-3).
 *
 * @see {@link predicate.the_invitation_is_on_the_stand}
 */
export const the_invitation_is_on_the_stand =
  predicate.the_invitation_is_on_the_stand.brand<'stand/invitations/predicate/the_invitation_is_on_the_stand'>()
export type the_invitation_is_on_the_stand = z.output<typeof the_invitation_is_on_the_stand>

/**
 * This invitation is on its stand still: nobody took it (INV-4).
 *
 * @see {@link predicate.the_invitation_is_still_on_its_stand}
 */
export const the_invitation_is_still_on_its_stand =
  predicate.the_invitation_is_still_on_its_stand.brand<'stand/invitations/predicate/the_invitation_is_still_on_its_stand'>()
export type the_invitation_is_still_on_its_stand = z.output<
  typeof the_invitation_is_still_on_its_stand
>

/**
 * Somebody took this invitation (INV-4).
 *
 * @see {@link predicate.the_invitation_has_been_taken}
 */
export const the_invitation_has_been_taken =
  predicate.the_invitation_has_been_taken.brand<'stand/invitations/predicate/the_invitation_has_been_taken'>()
export type the_invitation_has_been_taken = z.output<typeof the_invitation_has_been_taken>
