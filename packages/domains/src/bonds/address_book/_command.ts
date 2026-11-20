// generated

// The commands of `bonds/address_book` from `command.ts` (DOM-25): the same
// objects under the same names, each schema with its output type under the same
// name, so that one import gives both. Only this module imports `command.ts`.

import { z } from 'zod'
import * as command from './command.ts'

/**
 * Anna calls Bruno "Bru" on her phone (BND-6): the name she gives the bond,
 * hers only. The name Bruno is introduced as stays beside it, and nothing
 * goes to him. A bond she removed has no name to change: refused.
 *
 * @see {@link command.rename_a_bond}
 */
export const rename_a_bond = command.rename_a_bond

/**
 * The input of `rename_a_bond`, declared inline.
 *
 * @see {@link command.rename_a_bond}
 */
export const rename_a_bond_input = command.rename_a_bond.input
export type rename_a_bond_input = z.output<typeof rename_a_bond_input>

/**
 * Anna removes Bruno from her list (BND-6), the screens' "Elimina e basta":
 * her phone collects his mailbox no more, and tells him nothing. A bond
 * removed already records that nothing changes (DOM-6).
 *
 * @see {@link command.remove_a_bond}
 */
export const remove_a_bond = command.remove_a_bond

/**
 * The input of `remove_a_bond`, declared inline.
 *
 * @see {@link command.remove_a_bond}
 */
export const remove_a_bond_input = command.remove_a_bond.input
export type remove_a_bond_input = z.output<typeof remove_a_bond_input>

/**
 * Anna's phone, at its first start, makes her face "Anna" (BND-8), at the
 * top of her tree: a process of the address book, whose step toward the
 * safe is a reaction (`reaction/first_face`, GR-9, PER-21). In stage 1 one
 * face: a second first face is refused.
 *
 * @see {@link command.make_my_first_face}
 */
export const make_my_first_face = command.make_my_first_face

/**
 * The input of `make_my_first_face`, declared inline.
 *
 * @see {@link command.make_my_first_face}
 */
export const make_my_first_face_input = command.make_my_first_face.input
export type make_my_first_face_input = z.output<typeof make_my_first_face_input>

/**
 * The safe made Anna's face (BND-8): the address book keeps its public key,
 * from the safe's fact, by a reaction (`reaction/first_face`). The face can
 * be shown, and bonded.
 *
 * @see {@link command.keep_the_key_of_a_face}
 */
export const keep_the_key_of_a_face = command.keep_the_key_of_a_face

/**
 * The input of `keep_the_key_of_a_face`, declared inline.
 *
 * @see {@link command.keep_the_key_of_a_face}
 */
export const keep_the_key_of_a_face_input = command.keep_the_key_of_a_face.input
export type keep_the_key_of_a_face_input = z.output<typeof keep_the_key_of_a_face_input>

/**
 * The bond is new, and the face it is for is made.
 *
 * @see {@link command.a_ticket_can_be_prepared}
 */
export const a_ticket_can_be_prepared = command.a_ticket_can_be_prepared
export type a_ticket_can_be_prepared = z.output<typeof a_ticket_can_be_prepared>

/**
 * Anna asks for a ticket for her face (BND-8), to show Bruno in a QR or to
 * send Carla in a link, or to present to a ticket she opens: the ticket of
 * a bond to be, under the bond's id. It holds 48 hours, which a wait
 * awaits (DOM-13); the safe draws its mailbox's key by a reaction
 * (`reaction/ticket`). The relays are the ones she declares, one in stage 1.
 *
 * @see {@link command.prepare_a_ticket}
 */
export const prepare_a_ticket = command.prepare_a_ticket

/**
 * The input of `prepare_a_ticket`, declared inline.
 *
 * @see {@link command.prepare_a_ticket}
 */
export const prepare_a_ticket_input = command.prepare_a_ticket.input
export type prepare_a_ticket_input = z.output<typeof prepare_a_ticket_input>

/**
 * The safe drew the key of the ticket's mailbox (BND-8): the address book
 * keeps its D, by a reaction (`reaction/ticket`), and the ticket is ready to
 * be shown. Come after the ticket expired, it changes nothing (DOM-23: a
 * step's outcome is a fact).
 *
 * @see {@link command.keep_the_mailbox_of_a_ticket}
 */
export const keep_the_mailbox_of_a_ticket = command.keep_the_mailbox_of_a_ticket

/**
 * The input of `keep_the_mailbox_of_a_ticket`, declared inline.
 *
 * @see {@link command.keep_the_mailbox_of_a_ticket}
 */
export const keep_the_mailbox_of_a_ticket_input = command.keep_the_mailbox_of_a_ticket.input
export type keep_the_mailbox_of_a_ticket_input = z.output<typeof keep_the_mailbox_of_a_ticket_input>

/**
 * The ticket is still unused: ready, or still being prepared.
 *
 * @see {@link command.the_ticket_is_unused}
 */
export const the_ticket_is_unused = command.the_ticket_is_unused
export type the_ticket_is_unused = z.output<typeof the_ticket_is_unused>

/**
 * The ticket made its bond: kept, or removed since.
 *
 * @see {@link command.the_ticket_made_its_bond}
 */
export const the_ticket_made_its_bond = command.the_ticket_made_its_bond
export type the_ticket_made_its_bond = z.output<typeof the_ticket_made_its_bond>

/**
 * 48 hours after it was asked for, the effect executor comes back (BND-8):
 * the ticket expires if no one used it, and its mailbox is collected no
 * more; a ticket that made its bond stays as it is. Its input is the
 * payload of the wait; its operation is the entry's (DOM-14).
 *
 * @see {@link command.let_a_ticket_expire}
 */
export const let_a_ticket_expire = command.let_a_ticket_expire

/**
 * The input of `let_a_ticket_expire`, declared inline.
 *
 * @see {@link command.let_a_ticket_expire}
 */
export const let_a_ticket_expire_input = command.let_a_ticket_expire.input
export type let_a_ticket_expire_input = z.output<typeof let_a_ticket_expire_input>

/**
 * The bond is kept with this face of theirs, and my introduction is not sent yet: theirs came first.
 *
 * @see {@link command.their_introduction_came_first}
 */
export const their_introduction_came_first = command.their_introduction_came_first
export type their_introduction_came_first = z.output<typeof their_introduction_came_first>

/**
 * Their introduction came first, within two minutes: the tickets crossed in person.
 *
 * @see {@link command.their_introduction_came_first_within_two_minutes}
 */
export const their_introduction_came_first_within_two_minutes =
  command.their_introduction_came_first_within_two_minutes
export type their_introduction_came_first_within_two_minutes = z.output<
  typeof their_introduction_came_first_within_two_minutes
>

/**
 * Their introduction came first, earlier than two minutes ago.
 *
 * @see {@link command.their_introduction_came_first_earlier}
 */
export const their_introduction_came_first_earlier = command.their_introduction_came_first_earlier
export type their_introduction_came_first_earlier = z.output<
  typeof their_introduction_came_first_earlier
>

/**
 * The bond is kept with this face of theirs, and my introduction is sent already.
 *
 * @see {@link command.my_introduction_was_sent_already}
 */
export const my_introduction_was_sent_already = command.my_introduction_was_sent_already
export type my_introduction_was_sent_already = z.output<typeof my_introduction_was_sent_already>

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
 *
 * @see {@link command.open_their_ticket}
 */
export const open_their_ticket = command.open_their_ticket

/**
 * The input of `open_their_ticket`, declared inline.
 *
 * @see {@link command.open_their_ticket}
 */
export const open_their_ticket_input = command.open_their_ticket.input
export type open_their_ticket_input = z.output<typeof open_their_ticket_input>

/**
 * My ticket is ready, and the secret given is its.
 *
 * @see {@link command.my_ticket_is_ready_with_its_secret}
 */
export const my_ticket_is_ready_with_its_secret = command.my_ticket_is_ready_with_its_secret
export type my_ticket_is_ready_with_its_secret = z.output<typeof my_ticket_is_ready_with_its_secret>

/**
 * I opened their ticket first, with this face of theirs, and the secret given is my ticket's: they have me now.
 *
 * @see {@link command.i_opened_their_ticket_first}
 */
export const i_opened_their_ticket_first = command.i_opened_their_ticket_first
export type i_opened_their_ticket_first = z.output<typeof i_opened_their_ticket_first>

/**
 * I opened their ticket first, within two minutes: the tickets crossed in person.
 *
 * @see {@link command.i_opened_their_ticket_first_within_two_minutes}
 */
export const i_opened_their_ticket_first_within_two_minutes =
  command.i_opened_their_ticket_first_within_two_minutes
export type i_opened_their_ticket_first_within_two_minutes = z.output<
  typeof i_opened_their_ticket_first_within_two_minutes
>

/**
 * I opened their ticket first, earlier than two minutes ago.
 *
 * @see {@link command.i_opened_their_ticket_first_earlier}
 */
export const i_opened_their_ticket_first_earlier = command.i_opened_their_ticket_first_earlier
export type i_opened_their_ticket_first_earlier = z.output<
  typeof i_opened_their_ticket_first_earlier
>

/**
 * The bond is kept with this face of theirs, and they have me already.
 *
 * @see {@link command.their_introduction_came_already}
 */
export const their_introduction_came_already = command.their_introduction_came_already
export type their_introduction_came_already = z.output<typeof their_introduction_came_already>

/**
 * Carla's phone takes an introduction to her ticket (BND-10, PER-11): the
 * entry of `unknown` (step 13) gives the bond of the ticket at whose mailbox
 * it was collected, the secret it carries, the face that signed it and the
 * mailbox its ticket declares. Her ticket ready and the secret its, the bond
 * is kept, named as Anna is introduced, at a distance, the confirmation
 * received. On a bond made by opening their ticket (the QR crossed), it
 * confirms it, in person within two minutes. A ticket used by another face,
 * expired, or a secret not its: refused, no fact, to the trace (F6).
 *
 * @see {@link command.accept_their_introduction}
 */
export const accept_their_introduction = command.accept_their_introduction

/**
 * The input of `accept_their_introduction`, declared inline.
 *
 * @see {@link command.accept_their_introduction}
 */
export const accept_their_introduction_input = command.accept_their_introduction.input
export type accept_their_introduction_input = z.output<typeof accept_their_introduction_input>
