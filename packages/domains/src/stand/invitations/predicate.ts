import { z } from 'zod'
import { date_time } from '../../library/index.ts'
import { predicate, id } from './_scope_predicate.ts'

// The vocabulary of the conditions. A predicate declares its parameters;
// its value is the adapters', helped by dsl.ts.

/** An invitation with this id is in the relay's hands, whatever its state. */
export const an_invitation_has_this_id = predicate({
  parameters: z.strictObject({
    invitation_id: id.invitation_id,
  }),
})

/** The stand holds fewer invitations than its room, neither taken nor taken away (INV-2). */
export const the_stand_has_room = predicate({
  parameters: z.strictObject({
    stand: id.stand,
  }),
})

/** An invitation left now can be taken until then: after now, within a ticket's life (INV-2). */
export const it_can_be_taken_until_then = predicate({
  parameters: z.strictObject({
    now: date_time,
    takeable_until: date_time,
  }),
})

/** This invitation is on this stand, neither taken nor taken away (INV-3). */
export const the_invitation_is_on_the_stand = predicate({
  parameters: z.strictObject({
    stand: id.stand,
    invitation_id: id.invitation_id,
  }),
})

/** This invitation is on its stand still: nobody took it (INV-4). */
export const the_invitation_is_still_on_its_stand = predicate({
  parameters: z.strictObject({
    invitation_id: id.invitation_id,
  }),
})

/** Somebody took this invitation (INV-4). */
export const the_invitation_has_been_taken = predicate({
  parameters: z.strictObject({
    invitation_id: id.invitation_id,
  }),
})
