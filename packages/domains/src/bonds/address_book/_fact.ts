// generated

// The facts of `bonds/address_book` from `fact.ts` (DOM-25): the same objects
// under the same names, branded with their path (DOM-24), each schema with its
// output type under the same name, so that one import gives both. Only this
// module imports `fact.ts`.

import { z } from 'zod'
import * as fact from './fact.ts'

/**
 * The user gave a bond a new name (BND-6): Anna calls Bruno "Bru". A partial
 * value, the bond's id and its name; the name Bruno is introduced as stays.
 *
 * @see {@link fact.a_bond_has_been_renamed}
 */
export const a_bond_has_been_renamed =
  fact.a_bond_has_been_renamed.brand<'bonds/address_book/fact/a_bond_has_been_renamed'>()
export type a_bond_has_been_renamed = z.output<typeof a_bond_has_been_renamed>

/**
 * The user removed a bond from her list (BND-6): a partial value, its id, its
 * new status and when. The rest of the bond stays, out of the list.
 *
 * @see {@link fact.a_bond_has_been_removed}
 */
export const a_bond_has_been_removed =
  fact.a_bond_has_been_removed.brand<'bonds/address_book/fact/a_bond_has_been_removed'>()
export type a_bond_has_been_removed = z.output<typeof a_bond_has_been_removed>

/**
 * Nothing to do (DOM-6): the bond was removed already, its first removal stands.
 *
 * @see {@link fact.a_bond_has_been_removed_again}
 */
export const a_bond_has_been_removed_again =
  fact.a_bond_has_been_removed_again.brand<'bonds/address_book/fact/a_bond_has_been_removed_again'>()
export type a_bond_has_been_removed_again = z.output<typeof a_bond_has_been_removed_again>

/**
 * Anna's phone, at its first start, asked for her first face, "Anna", at the top (BND-8): the safe is making it.
 *
 * @see {@link fact.a_first_face_has_been_asked_for}
 */
export const a_first_face_has_been_asked_for =
  fact.a_first_face_has_been_asked_for.brand<'bonds/address_book/fact/a_first_face_has_been_asked_for'>()
export type a_first_face_has_been_asked_for = z.output<typeof a_first_face_has_been_asked_for>

/**
 * The safe made the face (BND-8): its public key, copied from the safe's fact, and its new status.
 *
 * @see {@link fact.a_face_has_been_made}
 */
export const a_face_has_been_made =
  fact.a_face_has_been_made.brand<'bonds/address_book/fact/a_face_has_been_made'>()
export type a_face_has_been_made = z.output<typeof a_face_has_been_made>

/**
 * Anna asked for a ticket for her face (BND-8), which holds for 48 hours: the safe is drawing its mailbox's key.
 *
 * @see {@link fact.a_ticket_has_been_asked_for}
 */
export const a_ticket_has_been_asked_for =
  fact.a_ticket_has_been_asked_for.brand<'bonds/address_book/fact/a_ticket_has_been_asked_for'>()
export type a_ticket_has_been_asked_for = z.output<typeof a_ticket_has_been_asked_for>

/**
 * The safe drew the key of the ticket's mailbox (BND-8): the ticket has its D, and is ready.
 *
 * @see {@link fact.a_ticket_has_been_prepared}
 */
export const a_ticket_has_been_prepared =
  fact.a_ticket_has_been_prepared.brand<'bonds/address_book/fact/a_ticket_has_been_prepared'>()
export type a_ticket_has_been_prepared = z.output<typeof a_ticket_has_been_prepared>

/**
 * The key of a ticket's mailbox came after the ticket expired (BND-8): nothing changes, the ticket stays expired.
 *
 * @see {@link fact.a_mailbox_has_come_for_an_expired_ticket}
 */
export const a_mailbox_has_come_for_an_expired_ticket =
  fact.a_mailbox_has_come_for_an_expired_ticket.brand<'bonds/address_book/fact/a_mailbox_has_come_for_an_expired_ticket'>()
export type a_mailbox_has_come_for_an_expired_ticket = z.output<
  typeof a_mailbox_has_come_for_an_expired_ticket
>

/**
 * No one used the ticket in its 48 hours (BND-8): it expired, and no bond comes of it.
 *
 * @see {@link fact.a_ticket_has_expired}
 */
export const a_ticket_has_expired =
  fact.a_ticket_has_expired.brand<'bonds/address_book/fact/a_ticket_has_expired'>()
export type a_ticket_has_expired = z.output<typeof a_ticket_has_expired>

/**
 * Nothing to do (DOM-6): the ticket made its bond before it could expire.
 *
 * @see {@link fact.the_ticket_was_used_before_it_expired}
 */
export const the_ticket_was_used_before_it_expired =
  fact.the_ticket_was_used_before_it_expired.brand<'bonds/address_book/fact/the_ticket_was_used_before_it_expired'>()
export type the_ticket_was_used_before_it_expired = z.output<
  typeof the_ticket_was_used_before_it_expired
>

/**
 * Anna opened Carla's ticket, presenting her own (BND-10): the bond is
 * kept, Carla's face and mailbox as her ticket declared them, at a distance
 * for now, the confirmation awaited, Anna's introduction sent.
 *
 * @see {@link fact.a_bond_has_been_made_by_opening_their_ticket}
 */
export const a_bond_has_been_made_by_opening_their_ticket =
  fact.a_bond_has_been_made_by_opening_their_ticket.brand<'bonds/address_book/fact/a_bond_has_been_made_by_opening_their_ticket'>()
export type a_bond_has_been_made_by_opening_their_ticket = z.output<
  typeof a_bond_has_been_made_by_opening_their_ticket
>

/**
 * Bruno's introduction to Anna's ticket came first, and she opened his
 * ticket within the window of a crossing of the time it declares (BND-10):
 * the tickets crossed, in person, and her introduction is sent.
 *
 * @see {@link fact.their_ticket_has_been_opened_in_person}
 */
export const their_ticket_has_been_opened_in_person =
  fact.their_ticket_has_been_opened_in_person.brand<'bonds/address_book/fact/their_ticket_has_been_opened_in_person'>()
export type their_ticket_has_been_opened_in_person = z.output<
  typeof their_ticket_has_been_opened_in_person
>

/**
 * Their introduction came first, and the user opened their ticket outside
 * the window of a crossing of the time it declares (BND-10): her
 * introduction is sent, the handshake stays at a distance.
 *
 * @see {@link fact.their_ticket_has_been_opened_after_their_introduction}
 */
export const their_ticket_has_been_opened_after_their_introduction =
  fact.their_ticket_has_been_opened_after_their_introduction.brand<'bonds/address_book/fact/their_ticket_has_been_opened_after_their_introduction'>()
export type their_ticket_has_been_opened_after_their_introduction = z.output<
  typeof their_ticket_has_been_opened_after_their_introduction
>

/**
 * Nothing to do (DOM-6): the user opened their ticket again, her introduction was sent already.
 *
 * @see {@link fact.their_ticket_has_been_opened_again}
 */
export const their_ticket_has_been_opened_again =
  fact.their_ticket_has_been_opened_again.brand<'bonds/address_book/fact/their_ticket_has_been_opened_again'>()
export type their_ticket_has_been_opened_again = z.output<typeof their_ticket_has_been_opened_again>

/**
 * Carla's phone took Anna's introduction to its ready ticket (BND-10, PER-11):
 * the bond is kept, Anna's face and mailbox as her introduction declared
 * them, named as she is introduced, at a distance, the confirmation
 * received (her introduction is a letter of hers), Carla's introduction
 * not sent.
 *
 * @see {@link fact.a_bond_has_been_made_by_their_introduction}
 */
export const a_bond_has_been_made_by_their_introduction =
  fact.a_bond_has_been_made_by_their_introduction.brand<'bonds/address_book/fact/a_bond_has_been_made_by_their_introduction'>()
export type a_bond_has_been_made_by_their_introduction = z.output<
  typeof a_bond_has_been_made_by_their_introduction
>

/**
 * Anna opened Bruno's ticket, and his introduction to hers came, declaring
 * a time within the window of a crossing of her opening (BND-10): the
 * tickets crossed, in person, and he has her.
 *
 * @see {@link fact.their_introduction_has_come_in_person}
 */
export const their_introduction_has_come_in_person =
  fact.their_introduction_has_come_in_person.brand<'bonds/address_book/fact/their_introduction_has_come_in_person'>()
export type their_introduction_has_come_in_person = z.output<
  typeof their_introduction_has_come_in_person
>

/**
 * Their introduction to my ticket came after I opened theirs, declaring a
 * time outside the window of a crossing of my opening (BND-10): they have me.
 *
 * @see {@link fact.their_introduction_has_come}
 */
export const their_introduction_has_come =
  fact.their_introduction_has_come.brand<'bonds/address_book/fact/their_introduction_has_come'>()
export type their_introduction_has_come = z.output<typeof their_introduction_has_come>

/**
 * Nothing to do (DOM-6): their introduction came again, the confirmation was received already.
 *
 * @see {@link fact.their_introduction_has_come_again}
 */
export const their_introduction_has_come_again =
  fact.their_introduction_has_come_again.brand<'bonds/address_book/fact/their_introduction_has_come_again'>()
export type their_introduction_has_come_again = z.output<typeof their_introduction_has_come_again>
