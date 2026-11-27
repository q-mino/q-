// generated

// The commands of `stand/invitations` from `command.ts` (DOM-25): the same
// objects under the same names, each schema with its output type under the same
// name, so that one import gives both. Only this module imports `command.ts`.

import { z } from 'zod'
import * as command from './command.ts'

/**
 * The invitation is new, the stand has room for it, and it can be taken until then (INV-2).
 *
 * @see {@link command.an_invitation_can_be_left}
 */
export const an_invitation_can_be_left = command.an_invitation_can_be_left
export type an_invitation_can_be_left = z.output<typeof an_invitation_can_be_left>

/**
 * The assistant leaves a ticket of its own on the stand `assistente` (INV-2):
 * the relay keeps it, with the time it received it, until when it can be
 * taken, and waits for that time to take it away if nobody took it
 * (INV-4). Its id is the operation's (D75.8): a leave sent again is the
 * duplicate branch (DOM-11), one invitation. Refused when the stand holds
 * five already, or when the time it can be taken until is not after now
 * or more than a ticket's life after it (BND-8).
 *
 * @see {@link command.leave_an_invitation}
 */
export const leave_an_invitation = command.leave_an_invitation

/**
 * The input of `leave_an_invitation`, declared inline.
 *
 * @see {@link command.leave_an_invitation}
 */
export const leave_an_invitation_input = command.leave_an_invitation.input
export type leave_an_invitation_input = z.output<typeof leave_an_invitation_input>

/**
 * Bea presses «Prendi il link» (INV-3): she takes the invitation the page
 * read as the oldest on the stand, by its id; the take's id is the
 * operation's, drawn by the page (D75.8), so that she alone can read the
 * ticket she took. Another passer-by took it, or its time is over,
 * meanwhile: refused, and the page tries the next.
 *
 * @see {@link command.take_an_invitation}
 */
export const take_an_invitation = command.take_an_invitation

/**
 * The input of `take_an_invitation`, declared inline.
 *
 * @see {@link command.take_an_invitation}
 */
export const take_an_invitation_input = command.take_an_invitation.input
export type take_an_invitation_input = z.output<typeof take_an_invitation_input>

/**
 * When the invitation can no longer be taken, the effect executor comes
 * back (INV-4): nobody took it, so the relay takes it off the stand, its
 * ticket gone; somebody took it before, and nothing changes (BND-8's
 * form: no entry is cancelled). Its input is the payload of the wait; its
 * operation is the entry's (DOM-14).
 *
 * @see {@link command.take_away_an_invitation}
 */
export const take_away_an_invitation = command.take_away_an_invitation

/**
 * The input of `take_away_an_invitation`, declared inline.
 *
 * @see {@link command.take_away_an_invitation}
 */
export const take_away_an_invitation_input = command.take_away_an_invitation.input
export type take_away_an_invitation_input = z.output<typeof take_away_an_invitation_input>
