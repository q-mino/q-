// generated

// The values of `stand/invitations` from `value.ts` (DOM-25): the same objects
// under the same names, each schema with its output type under the same name,
// so that one import gives both. Only this module imports `value.ts`.

import { z } from 'zod'
import * as value from './value.ts'

/**
 * A ticket as an inviter leaves it (INV-1): the text after `ticket=` in a
 * ticket's link (WEB-1), base64url, at most 4 096 characters. Opaque to the
 * relay, which never reads it (ADP-4): a ticket out of its form is told by
 * the visitor's phone, the inviter's fault.
 *
 * @see {@link value.ticket}
 */
export const ticket = value.ticket
export type ticket = z.output<typeof ticket>

/**
 * On the stand, a passer-by may take it; taken, once, by whom took it;
 * taken away, its time over and nobody took it (INV-3, INV-4).
 *
 * @see {@link value.invitation_status}
 */
export const invitation_status = value.invitation_status
export type invitation_status = z.output<typeof invitation_status>

/**
 * An invitation on its stand, as its inviter left it, at the time the relay
 * received it by its clock, until when it can be taken by the inviter's
 * claim (F2).
 *
 * @see {@link value.invitation_on_the_stand}
 */
export const invitation_on_the_stand = value.invitation_on_the_stand
export type invitation_on_the_stand = z.output<typeof invitation_on_the_stand>

/**
 * An invitation taken: by which take and when. Its ticket stays with it,
 * for the one who took it to read (INV-3), until the relay forgets it.
 *
 * @see {@link value.taken_invitation}
 */
export const taken_invitation = value.taken_invitation
export type taken_invitation = z.output<typeof taken_invitation>

/**
 * An invitation nobody took in its time: what is left of it, its ticket gone (INV-4).
 *
 * @see {@link value.invitation_taken_away}
 */
export const invitation_taken_away = value.invitation_taken_away
export type invitation_taken_away = z.output<typeof invitation_taken_away>

/**
 * An invitation of a stand: its states share every field, so any field reads without narrowing.
 *
 * @see {@link value.invitation}
 */
export const invitation = value.invitation
export type invitation = z.output<typeof invitation>

/**
 * What a passer-by sees of an invitation on the stand: which one, when it was left, until when. Never its ticket (INV-5).
 *
 * @see {@link value.invitation_in_sight}
 */
export const invitation_in_sight = value.invitation_in_sight
export type invitation_in_sight = z.output<typeof invitation_in_sight>

/**
 * What the one who took an invitation reads of it: its ticket, and until when it was takeable.
 *
 * @see {@link value.invitation_in_hand}
 */
export const invitation_in_hand = value.invitation_in_hand
export type invitation_in_hand = z.output<typeof invitation_in_hand>
