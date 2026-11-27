import { z } from 'zod'
import { command, identity_of, pick, AND, NOT, effect, fact, id, predicate, value } from './_scope_command.ts'
import { date_time } from '../../library/index.ts'

/** The invitation is new, the stand has room for it, and it can be taken until then (INV-2). */
export const an_invitation_can_be_left = AND({
  the_invitation_is_new: NOT(predicate.an_invitation_has_this_id),
  the_stand_has_room: predicate.the_stand_has_room,
  it_can_be_taken_until_then: predicate.it_can_be_taken_until_then,
})

/**
 * The assistant leaves a ticket of its own on the stand `assistente` (INV-2):
 * the relay keeps it, with the time it received it, until when it can be
 * taken, and waits for that time to take it away if nobody took it
 * (INV-4). Its id is the operation's (D75.8): a leave sent again is the
 * duplicate branch (DOM-11), one invitation. Refused when the stand holds
 * five already, or when the time it can be taken until is not after now
 * or more than a ticket's life after it (BND-8).
 */
export const leave_an_invitation = command({
  input: z.strictObject({
    stand: id.stand,
    ticket: value.ticket,
    takeable_until: date_time,
  }),
  outcomes: {
    the_stand_has_room_so_the_invitation_is_left: [
      an_invitation_can_be_left,
      fact.an_invitation_has_been_left,
      pick(effect, 'wait_until_it_can_no_longer_be_taken'),
    ],
  },
  creator: (context) => (input) => {
    const invitation_id = identity_of(id.invitation_id)(context.operation)
    return {
      the_stand_has_room_so_the_invitation_is_left: [
        {
          the_invitation_is_new: { invitation_id: invitation_id },
          the_stand_has_room: { stand: input.stand },
          it_can_be_taken_until_then: { now: context.now, takeable_until: input.takeable_until },
        },
        {
          new_invitation: {
            id: invitation_id,
            stand: input.stand,
            ticket: input.ticket,
            left_at: context.now,
            takeable_until: input.takeable_until,
            status: 'on_the_stand',
          },
        },
        {
          wait_until_it_can_no_longer_be_taken: {
            id: invitation_id,
            payload: { invitation_id: invitation_id },
            not_before: input.takeable_until,
          },
        },
      ],
    }
  },
})

/**
 * Bea presses «Prendi il link» (INV-3): she takes the invitation the page
 * read as the oldest on the stand, by its id; the take's id is the
 * operation's, drawn by the page (D75.8), so that she alone can read the
 * ticket she took. Another passer-by took it, or its time is over,
 * meanwhile: refused, and the page tries the next.
 */
export const take_an_invitation = command({
  input: z.strictObject({
    stand: id.stand,
    invitation_id: id.invitation_id,
  }),
  outcomes: {
    the_invitation_is_on_the_stand_so_it_is_taken: [
      predicate.the_invitation_is_on_the_stand,
      fact.an_invitation_has_been_taken,
    ],
  },
  creator: (context) => (input) => ({
    the_invitation_is_on_the_stand_so_it_is_taken: [
      { stand: input.stand, invitation_id: input.invitation_id },
      {
        taken_invitation: {
          id: input.invitation_id,
          status: 'taken',
          taken_at: context.now,
          take_id: identity_of(id.take_id)(context.operation),
        },
      },
    ],
  }),
})

/**
 * When the invitation can no longer be taken, the effect executor comes
 * back (INV-4): nobody took it, so the relay takes it off the stand, its
 * ticket gone; somebody took it before, and nothing changes (BND-8's
 * form: no entry is cancelled). Its input is the payload of the wait; its
 * operation is the entry's (DOM-14).
 */
export const take_away_an_invitation = command({
  input: z.strictObject({
    invitation_id: id.invitation_id,
  }),
  outcomes: {
    nobody_took_it_so_it_is_taken_away: [
      predicate.the_invitation_is_still_on_its_stand,
      fact.an_invitation_has_been_taken_away,
    ],
    it_was_taken_so_nothing_changes: [
      predicate.the_invitation_has_been_taken,
      fact.the_invitation_was_taken_before_its_time,
    ],
  },
  creator: (context) => (input) => ({
    nobody_took_it_so_it_is_taken_away: [
      { invitation_id: input.invitation_id },
      {
        invitation_taken_away: {
          id: input.invitation_id,
          status: 'taken_away',
          taken_away_at: context.now,
        },
      },
    ],
    it_was_taken_so_nothing_changes: [
      { invitation_id: input.invitation_id },
      { invitation_id: input.invitation_id },
    ],
  }),
})
