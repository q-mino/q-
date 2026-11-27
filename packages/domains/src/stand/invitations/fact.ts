import { z } from 'zod'
import { fact, id, value } from './_scope_fact.ts'

/**
 * An inviter has left an invitation on its stand (INV-2): the whole
 * invitation, with the time the relay received it and until when it can be
 * taken. Carries the change of state (DOM-5, V9).
 */
export const an_invitation_has_been_left = fact({
  payload: z.strictObject({
    new_invitation: value.invitation_on_the_stand,
  }),
})

/**
 * A passer-by has taken an invitation (INV-3): a partial value, the
 * invitation's id, its status, when and by which take. Its ticket is read
 * by the one who took it, by the take (`the_invitation_taken`).
 */
export const an_invitation_has_been_taken = fact({
  payload: z.strictObject({
    taken_invitation: value.taken_invitation.pick({
      id: true,
      status: true,
      taken_at: true,
      take_id: true,
    }),
  }),
})

/**
 * Its time over, nobody took the invitation: the relay took it off the
 * stand (INV-4), its ticket gone. A partial value: its id, status, when.
 */
export const an_invitation_has_been_taken_away = fact({
  payload: z.strictObject({
    invitation_taken_away: value.invitation_taken_away.pick({
      id: true,
      status: true,
      taken_away_at: true,
    }),
  }),
})

/** Its time over, the invitation had been taken before it: nothing changes (INV-4, BND-8's form). */
export const the_invitation_was_taken_before_its_time = fact({
  payload: z.strictObject({
    invitation_id: id.invitation_id,
  }),
})
