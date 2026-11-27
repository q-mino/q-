import { z } from 'zod'
import { command_use_case_over, value, _desk, invitations } from './_scope_usecase.ts'
import * as zz from '../../library/index.ts'

// The use cases of `inviter`, the leaves of its tree (PER-6, INV-5): who
// leaves invitations on the stand it is the inviter of, signing each
// request with the stand's key (AST-13). Told when the invitation is on the
// stand, or why not: the stand full, or a time it cannot be taken until.

/**
 * The assistant leaves a ticket on the stand `assistente`, takeable for a
 * day (AST-13): the relay keeps it, and says when it received it. A leave
 * sent again is told the same (DOM-11). On a stand it is not the inviter
 * of: refused.
 */
export const leave_an_invitation = command_use_case_over({
  use_case: invitations.usecase.leave_an_invitation,
  input: z.strictObject({
    stand: invitations.id.stand,
    ticket: value.ticket,
    takeable_until: zz.date_time,
  }),
  is_refused_unless: {
    /** The key of `assistente` leaves on `assistente`, on no other stand. */
    the_stand_is_the_inviter_s: (context) => (input) =>
      _desk.dsl.the_caller_is_the_inviter_of(context.caller)(input.stand),
  },
  creator: () => (input) => ({
    stand: input.stand,
    ticket: input.ticket,
    takeable_until: input.takeable_until,
  }),
  events: {
    the_invitation_is_on_the_stand: z.strictObject({
      invitation_id: invitations.id.invitation_id,
      left_at: zz.date_time,
    }),
    /** Five invitations on it already: the assistant leaves its ticket unused, to expire (AST-13). */
    the_stand_is_full: z.strictObject({}),
    /** The time it can be taken until is not after now, or more than 48 hours after it (INV-2). */
    not_takeable_then: z.strictObject({}),
    /** Not the inviter of that stand. */
    the_invitation_cannot_be_left: z.strictObject({}),
  },
  projection: {
    the_stand_has_room_so_the_invitation_is_left: (fact) => ({
      event: 'the_invitation_is_on_the_stand',
      payload: { invitation_id: fact.new_invitation.id, left_at: fact.new_invitation.left_at },
    }),
    rejected: (failures) => {
      const why = _desk.dsl.why_a_leave_is_refused(failures)
      return why === 'the_stand_is_full'
        ? { event: 'the_stand_is_full', payload: {} }
        : why === 'not_takeable_then'
          ? { event: 'not_takeable_then', payload: {} }
          : { event: 'the_invitation_cannot_be_left', payload: {} }
    },
  },
})
