import { z } from 'zod'
import { command_use_case_over, read_use_case_over, value, invitations } from './_scope_usecase.ts'
import * as zz from '../../library/index.ts'

// The use cases of `passer_by`, the leaves of its tree (PER-6, INV-3,
// INV-5): anyone, with no credential, who reads a stand and takes an
// invitation off it. A passer-by has no id (MBX-6's reason): a take is told
// apart by its operation, which the page draws at random, and only who
// took an invitation can read its ticket, by its take.

/**
 * The invitations on the stand `assistente`, the oldest first: each one's
 * id and until when it can be taken, never its ticket (INV-5). What the
 * assistant reads to top the stand up (AST-13), and the page to take the
 * oldest (INV-3).
 */
export const the_invitations_on_a_stand = read_use_case_over({
  use_case: invitations.usecase.the_invitations_on_a_stand,
  input: z.strictObject({
    stand: invitations.id.stand,
  }),
  creator: () => (input) => ({ query: { stand: input.stand } }),
  entry: z.strictObject({
    invitation_id: invitations.id.invitation_id,
    takeable_until: zz.date_time,
  }),
  projection: (entry) => ({
    invitation_id: entry.id,
    takeable_until: entry.takeable_until,
  }),
})

/**
 * Bea takes the oldest invitation on the stand, by its id (INV-3): hers,
 * under her take. Another passer-by took it meanwhile, or its time is
 * over: refused, and the page tries the next.
 */
export const take_an_invitation = command_use_case_over({
  use_case: invitations.usecase.take_an_invitation,
  input: z.strictObject({
    stand: invitations.id.stand,
    invitation_id: invitations.id.invitation_id,
  }),
  creator: () => (input) => ({
    stand: input.stand,
    invitation_id: input.invitation_id,
  }),
  events: {
    the_invitation_is_yours: z.strictObject({
      take_id: invitations.id.take_id,
    }),
    the_invitation_is_no_longer_on_the_stand: z.strictObject({}),
  },
  projection: {
    the_invitation_is_on_the_stand_so_it_is_taken: (fact) => ({
      event: 'the_invitation_is_yours',
      payload: { take_id: fact.taken_invitation.take_id },
    }),
    rejected: () => ({ event: 'the_invitation_is_no_longer_on_the_stand', payload: {} }),
  },
})

/**
 * Bea reads the ticket she took, by her take (INV-3): its link is the one
 * the page shows her. Nobody else can name her take.
 */
export const the_invitation_taken = read_use_case_over({
  use_case: invitations.usecase.the_invitation_taken,
  input: z.strictObject({
    take_id: invitations.id.take_id,
  }),
  creator: () => (input) => ({ query: { take_id: input.take_id } }),
  entry: z.strictObject({
    invitation_id: invitations.id.invitation_id,
    ticket: value.ticket,
    takeable_until: zz.date_time,
  }),
  projection: (entry) => ({
    invitation_id: entry.id,
    ticket: entry.ticket,
    takeable_until: entry.takeable_until,
  }),
})
