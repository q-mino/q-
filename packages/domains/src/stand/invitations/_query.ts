// generated

// The queries of `stand/invitations` from `query.ts` (DOM-25): the same objects
// under the same names, each schema with its output type under the same name,
// so that one import gives both. Only this module imports `query.ts`.

import { z } from 'zod'
import * as query from './query.ts'

/**
 * The invitation is on the stand, and nobody took it yet.
 *
 * @see {@link query.the_invitation_waits_on_the_stand}
 */
export const the_invitation_waits_on_the_stand = query.the_invitation_waits_on_the_stand
export type the_invitation_waits_on_the_stand = z.output<typeof the_invitation_waits_on_the_stand>

/**
 * The invitations a passer-by may take on a stand, the oldest first (INV-3):
 * each one's id and until when it can be taken, never its ticket (INV-5).
 * The invitation's id, the entry's identity, closes the order (LIB-9).
 *
 * @see {@link query.the_invitations_on_a_stand}
 */
export const the_invitations_on_a_stand = query.the_invitations_on_a_stand

/**
 * The input of `the_invitations_on_a_stand`, declared inline.
 *
 * @see {@link query.the_invitations_on_a_stand}
 */
export const the_invitations_on_a_stand_input = query.the_invitations_on_a_stand.input
export type the_invitations_on_a_stand_input = z.output<typeof the_invitations_on_a_stand_input>

/**
 * The invitation a take took, with its ticket (INV-3): read by the one who
 * took it, the only one who can name the take (its operation drawn at random).
 *
 * @see {@link query.the_invitation_taken}
 */
export const the_invitation_taken = query.the_invitation_taken

/**
 * The input of `the_invitation_taken`, declared inline.
 *
 * @see {@link query.the_invitation_taken}
 */
export const the_invitation_taken_input = query.the_invitation_taken.input
export type the_invitation_taken_input = z.output<typeof the_invitation_taken_input>
