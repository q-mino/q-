import { command_use_case, read_use_case, command, effect, query } from './_scope_usecase.ts'

// The use cases of `invitations`, its only entry (DOM-2): the desk's
// personas and the effect executor reach the stand through them.

/** The inviter of a stand leaves an invitation on it: a ticket, until when it can be taken. */
export const leave_an_invitation = command_use_case({ command: command.leave_an_invitation })

/** A passer-by takes an invitation off the stand, by its id: once. */
export const take_an_invitation = command_use_case({ command: command.take_an_invitation })

/** The relay takes an invitation off the stand when its time is over: the return of its wait. */
export const take_away_an_invitation = command_use_case({
  command: command.take_away_an_invitation,
  returns_from: effect.wait_until_it_can_no_longer_be_taken,
})

/** The invitations on a stand, the oldest first: never their tickets. */
export const the_invitations_on_a_stand = read_use_case({ query: query.the_invitations_on_a_stand })

/** The invitation a take took, with its ticket. */
export const the_invitation_taken = read_use_case({ query: query.the_invitation_taken })
