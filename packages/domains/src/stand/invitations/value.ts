import { z } from 'zod'
import { date_time } from '../../library/index.ts'
import { id } from './_scope_value.ts'

/**
 * A ticket as an inviter leaves it (INV-1): the text after `ticket=` in a
 * ticket's link (WEB-1), base64url, at most 4 096 characters. Opaque to the
 * relay, which never reads it (ADP-4): a ticket out of its form is told by
 * the visitor's phone, the inviter's fault.
 */
export const ticket = z
  .string()
  .regex(/^[A-Za-z0-9_-]+$/)
  .max(4096)

/**
 * On the stand, a passer-by may take it; taken, once, by whom took it;
 * taken away, its time over and nobody took it (INV-3, INV-4).
 */
export const invitation_status = z.enum(['on_the_stand', 'taken', 'taken_away'])

/** A field a state does not have: in the type, `?: undefined`; in the data, absent. */
const absent = z.undefined().optional()

/** Every field of every state of an invitation. Not a state: each state subtracts from it. */
const every_invitation_field = z.strictObject({
  id: id.invitation_id,
  stand: id.stand,
  ticket: ticket,
  left_at: date_time,
  takeable_until: date_time,
  status: invitation_status,
  taken_at: date_time,
  take_id: id.take_id,
  taken_away_at: date_time,
})

/**
 * An invitation on its stand, as its inviter left it, at the time the relay
 * received it by its clock, until when it can be taken by the inviter's
 * claim (F2).
 */
export const invitation_on_the_stand = every_invitation_field.extend({
  status: z.literal(invitation_status.enum.on_the_stand),
  taken_at: absent,
  take_id: absent,
  taken_away_at: absent,
})

/**
 * An invitation taken: by which take and when. Its ticket stays with it,
 * for the one who took it to read (INV-3), until the relay forgets it.
 */
export const taken_invitation = every_invitation_field.extend({
  status: z.literal(invitation_status.enum.taken),
  taken_away_at: absent,
})

/** An invitation nobody took in its time: what is left of it, its ticket gone (INV-4). */
export const invitation_taken_away = every_invitation_field.extend({
  status: z.literal(invitation_status.enum.taken_away),
  ticket: absent,
  taken_at: absent,
  take_id: absent,
})

/** An invitation of a stand: its states share every field, so any field reads without narrowing. */
export const invitation = z.discriminatedUnion('status', [
  invitation_on_the_stand,
  taken_invitation,
  invitation_taken_away,
])

/** What a passer-by sees of an invitation on the stand: which one, when it was left, until when. Never its ticket (INV-5). */
export const invitation_in_sight = invitation_on_the_stand.pick({
  id: true,
  left_at: true,
  takeable_until: true,
})

/** What the one who took an invitation reads of it: its ticket, and until when it was takeable. */
export const invitation_in_hand = taken_invitation.pick({
  id: true,
  ticket: true,
  takeable_until: true,
})
