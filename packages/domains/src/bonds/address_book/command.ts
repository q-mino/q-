import { z } from 'zod'
import {
  command,
  AND,
  NOT,
  OR,
  pick,
  dsl,
  effect,
  id,
  fact,
  predicate,
  value,
} from './_scope_command.ts'

/**
 * Anna calls Bruno "Bru" on her phone (BND-6): the name she gives the bond,
 * hers only. The name Bruno is introduced as stays beside it, and nothing
 * goes to him. A bond she removed has no name to change: refused.
 */
export const rename_a_bond = command({
  input: z.strictObject({
    bond_id: id.bond_id,
    name: value.bond_name,
  }),
  outcomes: {
    the_bond_is_kept_so_it_is_renamed: [predicate.the_bond_is_kept, fact.a_bond_has_been_renamed],
  },
  creator: () => (input) => ({
    the_bond_is_kept_so_it_is_renamed: [
      { bond_id: input.bond_id },
      { renamed_bond: { id: input.bond_id, name: input.name } },
    ],
  }),
})

/**
 * Anna removes Bruno from her list (BND-6), the screens' "Elimina e basta":
 * her phone collects his mailbox no more, and tells him nothing. A bond
 * removed already records that nothing changes (DOM-6).
 */
export const remove_a_bond = command({
  input: z.strictObject({
    bond_id: id.bond_id,
  }),
  outcomes: {
    the_bond_is_kept_so_it_is_removed: [predicate.the_bond_is_kept, fact.a_bond_has_been_removed],
    the_bond_is_removed_already_so_nothing_changes: [
      predicate.the_bond_is_removed,
      fact.a_bond_has_been_removed_again,
    ],
  },
  creator: (context) => (input) => ({
    the_bond_is_kept_so_it_is_removed: [
      { bond_id: input.bond_id },
      { removed_bond: { id: input.bond_id, status: 'removed', removed_at: context.now } },
    ],
    the_bond_is_removed_already_so_nothing_changes: [
      { bond_id: input.bond_id },
      { bond_id: input.bond_id },
    ],
  }),
})

/**
 * Anna's phone, at its first start, makes her face "Anna" (BND-8), at the
 * top of her tree: a process of the address book, whose step toward the
 * safe is a reaction (`reaction/first_face`, GR-9, PER-21). In stage 1 one
 * face: a second first face is refused.
 */
export const make_my_first_face = command({
  input: z.strictObject({
    face_id: id.face_id,
    name: value.face_name,
  }),
  outcomes: {
    the_user_has_no_face_so_her_first_is_asked_for: [
      NOT(predicate.the_user_has_a_face),
      fact.a_first_face_has_been_asked_for,
    ],
  },
  creator: () => (input) => ({
    the_user_has_no_face_so_her_first_is_asked_for: [
      {},
      {
        face_being_made: {
          id: input.face_id,
          status: 'being_made',
          name: input.name,
          position: { place: 'at_the_top' },
        },
      },
    ],
  }),
})

/**
 * The safe made Anna's face (BND-8): the address book keeps its public key,
 * from the safe's fact, by a reaction (`reaction/first_face`). The face can
 * be shown, and bonded.
 */
export const keep_the_key_of_a_face = command({
  input: z.strictObject({
    face_id: id.face_id,
    public_key: value.face_key,
  }),
  outcomes: {
    the_face_is_being_made_so_it_is_made: [
      predicate.the_face_is_being_made,
      fact.a_face_has_been_made,
    ],
  },
  creator: () => (input) => ({
    the_face_is_being_made_so_it_is_made: [
      { face_id: input.face_id },
      { made_face: { id: input.face_id, status: 'made', public_key: input.public_key } },
    ],
  }),
})

/** The bond is new, and the face it is for is made. */
export const a_ticket_can_be_prepared = AND({
  the_bond_is_new: NOT(predicate.a_bond_has_this_id),
  the_face_is_made: predicate.the_face_is_made,
})

/**
 * Anna asks for a ticket for her face (BND-8), to show Bruno in a QR or to
 * send Carla in a link, or to present to a ticket she opens: the ticket of
 * a bond to be, under the bond's id. It holds 48 hours, which a wait
 * awaits (DOM-13); the safe draws its mailbox's key by a reaction
 * (`reaction/ticket`). The relays are the ones she declares, one in stage 1.
 */
export const prepare_a_ticket = command({
  input: z.strictObject({
    bond_id: id.bond_id,
    face_id: id.face_id,
    relays: value.relays,
  }),
  outcomes: {
    the_face_is_made_so_a_ticket_is_asked_for: [
      a_ticket_can_be_prepared,
      fact.a_ticket_has_been_asked_for,
      pick(effect, 'wait_until_the_ticket_expires'),
    ],
  },
  creator: (context) => (input) => {
    const expires_at = dsl.the_expiry_of_a_ticket_asked_at(context.now)
    return {
      the_face_is_made_so_a_ticket_is_asked_for: [
        {
          the_bond_is_new: { bond_id: input.bond_id },
          the_face_is_made: { face_id: input.face_id },
        },
        {
          ticket_being_prepared: {
            id: input.bond_id,
            status: 'ticket_being_prepared',
            my_face_id: input.face_id,
            my_mailbox: { relays: input.relays },
            expires_at: expires_at,
          },
        },
        {
          wait_until_the_ticket_expires: {
            id: input.bond_id,
            payload: { bond_id: input.bond_id },
            not_before: expires_at,
          },
        },
      ],
    }
  },
})

/**
 * The safe drew the key of the ticket's mailbox (BND-8): the address book
 * keeps its D, by a reaction (`reaction/ticket`), and the ticket is ready to
 * be shown. Come after the ticket expired, it changes nothing (DOM-23: a
 * step's outcome is a fact).
 */
export const keep_the_mailbox_of_a_ticket = command({
  input: z.strictObject({
    bond_id: id.bond_id,
    deposit_address: value.deposit_address,
  }),
  outcomes: {
    the_ticket_is_being_prepared_so_it_is_ready: [
      predicate.the_ticket_is_being_prepared,
      fact.a_ticket_has_been_prepared,
    ],
    the_ticket_has_expired_so_nothing_changes: [
      predicate.the_ticket_has_expired,
      fact.a_mailbox_has_come_for_an_expired_ticket,
    ],
  },
  creator: () => (input) => ({
    the_ticket_is_being_prepared_so_it_is_ready: [
      { bond_id: input.bond_id },
      { bond_id: input.bond_id, deposit_address: input.deposit_address },
    ],
    the_ticket_has_expired_so_nothing_changes: [
      { bond_id: input.bond_id },
      { bond_id: input.bond_id },
    ],
  }),
})

/** The ticket is still unused: ready, or still being prepared. */
export const the_ticket_is_unused = OR({
  the_ticket_is_ready: predicate.the_ticket_is_ready,
  the_ticket_is_being_prepared: predicate.the_ticket_is_being_prepared,
})

/** The ticket made its bond: kept, or removed since. */
export const the_ticket_made_its_bond = OR({
  the_bond_is_kept: predicate.the_bond_is_kept,
  the_bond_is_removed: predicate.the_bond_is_removed,
})

/**
 * 48 hours after it was asked for, the effect executor comes back (BND-8):
 * the ticket expires if no one used it, and its mailbox is collected no
 * more; a ticket that made its bond stays as it is. Its input is the
 * payload of the wait; its operation is the entry's (DOM-14).
 */
export const let_a_ticket_expire = command({
  input: z.strictObject({
    bond_id: id.bond_id,
  }),
  outcomes: {
    the_ticket_is_unused_so_it_expires: [the_ticket_is_unused, fact.a_ticket_has_expired],
    the_ticket_made_its_bond_so_nothing_changes: [
      the_ticket_made_its_bond,
      fact.the_ticket_was_used_before_it_expired,
    ],
  },
  creator: () => (input) => ({
    the_ticket_is_unused_so_it_expires: [
      {
        the_ticket_is_ready: { bond_id: input.bond_id },
        the_ticket_is_being_prepared: { bond_id: input.bond_id },
      },
      { expired_ticket: { id: input.bond_id, status: 'ticket_expired' } },
    ],
    the_ticket_made_its_bond_so_nothing_changes: [
      {
        the_bond_is_kept: { bond_id: input.bond_id },
        the_bond_is_removed: { bond_id: input.bond_id },
      },
      { bond_id: input.bond_id },
    ],
  }),
})

/** The bond is kept with this face of theirs, and my introduction is not sent yet: theirs came first. */
export const their_introduction_came_first = AND({
  the_bond_is_kept: predicate.the_bond_is_kept,
  the_bond_is_with_their_face: predicate.the_bond_is_with_this_face,
  my_introduction_is_not_sent: NOT(predicate.my_introduction_is_sent),
})

/** Their introduction came first, within two minutes: the tickets crossed in person. */
export const their_introduction_came_first_within_two_minutes = AND({
  their_introduction_came_first: their_introduction_came_first,
  the_handshake_began_within_two_minutes: predicate.the_handshake_began_within_two_minutes_of,
})

/** Their introduction came first, earlier than two minutes ago. */
export const their_introduction_came_first_earlier = AND({
  their_introduction_came_first: their_introduction_came_first,
  the_handshake_began_earlier: NOT(predicate.the_handshake_began_within_two_minutes_of),
})

/** The bond is kept with this face of theirs, and my introduction is sent already. */
export const my_introduction_was_sent_already = AND({
  the_bond_is_kept: predicate.the_bond_is_kept,
  the_bond_is_with_their_face: predicate.the_bond_is_with_this_face,
  my_introduction_is_sent: predicate.my_introduction_is_sent,
})

/**
 * Anna opens a ticket of someone else's (BND-10): Bruno's QR in front of
 * her, Carla's link, presenting a ticket of hers, the one she shows Bruno
 * or one prepared for Carla's link. Her ticket ready, the bond is kept on
 * her phone, their face and mailbox as their ticket declares them (F2), at
 * a distance for now, the confirmation awaited, and her introduction goes
 * to their ticket's mailbox. If Bruno's introduction to her ticket came
 * first (the QR crossed), the bond is there: her introduction goes all the
 * same, and within two minutes the handshake is in person. The same flow
 * on both phones, in either order (one path, near and far).
 */
export const open_their_ticket = command({
  input: z.strictObject({
    bond_id: id.bond_id,
    their_ticket: value.their_ticket,
    name: value.bond_name,
  }),
  outcomes: {
    my_ticket_is_ready_so_we_are_bonded: [
      predicate.the_ticket_is_ready,
      fact.a_bond_has_been_made_by_opening_their_ticket,
      pick(effect, 'send_my_introduction'),
    ],
    their_introduction_came_within_two_minutes_so_we_met_in_person: [
      their_introduction_came_first_within_two_minutes,
      fact.their_ticket_has_been_opened_in_person,
      pick(effect, 'send_my_introduction'),
    ],
    their_introduction_came_earlier_so_mine_goes_now: [
      their_introduction_came_first_earlier,
      fact.their_ticket_has_been_opened_after_their_introduction,
      pick(effect, 'send_my_introduction'),
    ],
    my_introduction_was_sent_already_so_nothing_changes: [
      my_introduction_was_sent_already,
      fact.their_ticket_has_been_opened_again,
    ],
  },
  creator: (context) => (input) => {
    const their_face = {
      bond_id: input.bond_id,
      key: input.their_ticket.key,
    }
    const my_introduction = {
      send_my_introduction: {
        id: input.bond_id,
        payload: { bond_id: input.bond_id, their_ticket: input.their_ticket },
      },
    }
    const first = {
      the_bond_is_kept: { bond_id: input.bond_id },
      the_bond_is_with_their_face: their_face,
      my_introduction_is_not_sent: { bond_id: input.bond_id },
    }
    const within = { bond_id: input.bond_id, now: context.now }
    return {
      my_ticket_is_ready_so_we_are_bonded: [
        { bond_id: input.bond_id },
        {
          opened_bond: {
            id: input.bond_id,
            status: 'kept',
            name: input.name,
            their_face: {
              key: input.their_ticket.key,
              introduced_as: input.their_ticket.introduced_as,
            },
            their_mailbox: input.their_ticket.mailbox,
            handshake: { way: 'at_a_distance', at: context.now },
            confirmation: { state: 'awaited' },
            my_introduction: { state: 'sent', at: context.now },
          },
        },
        my_introduction,
      ],
      their_introduction_came_within_two_minutes_so_we_met_in_person: [
        { their_introduction_came_first: first, the_handshake_began_within_two_minutes: within },
        {
          met_bond: {
            id: input.bond_id,
            handshake: { way: 'in_person', at: context.now },
            my_introduction: { state: 'sent', at: context.now },
          },
        },
        my_introduction,
      ],
      their_introduction_came_earlier_so_mine_goes_now: [
        { their_introduction_came_first: first, the_handshake_began_earlier: within },
        {
          introduced_bond: {
            id: input.bond_id,
            my_introduction: { state: 'sent', at: context.now },
          },
        },
        my_introduction,
      ],
      my_introduction_was_sent_already_so_nothing_changes: [
        {
          the_bond_is_kept: { bond_id: input.bond_id },
          the_bond_is_with_their_face: their_face,
          my_introduction_is_sent: { bond_id: input.bond_id },
        },
        { bond_id: input.bond_id },
      ],
    }
  },
})

/** My ticket is ready, and the secret given is its. */
export const my_ticket_is_ready_with_its_secret = AND({
  the_ticket_is_ready: predicate.the_ticket_is_ready,
  the_secret_is_the_ticket_s: predicate.the_secret_is_the_ticket_s,
})

/** I opened their ticket first, with this face of theirs, and the secret given is my ticket's: they have me now. */
export const i_opened_their_ticket_first = AND({
  the_bond_is_kept: predicate.the_bond_is_kept,
  the_bond_is_with_their_face: predicate.the_bond_is_with_this_face,
  the_confirmation_is_awaited: NOT(predicate.the_confirmation_is_received),
  the_secret_is_the_ticket_s: predicate.the_secret_is_the_ticket_s,
})

/** I opened their ticket first, within two minutes: the tickets crossed in person. */
export const i_opened_their_ticket_first_within_two_minutes = AND({
  i_opened_their_ticket_first: i_opened_their_ticket_first,
  the_handshake_began_within_two_minutes: predicate.the_handshake_began_within_two_minutes_of,
})

/** I opened their ticket first, earlier than two minutes ago. */
export const i_opened_their_ticket_first_earlier = AND({
  i_opened_their_ticket_first: i_opened_their_ticket_first,
  the_handshake_began_earlier: NOT(predicate.the_handshake_began_within_two_minutes_of),
})

/** The bond is kept with this face of theirs, and they have me already. */
export const their_introduction_came_already = AND({
  the_bond_is_kept: predicate.the_bond_is_kept,
  the_bond_is_with_their_face: predicate.the_bond_is_with_this_face,
  the_confirmation_is_received: predicate.the_confirmation_is_received,
})

/**
 * Carla's phone takes an introduction to her ticket (BND-10, PER-11): the
 * entry of `unknown` (step 13) gives the bond of the ticket at whose mailbox
 * it was collected, the secret it carries, the face that signed it and the
 * mailbox its ticket declares. Her ticket ready and the secret its, the bond
 * is kept, named as Anna is introduced, at a distance, the confirmation
 * received. On a bond made by opening their ticket (the QR crossed), it
 * confirms it, in person within two minutes. A ticket used by another face,
 * expired, or a secret not its: refused, no fact, to the trace (F6).
 */
export const accept_their_introduction = command({
  input: z.strictObject({
    bond_id: id.bond_id,
    secret: value.ticket_secret,
    their_face: value.their_face,
    their_mailbox: value.their_mailbox,
  }),
  outcomes: {
    my_ticket_is_ready_with_its_secret_so_we_are_bonded: [
      my_ticket_is_ready_with_its_secret,
      fact.a_bond_has_been_made_by_their_introduction,
    ],
    i_opened_their_ticket_within_two_minutes_so_we_met_in_person: [
      i_opened_their_ticket_first_within_two_minutes,
      fact.their_introduction_has_come_in_person,
    ],
    i_opened_their_ticket_earlier_so_they_have_me_now: [
      i_opened_their_ticket_first_earlier,
      fact.their_introduction_has_come,
    ],
    their_introduction_came_already_so_nothing_changes: [
      their_introduction_came_already,
      fact.their_introduction_has_come_again,
    ],
  },
  creator: (context) => (input) => {
    const their_face = { bond_id: input.bond_id, key: input.their_face.key }
    const the_secret = { bond_id: input.bond_id, secret: input.secret }
    const first = {
      the_bond_is_kept: { bond_id: input.bond_id },
      the_bond_is_with_their_face: their_face,
      the_confirmation_is_awaited: { bond_id: input.bond_id },
      the_secret_is_the_ticket_s: the_secret,
    }
    const within = { bond_id: input.bond_id, now: context.now }
    return {
      my_ticket_is_ready_with_its_secret_so_we_are_bonded: [
        {
          the_ticket_is_ready: { bond_id: input.bond_id },
          the_secret_is_the_ticket_s: the_secret,
        },
        {
          introduced_bond: {
            id: input.bond_id,
            status: 'kept',
            name: input.their_face.introduced_as,
            their_face: input.their_face,
            their_mailbox: input.their_mailbox,
            handshake: { way: 'at_a_distance', at: context.now },
            confirmation: { state: 'received', at: context.now },
            my_introduction: { state: 'not_sent' },
          },
        },
      ],
      i_opened_their_ticket_within_two_minutes_so_we_met_in_person: [
        { i_opened_their_ticket_first: first, the_handshake_began_within_two_minutes: within },
        {
          met_bond: {
            id: input.bond_id,
            handshake: { way: 'in_person', at: context.now },
            confirmation: { state: 'received', at: context.now },
          },
        },
      ],
      i_opened_their_ticket_earlier_so_they_have_me_now: [
        { i_opened_their_ticket_first: first, the_handshake_began_earlier: within },
        {
          confirmed_bond: {
            id: input.bond_id,
            confirmation: { state: 'received', at: context.now },
          },
        },
      ],
      their_introduction_came_already_so_nothing_changes: [
        {
          the_bond_is_kept: { bond_id: input.bond_id },
          the_bond_is_with_their_face: their_face,
          the_confirmation_is_received: { bond_id: input.bond_id },
        },
        { bond_id: input.bond_id },
      ],
    }
  },
})
