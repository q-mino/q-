// generated

// The use cases of `stand/invitations` from `usecase.ts` (DOM-25): the same
// objects under the same names, each schema with its output type under the same
// name, so that one import gives both. Only this module imports `usecase.ts`.

import * as usecase from './usecase.ts'

/**
 * The inviter of a stand leaves an invitation on it: a ticket, until when it can be taken.
 *
 * @see {@link usecase.leave_an_invitation}
 */
export const leave_an_invitation = usecase.leave_an_invitation

/**
 * A passer-by takes an invitation off the stand, by its id: once.
 *
 * @see {@link usecase.take_an_invitation}
 */
export const take_an_invitation = usecase.take_an_invitation

/**
 * The relay takes an invitation off the stand when its time is over: the return of its wait.
 *
 * @see {@link usecase.take_away_an_invitation}
 */
export const take_away_an_invitation = usecase.take_away_an_invitation

/**
 * The invitations on a stand, the oldest first: never their tickets.
 *
 * @see {@link usecase.the_invitations_on_a_stand}
 */
export const the_invitations_on_a_stand = usecase.the_invitations_on_a_stand

/**
 * The invitation a take took, with its ticket.
 *
 * @see {@link usecase.the_invitation_taken}
 */
export const the_invitation_taken = usecase.the_invitation_taken
