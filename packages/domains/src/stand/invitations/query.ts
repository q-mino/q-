import { z } from 'zod'
import { query, AND, invitation_selection, id, value } from './_scope_query.ts'

/** The invitation is on the stand, and nobody took it yet. */
export const the_invitation_waits_on_the_stand = AND({
  the_invitation_is_on_this_stand: invitation_selection.the_invitation_is_on_this_stand,
  the_invitation_can_be_taken: invitation_selection.the_invitation_can_be_taken,
})

/**
 * The invitations a passer-by may take on a stand, the oldest first (INV-3):
 * each one's id and until when it can be taken, never its ticket (INV-5).
 * The invitation's id, the entry's identity, closes the order (LIB-9).
 */
export const the_invitations_on_a_stand = query({
  input: z.strictObject({
    stand: id.stand,
  }),
  fields: value.invitation_in_sight,
  identity: 'id',
  selection: the_invitation_waits_on_the_stand,
  order: { left_at: 'ascending' },
  creator: () => (input) => ({
    selection: {
      the_invitation_is_on_this_stand: { stand: input.stand },
      the_invitation_can_be_taken: {},
    },
  }),
})

/**
 * The invitation a take took, with its ticket (INV-3): read by the one who
 * took it, the only one who can name the take (its operation drawn at random).
 */
export const the_invitation_taken = query({
  input: z.strictObject({
    take_id: id.take_id,
  }),
  fields: value.invitation_in_hand,
  identity: 'id',
  selection: invitation_selection.the_invitation_was_taken_by,
  order: { id: 'ascending' },
  creator: () => (input) => ({
    selection: { take_id: input.take_id },
  }),
})
