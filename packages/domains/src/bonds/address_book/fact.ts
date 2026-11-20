import { z } from 'zod'
import { fact, id, value } from './_scope_fact.ts'

// The facts of the address book carry the change of its state (DOM-5, V9):
// every value they write, and the adapters materialize it.

/**
 * The user gave a bond a new name (BND-6): Anna calls Bruno "Bru". A partial
 * value, the bond's id and its name; the name Bruno is introduced as stays.
 */
export const a_bond_has_been_renamed = fact({
  payload: z.strictObject({
    renamed_bond: value.kept_bond.pick({ id: true, name: true }),
  }),
})

/**
 * The user removed a bond from her list (BND-6): a partial value, its id, its
 * new status and when. The rest of the bond stays, out of the list.
 */
export const a_bond_has_been_removed = fact({
  payload: z.strictObject({
    removed_bond: value.removed_bond.pick({ id: true, status: true, removed_at: true }),
  }),
})

/** Nothing to do (DOM-6): the bond was removed already, its first removal stands. */
export const a_bond_has_been_removed_again = fact({
  payload: z.strictObject({
    bond_id: id.bond_id,
  }),
})

/** Anna's phone, at its first start, asked for her first face, "Anna", at the top (BND-8): the safe is making it. */
export const a_first_face_has_been_asked_for = fact({
  payload: z.strictObject({
    face_being_made: value.face_being_made,
  }),
})

/** The safe made the face (BND-8): its public key, copied from the safe's fact, and its new status. */
export const a_face_has_been_made = fact({
  payload: z.strictObject({
    made_face: value.made_face.pick({ id: true, status: true, public_key: true }),
  }),
})

/** Anna asked for a ticket for her face (BND-8), which holds for 48 hours: the safe is drawing its mailbox's key. */
export const a_ticket_has_been_asked_for = fact({
  payload: z.strictObject({
    ticket_being_prepared: value.ticket_being_prepared,
  }),
})

/** The safe drew the key of the ticket's mailbox (BND-8): the ticket has its D, and is ready. */
export const a_ticket_has_been_prepared = fact({
  payload: z.strictObject({
    bond_id: id.bond_id,
    deposit_address: value.deposit_address,
  }),
})

/** The key of a ticket's mailbox came after the ticket expired (BND-8): nothing changes, the ticket stays expired. */
export const a_mailbox_has_come_for_an_expired_ticket = fact({
  payload: z.strictObject({
    bond_id: id.bond_id,
  }),
})

/** No one used the ticket in its 48 hours (BND-8): it expired, and no bond comes of it. */
export const a_ticket_has_expired = fact({
  payload: z.strictObject({
    expired_ticket: value.ticket_expired.pick({ id: true, status: true }),
  }),
})

/** Nothing to do (DOM-6): the ticket made its bond before it could expire. */
export const the_ticket_was_used_before_it_expired = fact({
  payload: z.strictObject({
    bond_id: id.bond_id,
  }),
})

/**
 * Anna opened Carla's ticket, presenting her own (BND-10): the bond is
 * kept, Carla's face and mailbox as her ticket declared them, at a distance
 * for now, the confirmation awaited, Anna's introduction sent.
 */
export const a_bond_has_been_made_by_opening_their_ticket = fact({
  payload: z.strictObject({
    opened_bond: value.kept_bond.pick({
      id: true,
      status: true,
      name: true,
      their_face: true,
      their_mailbox: true,
      handshake: true,
      confirmation: true,
      my_introduction: true,
    }),
  }),
})

/**
 * Bruno's introduction to Anna's ticket came first, and she opened his
 * ticket within two minutes (BND-10): the tickets crossed, in person, and
 * her introduction is sent.
 */
export const their_ticket_has_been_opened_in_person = fact({
  payload: z.strictObject({
    met_bond: value.kept_bond.pick({ id: true, handshake: true, my_introduction: true }),
  }),
})

/**
 * Their introduction came first, and the user opened their ticket later
 * (BND-10): her introduction is sent, the handshake stays at a distance.
 */
export const their_ticket_has_been_opened_after_their_introduction = fact({
  payload: z.strictObject({
    introduced_bond: value.kept_bond.pick({ id: true, my_introduction: true }),
  }),
})

/** Nothing to do (DOM-6): the user opened their ticket again, her introduction was sent already. */
export const their_ticket_has_been_opened_again = fact({
  payload: z.strictObject({
    bond_id: id.bond_id,
  }),
})

/**
 * Carla's phone took Anna's introduction to its ready ticket (BND-10, PER-11):
 * the bond is kept, Anna's face and mailbox as her introduction declared
 * them, named as she is introduced, at a distance, the confirmation
 * received (her introduction is a letter of hers), Carla's introduction
 * not sent.
 */
export const a_bond_has_been_made_by_their_introduction = fact({
  payload: z.strictObject({
    introduced_bond: value.kept_bond.pick({
      id: true,
      status: true,
      name: true,
      their_face: true,
      their_mailbox: true,
      handshake: true,
      confirmation: true,
      my_introduction: true,
    }),
  }),
})

/**
 * Anna opened Bruno's ticket, and his introduction to hers came within two
 * minutes (BND-10): the tickets crossed, in person, and he has her.
 */
export const their_introduction_has_come_in_person = fact({
  payload: z.strictObject({
    met_bond: value.kept_bond.pick({ id: true, handshake: true, confirmation: true }),
  }),
})

/** Their introduction to my ticket came after I opened theirs, later than two minutes (BND-10): they have me. */
export const their_introduction_has_come = fact({
  payload: z.strictObject({
    confirmed_bond: value.kept_bond.pick({ id: true, confirmation: true }),
  }),
})

/** Nothing to do (DOM-6): their introduction came again, the confirmation was received already. */
export const their_introduction_has_come_again = fact({
  payload: z.strictObject({
    bond_id: id.bond_id,
  }),
})
