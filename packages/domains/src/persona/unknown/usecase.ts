import { z } from 'zod'
import { command_use_case_over, value, address_book } from './_scope_usecase.ts'

// The use cases of `unknown`, the leaves of its tree (PER-6, PER-11): a
// face never seen on this node introduces itself with a ticket of the
// user's, the paper's registration. The bond is the one the ticket names,
// and their face's key the one that signed the letter (`context.ticket`),
// never the input (PER-8). The outcome is projected in the introducer's
// words (D45); a leaf served to a peer answers in one event (F7).

/**
 * Dario introduces himself to Carla's phone with the ticket she sent him
 * in a link (BND-10, PER-11): the secret, the name he is introduced as,
 * his mailbox for the bond. Her ticket ready and the secret its, they are
 * bonded; at the bond kept with his face (the QR crossed), it confirms it.
 */
export const introduce_myself = command_use_case_over({
  use_case: address_book.usecase.accept_their_introduction,
  input: z.strictObject({
    secret: value.ticket_secret,
    introduced_as: value.face_name,
    mailbox: value.mailbox,
  }),
  creator: (context) => (input) => ({
    bond_id: context.ticket.bond_id,
    secret: input.secret,
    their_face: { key: context.ticket.their_key, introduced_as: input.introduced_as },
    their_mailbox: {
      deposit_address: input.mailbox.deposit_address,
      relays: input.mailbox.relays,
    },
  }),
  events: {
    /** The ticket was ready and the secret its: the bond is kept, at a distance. */
    you_are_bonded: z.strictObject({}),
    /** The user had opened his ticket within two minutes: the QR crossed, in person. */
    you_met_in_person: z.strictObject({}),
    /** The user had opened his ticket earlier: his introduction confirms the bond. */
    the_bond_is_confirmed: z.strictObject({}),
    you_introduced_yourself_already: z.strictObject({}),
    /** A ticket used by another face, expired, or a secret not its: the introducer need not know which. */
    the_ticket_cannot_be_used: z.strictObject({}),
  },
  projection: {
    my_ticket_is_ready_with_its_secret_so_we_are_bonded: () => ({
      event: 'you_are_bonded',
      payload: {},
    }),
    i_opened_their_ticket_within_two_minutes_so_we_met_in_person: () => ({
      event: 'you_met_in_person',
      payload: {},
    }),
    i_opened_their_ticket_earlier_so_they_have_me_now: () => ({
      event: 'the_bond_is_confirmed',
      payload: {},
    }),
    their_introduction_came_already_so_nothing_changes: () => ({
      event: 'you_introduced_yourself_already',
      payload: {},
    }),
    rejected: () => ({ event: 'the_ticket_cannot_be_used', payload: {} }),
  },
})
