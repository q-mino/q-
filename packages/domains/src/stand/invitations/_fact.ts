// generated

// The facts of `stand/invitations` from `fact.ts` (DOM-25): the same objects
// under the same names, branded with their path (DOM-24), each schema with its
// output type under the same name, so that one import gives both. Only this
// module imports `fact.ts`.

import { z } from 'zod'
import * as fact from './fact.ts'

/**
 * An inviter has left an invitation on its stand (INV-2): the whole
 * invitation, with the time the relay received it and until when it can be
 * taken. Carries the change of state (DOM-5, V9).
 *
 * @see {@link fact.an_invitation_has_been_left}
 */
export const an_invitation_has_been_left =
  fact.an_invitation_has_been_left.brand<'stand/invitations/fact/an_invitation_has_been_left'>()
export type an_invitation_has_been_left = z.output<typeof an_invitation_has_been_left>

/**
 * A passer-by has taken an invitation (INV-3): a partial value, the
 * invitation's id, its status, when and by which take. Its ticket is read
 * by the one who took it, by the take (`the_invitation_taken`).
 *
 * @see {@link fact.an_invitation_has_been_taken}
 */
export const an_invitation_has_been_taken =
  fact.an_invitation_has_been_taken.brand<'stand/invitations/fact/an_invitation_has_been_taken'>()
export type an_invitation_has_been_taken = z.output<typeof an_invitation_has_been_taken>

/**
 * Its time over, nobody took the invitation: the relay took it off the
 * stand (INV-4), its ticket gone. A partial value: its id, status, when.
 *
 * @see {@link fact.an_invitation_has_been_taken_away}
 */
export const an_invitation_has_been_taken_away =
  fact.an_invitation_has_been_taken_away.brand<'stand/invitations/fact/an_invitation_has_been_taken_away'>()
export type an_invitation_has_been_taken_away = z.output<typeof an_invitation_has_been_taken_away>

/**
 * Its time over, the invitation had been taken before it: nothing changes (INV-4, BND-8's form).
 *
 * @see {@link fact.the_invitation_was_taken_before_its_time}
 */
export const the_invitation_was_taken_before_its_time =
  fact.the_invitation_was_taken_before_its_time.brand<'stand/invitations/fact/the_invitation_was_taken_before_its_time'>()
export type the_invitation_was_taken_before_its_time = z.output<
  typeof the_invitation_was_taken_before_its_time
>
