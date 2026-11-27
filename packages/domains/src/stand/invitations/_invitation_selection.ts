// generated

// The selection predicates of `stand/invitations` from
// `invitation_selection.ts` (DOM-25): the same objects under the same names,
// branded with their path (DOM-24), each schema with its output type under the
// same name, so that one import gives both. Only this module imports
// `invitation_selection.ts`.

import { z } from 'zod'
import * as selection from './invitation_selection.ts'

/**
 * The invitation was left on this stand.
 *
 * @see {@link selection.the_invitation_is_on_this_stand}
 */
export const the_invitation_is_on_this_stand =
  selection.the_invitation_is_on_this_stand.brand<'stand/invitations/selection/invitation/the_invitation_is_on_this_stand'>()
export type the_invitation_is_on_this_stand = z.output<typeof the_invitation_is_on_this_stand>

/**
 * The invitation is on its stand still: neither taken nor taken away.
 *
 * @see {@link selection.the_invitation_can_be_taken}
 */
export const the_invitation_can_be_taken =
  selection.the_invitation_can_be_taken.brand<'stand/invitations/selection/invitation/the_invitation_can_be_taken'>()
export type the_invitation_can_be_taken = z.output<typeof the_invitation_can_be_taken>

/**
 * The invitation was taken by this take.
 *
 * @see {@link selection.the_invitation_was_taken_by}
 */
export const the_invitation_was_taken_by =
  selection.the_invitation_was_taken_by.brand<'stand/invitations/selection/invitation/the_invitation_was_taken_by'>()
export type the_invitation_was_taken_by = z.output<typeof the_invitation_was_taken_by>
