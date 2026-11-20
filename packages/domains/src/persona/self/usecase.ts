import { z } from 'zod'
import { date_time } from '../../library/index.ts'
import {
  command_use_case_over,
  read_use_case_over,
  dsl,
  value,
  address_book,
  activations,
} from './_scope_usecase.ts'

// The use cases of `self`, the leaves of its tree (PER-3, PER-6): what the
// user does from the app on her own node, the address book's gestures and
// her choices about the extensions (EXT-7). Not here what only a reaction,
// a return or an effect's delivery invokes (PER-12): the keys the safe
// makes, a ticket's expiry, what came back of a question; nor the reads the
// post and auth take through their ports; nor the introduction, which is
// `unknown`'s (PER-11). The ids are drawn by the app (DOM-12); the outcome
// and the entries are projected in her words (D45). A leaf names its
// rejection, the reasons the trace's (F6).

/** Anna's phone, at its first start, makes her face "Anna" (BND-8): the safe makes its keys. */
export const make_my_first_face = command_use_case_over({
  use_case: address_book.usecase.make_my_first_face,
  input: z.strictObject({
    face_id: address_book.id.face_id,
    name: value.face_name,
  }),
  creator: () => (input) => ({ face_id: input.face_id, name: input.name }),
  events: {
    your_face_is_being_made: z.strictObject({ face_id: address_book.id.face_id }),
    /** In stage 1 one face: she has hers, made or being made. */
    you_have_a_face_already: z.strictObject({}),
  },
  projection: {
    the_user_has_no_face_so_her_first_is_asked_for: (fact) => ({
      event: 'your_face_is_being_made',
      payload: { face_id: fact.face_being_made.id },
    }),
    rejected: () => ({ event: 'you_have_a_face_already', payload: {} }),
  },
})

/** Anna asks for a ticket for her face, to show Bruno in a QR or to send Carla in a link (BND-8): it holds 48 hours. */
export const prepare_a_ticket = command_use_case_over({
  use_case: address_book.usecase.prepare_a_ticket,
  input: z.strictObject({
    bond_id: address_book.id.bond_id,
    face_id: address_book.id.face_id,
    relays: value.relays,
  }),
  creator: () => (input) => ({
    bond_id: input.bond_id,
    face_id: input.face_id,
    relays: input.relays,
  }),
  events: {
    your_ticket_is_being_prepared: z.strictObject({
      bond_id: address_book.id.bond_id,
      expires_at: date_time,
    }),
    /** The bond's id is taken already, or her face is not made yet: she need not know which. */
    the_ticket_cannot_be_prepared: z.strictObject({}),
  },
  projection: {
    the_face_is_made_so_a_ticket_is_asked_for: (fact) => ({
      event: 'your_ticket_is_being_prepared',
      payload: {
        bond_id: fact.ticket_being_prepared.id,
        expires_at: fact.ticket_being_prepared.expires_at,
      },
    }),
    rejected: () => ({ event: 'the_ticket_cannot_be_prepared', payload: {} }),
  },
})

/**
 * Anna opens Bruno's QR, or Carla's link, presenting a ticket of hers
 * (BND-10): the bond is kept and her introduction goes to them; if theirs
 * came first, within two minutes they met in person.
 */
export const open_their_ticket = command_use_case_over({
  use_case: address_book.usecase.open_their_ticket,
  input: z.strictObject({
    bond_id: address_book.id.bond_id,
    their_ticket: value.their_ticket,
    name: value.bond_name,
  }),
  creator: () => (input) => ({
    bond_id: input.bond_id,
    their_ticket: {
      key: input.their_ticket.key,
      introduced_as: input.their_ticket.introduced_as,
      mailbox: {
        deposit_address: input.their_ticket.mailbox.deposit_address,
        relays: input.their_ticket.mailbox.relays,
      },
      secret: input.their_ticket.secret,
    },
    name: input.name,
  }),
  events: {
    /** At a distance: her introduction is sent, their confirmation awaited. */
    you_are_bonded: z.strictObject({ bond_id: address_book.id.bond_id }),
    /** Their introduction came first, within two minutes: the QR crossed, in person. */
    you_met_in_person: z.strictObject({ bond_id: address_book.id.bond_id }),
    /** Their introduction came first, earlier: hers goes now, the bond stays at a distance. */
    your_introduction_is_sent: z.strictObject({ bond_id: address_book.id.bond_id }),
    you_opened_their_ticket_already: z.strictObject({ bond_id: address_book.id.bond_id }),
    /** Her ticket not ready (being prepared, expired, used by another face), or the bond removed: she need not know which. */
    their_ticket_cannot_be_opened: z.strictObject({}),
  },
  projection: {
    my_ticket_is_ready_so_we_are_bonded: (fact) => ({
      event: 'you_are_bonded',
      payload: { bond_id: fact.opened_bond.id },
    }),
    their_introduction_came_within_two_minutes_so_we_met_in_person: (fact) => ({
      event: 'you_met_in_person',
      payload: { bond_id: fact.met_bond.id },
    }),
    their_introduction_came_earlier_so_mine_goes_now: (fact) => ({
      event: 'your_introduction_is_sent',
      payload: { bond_id: fact.introduced_bond.id },
    }),
    my_introduction_was_sent_already_so_nothing_changes: (fact) => ({
      event: 'you_opened_their_ticket_already',
      payload: { bond_id: fact.bond_id },
    }),
    rejected: () => ({ event: 'their_ticket_cannot_be_opened', payload: {} }),
  },
})

/** Anna calls Bruno "Bru" on her phone (BND-6): nothing goes to him. */
export const rename_a_bond = command_use_case_over({
  use_case: address_book.usecase.rename_a_bond,
  input: z.strictObject({
    bond_id: address_book.id.bond_id,
    name: value.bond_name,
  }),
  creator: () => (input) => ({ bond_id: input.bond_id, name: input.name }),
  events: {
    the_bond_is_renamed: z.strictObject({
      bond_id: address_book.id.bond_id,
      name: value.bond_name,
    }),
    /** Not a bond in her list: never one, or removed. */
    there_is_no_such_bond: z.strictObject({}),
  },
  projection: {
    the_bond_is_kept_so_it_is_renamed: (fact) => ({
      event: 'the_bond_is_renamed',
      payload: { bond_id: fact.renamed_bond.id, name: fact.renamed_bond.name },
    }),
    rejected: () => ({ event: 'there_is_no_such_bond', payload: {} }),
  },
})

/** Anna removes Carla from her list (BND-6): her phone collects Carla's mailbox no more, and tells her nothing. */
export const remove_a_bond = command_use_case_over({
  use_case: address_book.usecase.remove_a_bond,
  input: z.strictObject({
    bond_id: address_book.id.bond_id,
  }),
  creator: () => (input) => ({ bond_id: input.bond_id }),
  events: {
    the_bond_is_removed: z.strictObject({ bond_id: address_book.id.bond_id }),
    the_bond_was_removed_already: z.strictObject({ bond_id: address_book.id.bond_id }),
    /** Never a bond of hers, or still a ticket. */
    there_is_no_such_bond: z.strictObject({}),
  },
  projection: {
    the_bond_is_kept_so_it_is_removed: (fact) => ({
      event: 'the_bond_is_removed',
      payload: { bond_id: fact.removed_bond.id },
    }),
    the_bond_is_removed_already_so_nothing_changes: (fact) => ({
      event: 'the_bond_was_removed_already',
      payload: { bond_id: fact.bond_id },
    }),
    rejected: () => ({ event: 'there_is_no_such_bond', payload: {} }),
  },
})

/** Anna activates greetings, accepting the manifest she is shown (EXT-7): the conscious act. */
export const activate_an_extension = command_use_case_over({
  use_case: activations.usecase.activate_an_extension,
  input: z.strictObject({
    manifest: value.manifest,
  }),
  creator: () => (input) => ({ manifest: input.manifest }),
  events: {
    the_extension_is_active: z.strictObject({ extension: activations.id.extension_name }),
    the_extension_was_active_already: z.strictObject({
      extension: activations.id.extension_name,
    }),
    /** The manifest she was shown is not the one installed: an update came, or the node has not the extension. */
    the_manifest_is_not_the_installed_one: z.strictObject({}),
  },
  projection: {
    the_manifest_shown_is_new_so_it_is_activated: (fact) => ({
      event: 'the_extension_is_active',
      payload: { extension: fact.activated_extension.name },
    }),
    the_manifest_shown_is_accepted_already_so_nothing_changes: (fact) => ({
      event: 'the_extension_was_active_already',
      payload: { extension: fact.name },
    }),
    rejected: () => ({ event: 'the_manifest_is_not_the_installed_one', payload: {} }),
  },
})

/** Anna deactivates greetings (EXT-7): it runs nothing and serves nothing, until she activates it again. */
export const deactivate_an_extension = command_use_case_over({
  use_case: activations.usecase.deactivate_an_extension,
  input: z.strictObject({
    extension: activations.id.extension_name,
  }),
  creator: () => (input) => ({ name: input.extension }),
  events: {
    the_extension_is_deactivated: z.strictObject({ extension: activations.id.extension_name }),
    the_extension_was_not_active: z.strictObject({ extension: activations.id.extension_name }),
    /** Never: the office's two branches cover every extension; a leaf still names its rejection. */
    the_extension_cannot_be_deactivated: z.strictObject({}),
  },
  projection: {
    the_extension_is_activated_so_it_is_deactivated: (fact) => ({
      event: 'the_extension_is_deactivated',
      payload: { extension: fact.deactivated_extension.name },
    }),
    the_extension_is_not_activated_so_nothing_changes: (fact) => ({
      event: 'the_extension_was_not_active',
      payload: { extension: fact.name },
    }),
    rejected: () => ({ event: 'the_extension_cannot_be_deactivated', payload: {} }),
  },
})

/** Anna withdraws the offer of greetings from her bond with Carla (EXT-7): to Bruno it is still offered. */
export const withdraw_the_offer_from_a_bond = command_use_case_over({
  use_case: activations.usecase.withdraw_the_offer_from_a_bond,
  input: z.strictObject({
    extension: activations.id.extension_name,
    bond_id: address_book.id.bond_id,
  }),
  creator: () => (input) => ({ name: input.extension, bond: input.bond_id }),
  events: {
    the_offer_is_withdrawn: z.strictObject({
      extension: activations.id.extension_name,
      bond_id: address_book.id.bond_id,
    }),
    the_offer_was_withdrawn_already: z.strictObject({
      extension: activations.id.extension_name,
      bond_id: address_book.id.bond_id,
    }),
    /** Not a bond of hers, or an extension the node has not: she need not know which. */
    the_offer_cannot_be_withdrawn: z.strictObject({}),
  },
  projection: {
    the_extension_is_offered_to_the_bond_so_the_offer_is_withdrawn: (fact) => ({
      event: 'the_offer_is_withdrawn',
      payload: { extension: fact.withdrawn_offer.name, bond_id: fact.withdrawn_offer.bond },
    }),
    the_offer_is_withdrawn_already_so_nothing_changes: (fact) => ({
      event: 'the_offer_was_withdrawn_already',
      payload: { extension: fact.name, bond_id: fact.bond },
    }),
    rejected: () => ({ event: 'the_offer_cannot_be_withdrawn', payload: {} }),
  },
})

/** Anna offers greetings to Carla again (EXT-7): the offer she withdrew comes back. */
export const offer_an_extension_to_a_bond = command_use_case_over({
  use_case: activations.usecase.offer_an_extension_to_a_bond,
  input: z.strictObject({
    extension: activations.id.extension_name,
    bond_id: address_book.id.bond_id,
  }),
  creator: () => (input) => ({ name: input.extension, bond: input.bond_id }),
  events: {
    the_extension_is_offered_again: z.strictObject({
      extension: activations.id.extension_name,
      bond_id: address_book.id.bond_id,
    }),
    the_extension_was_offered_already: z.strictObject({
      extension: activations.id.extension_name,
      bond_id: address_book.id.bond_id,
    }),
    /** Not a bond of hers, or an extension the node has not: she need not know which. */
    the_extension_cannot_be_offered: z.strictObject({}),
  },
  projection: {
    the_offer_is_withdrawn_from_the_bond_so_it_is_offered_again: (fact) => ({
      event: 'the_extension_is_offered_again',
      payload: { extension: fact.name, bond_id: fact.bond },
    }),
    the_extension_is_offered_to_the_bond_already_so_nothing_changes: (fact) => ({
      event: 'the_extension_was_offered_already',
      payload: { extension: fact.name, bond_id: fact.bond },
    }),
    rejected: () => ({ event: 'the_extension_cannot_be_offered', payload: {} }),
  },
})

/**
 * Anna's phone asks Bruno's which extensions they have in common (EXT-8),
 * telling what it offers him, greetings at major 1: the question waits 60
 * seconds for what comes back.
 */
export const ask_a_bond_for_the_extensions_in_common = command_use_case_over({
  use_case: activations.usecase.ask_a_bond_for_the_extensions_in_common,
  input: z.strictObject({
    bond_id: address_book.id.bond_id,
    offered: value.offered_extensions,
  }),
  creator: () => (input) => ({
    bond: input.bond_id,
    offered: input.offered.map((offered) => ({
      name: offered.extension,
      majors: offered.majors,
    })),
  }),
  events: {
    the_bond_is_asked: z.strictObject({ question_id: activations.id.question_id }),
    /** Not a bond of hers, or telling an extension her node does not offer it: she need not know which. */
    the_bond_cannot_be_asked: z.strictObject({}),
  },
  projection: {
    the_question_can_be_asked_so_it_is_asked: (fact) => ({
      event: 'the_bond_is_asked',
      payload: { question_id: fact.question.id },
    }),
    rejected: () => ({ event: 'the_bond_cannot_be_asked', payload: {} }),
  },
})

/** Anna opens her faces: "Anna", at the top, with its key. A face being made is not one yet. */
export const my_faces = read_use_case_over({
  use_case: address_book.usecase.my_faces,
  input: z.strictObject({}),
  creator: () => () => ({ query: {} }),
  entry: z.strictObject({
    face_id: address_book.id.face_id,
    name: value.face_name,
    position: value.face_position,
    key: value.face_key,
  }),
  projection: (entry) => ({
    face_id: entry.id,
    name: entry.name,
    position: dsl.the_position(entry.position),
    key: entry.public_key,
  }),
})

/** Anna opens her list: Bruno, Carla, by the names she gives them, and whether they have her yet. */
export const my_bonds = read_use_case_over({
  use_case: address_book.usecase.my_bonds,
  input: z.strictObject({}),
  creator: () => () => ({ query: {} }),
  entry: z.strictObject({
    bond_id: address_book.id.bond_id,
    name: value.bond_name,
    my_face_id: address_book.id.face_id,
    their_face: value.their_face,
    confirmation: value.confirmation,
  }),
  projection: (entry) => ({
    bond_id: entry.id,
    name: entry.name,
    my_face_id: entry.my_face_id,
    their_face: dsl.their_face(entry.their_face),
    confirmation: dsl.the_confirmation(entry.confirmation),
  }),
})

/** Anna opens Bruno's card: his face and mailbox, hers for him, how they met, whether he has her. */
export const a_bond = read_use_case_over({
  use_case: address_book.usecase.a_bond,
  input: z.strictObject({
    bond_id: address_book.id.bond_id,
  }),
  creator: () => (input) => ({ query: { bond_id: input.bond_id } }),
  entry: z.strictObject({
    bond_id: address_book.id.bond_id,
    name: value.bond_name,
    my_face_id: address_book.id.face_id,
    their_face: value.their_face,
    their_mailbox: value.mailbox,
    my_mailbox: value.mailbox,
    handshake: value.handshake,
    confirmation: value.confirmation,
  }),
  projection: (entry) => ({
    bond_id: entry.id,
    name: entry.name,
    my_face_id: entry.my_face_id,
    their_face: dsl.their_face(entry.their_face),
    their_mailbox: dsl.the_mailbox(entry.their_mailbox),
    my_mailbox: dsl.the_mailbox(entry.my_mailbox),
    handshake: dsl.the_handshake(entry.handshake),
    confirmation: dsl.the_confirmation(entry.confirmation),
  }),
})

/** Anna shows Bruno her ticket: her face's key and name, her mailbox for the bond to be, until when it holds. */
export const my_ticket = read_use_case_over({
  use_case: address_book.usecase.my_ticket,
  input: z.strictObject({
    bond_id: address_book.id.bond_id,
  }),
  creator: () => (input) => ({ query: { bond_id: input.bond_id } }),
  entry: z.strictObject({
    bond_id: address_book.id.bond_id,
    my_face_id: address_book.id.face_id,
    key: value.face_key,
    introduced_as: value.face_name,
    my_mailbox: value.mailbox,
    expires_at: date_time,
  }),
  projection: (entry) => ({
    bond_id: entry.id,
    my_face_id: entry.my_face_id,
    key: entry.key,
    introduced_as: entry.introduced_as,
    my_mailbox: dsl.the_mailbox(entry.my_mailbox),
    expires_at: entry.expires_at,
  }),
})

/** Anna opens greetings: its manifest as installed, and whether it is active, or waits for her to accept an update. */
export const an_extension = read_use_case_over({
  use_case: activations.usecase.an_extension,
  input: z.strictObject({
    extension: activations.id.extension_name,
  }),
  creator: () => (input) => ({ query: { name: input.extension } }),
  entry: z.strictObject({
    extension: activations.id.extension_name,
    manifest: value.manifest,
    state: value.extension_state,
  }),
  projection: (entry) => ({
    extension: entry.name,
    manifest: dsl.the_manifest(entry.manifest),
    state: dsl.the_state(entry.state),
  }),
})

/** Anna's phone reads what it offers Bruno, before it asks him: greetings, at major 1. */
export const the_extensions_offered_to_a_bond = read_use_case_over({
  use_case: activations.usecase.the_extensions_offered_to_a_bond,
  input: z.strictObject({
    bond_id: address_book.id.bond_id,
  }),
  creator: () => (input) => ({ query: { bond: input.bond_id } }),
  entry: z.strictObject({
    extension: activations.id.extension_name,
    majors: value.majors,
  }),
  projection: (entry) => ({ extension: entry.name, majors: entry.majors }),
})
