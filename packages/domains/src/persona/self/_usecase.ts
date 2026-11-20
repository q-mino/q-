// generated

// The use cases of `persona/self` from `usecase.ts` (DOM-25): the same objects
// under the same names, each schema with its output type under the same name,
// so that one import gives both. Only this module imports `usecase.ts`.

import { z } from 'zod'
import * as usecase from './usecase.ts'

/**
 * Anna's phone, at its first start, makes her face "Anna" (BND-8): the safe makes its keys.
 *
 * @see {@link usecase.make_my_first_face}
 */
export const make_my_first_face = usecase.make_my_first_face

/**
 * The input of `make_my_first_face`, declared inline.
 *
 * @see {@link usecase.make_my_first_face}
 */
export const make_my_first_face_input = usecase.make_my_first_face.input
export type make_my_first_face_input = z.output<typeof make_my_first_face_input>

/**
 * Anna asks for a ticket for her face, to show Bruno in a QR or to send Carla in a link (BND-8): it holds 48 hours.
 *
 * @see {@link usecase.prepare_a_ticket}
 */
export const prepare_a_ticket = usecase.prepare_a_ticket

/**
 * The input of `prepare_a_ticket`, declared inline.
 *
 * @see {@link usecase.prepare_a_ticket}
 */
export const prepare_a_ticket_input = usecase.prepare_a_ticket.input
export type prepare_a_ticket_input = z.output<typeof prepare_a_ticket_input>

/**
 * Anna opens Bruno's QR, or Carla's link, presenting a ticket of hers
 * (BND-10): the bond is kept and her introduction goes to them; if theirs
 * came first, within two minutes they met in person.
 *
 * @see {@link usecase.open_their_ticket}
 */
export const open_their_ticket = usecase.open_their_ticket

/**
 * The input of `open_their_ticket`, declared inline.
 *
 * @see {@link usecase.open_their_ticket}
 */
export const open_their_ticket_input = usecase.open_their_ticket.input
export type open_their_ticket_input = z.output<typeof open_their_ticket_input>

/**
 * Anna calls Bruno "Bru" on her phone (BND-6): nothing goes to him.
 *
 * @see {@link usecase.rename_a_bond}
 */
export const rename_a_bond = usecase.rename_a_bond

/**
 * The input of `rename_a_bond`, declared inline.
 *
 * @see {@link usecase.rename_a_bond}
 */
export const rename_a_bond_input = usecase.rename_a_bond.input
export type rename_a_bond_input = z.output<typeof rename_a_bond_input>

/**
 * Anna removes Carla from her list (BND-6): her phone collects Carla's mailbox no more, and tells her nothing.
 *
 * @see {@link usecase.remove_a_bond}
 */
export const remove_a_bond = usecase.remove_a_bond

/**
 * The input of `remove_a_bond`, declared inline.
 *
 * @see {@link usecase.remove_a_bond}
 */
export const remove_a_bond_input = usecase.remove_a_bond.input
export type remove_a_bond_input = z.output<typeof remove_a_bond_input>

/**
 * Anna activates greetings, accepting the manifest she is shown (EXT-7): the conscious act.
 *
 * @see {@link usecase.activate_an_extension}
 */
export const activate_an_extension = usecase.activate_an_extension

/**
 * The input of `activate_an_extension`, declared inline.
 *
 * @see {@link usecase.activate_an_extension}
 */
export const activate_an_extension_input = usecase.activate_an_extension.input
export type activate_an_extension_input = z.output<typeof activate_an_extension_input>

/**
 * Anna deactivates greetings (EXT-7): it runs nothing and serves nothing, until she activates it again.
 *
 * @see {@link usecase.deactivate_an_extension}
 */
export const deactivate_an_extension = usecase.deactivate_an_extension

/**
 * The input of `deactivate_an_extension`, declared inline.
 *
 * @see {@link usecase.deactivate_an_extension}
 */
export const deactivate_an_extension_input = usecase.deactivate_an_extension.input
export type deactivate_an_extension_input = z.output<typeof deactivate_an_extension_input>

/**
 * Anna withdraws the offer of greetings from her bond with Carla (EXT-7): to Bruno it is still offered.
 *
 * @see {@link usecase.withdraw_the_offer_from_a_bond}
 */
export const withdraw_the_offer_from_a_bond = usecase.withdraw_the_offer_from_a_bond

/**
 * The input of `withdraw_the_offer_from_a_bond`, declared inline.
 *
 * @see {@link usecase.withdraw_the_offer_from_a_bond}
 */
export const withdraw_the_offer_from_a_bond_input = usecase.withdraw_the_offer_from_a_bond.input
export type withdraw_the_offer_from_a_bond_input = z.output<
  typeof withdraw_the_offer_from_a_bond_input
>

/**
 * Anna offers greetings to Carla again (EXT-7): the offer she withdrew comes back.
 *
 * @see {@link usecase.offer_an_extension_to_a_bond}
 */
export const offer_an_extension_to_a_bond = usecase.offer_an_extension_to_a_bond

/**
 * The input of `offer_an_extension_to_a_bond`, declared inline.
 *
 * @see {@link usecase.offer_an_extension_to_a_bond}
 */
export const offer_an_extension_to_a_bond_input = usecase.offer_an_extension_to_a_bond.input
export type offer_an_extension_to_a_bond_input = z.output<typeof offer_an_extension_to_a_bond_input>

/**
 * Anna's phone asks Bruno's which extensions they have in common (EXT-8),
 * telling what it offers him, greetings at major 1: the question waits 60
 * seconds for what comes back.
 *
 * @see {@link usecase.ask_a_bond_for_the_extensions_in_common}
 */
export const ask_a_bond_for_the_extensions_in_common =
  usecase.ask_a_bond_for_the_extensions_in_common

/**
 * The input of `ask_a_bond_for_the_extensions_in_common`, declared inline.
 *
 * @see {@link usecase.ask_a_bond_for_the_extensions_in_common}
 */
export const ask_a_bond_for_the_extensions_in_common_input =
  usecase.ask_a_bond_for_the_extensions_in_common.input
export type ask_a_bond_for_the_extensions_in_common_input = z.output<
  typeof ask_a_bond_for_the_extensions_in_common_input
>

/**
 * Anna opens her faces: "Anna", at the top, with its key. A face being made is not one yet.
 *
 * @see {@link usecase.my_faces}
 */
export const my_faces = usecase.my_faces

/**
 * The input of `my_faces`, declared inline.
 *
 * @see {@link usecase.my_faces}
 */
export const my_faces_input = usecase.my_faces.input
export type my_faces_input = z.output<typeof my_faces_input>

/**
 * Anna opens her list: Bruno, Carla, by the names she gives them, and whether they have her yet.
 *
 * @see {@link usecase.my_bonds}
 */
export const my_bonds = usecase.my_bonds

/**
 * The input of `my_bonds`, declared inline.
 *
 * @see {@link usecase.my_bonds}
 */
export const my_bonds_input = usecase.my_bonds.input
export type my_bonds_input = z.output<typeof my_bonds_input>

/**
 * Anna opens Bruno's card: his face and mailbox, hers for him, how they met, whether he has her.
 *
 * @see {@link usecase.a_bond}
 */
export const a_bond = usecase.a_bond

/**
 * The input of `a_bond`, declared inline.
 *
 * @see {@link usecase.a_bond}
 */
export const a_bond_input = usecase.a_bond.input
export type a_bond_input = z.output<typeof a_bond_input>

/**
 * Anna shows Bruno her ticket: her face's key and name, her mailbox for the bond to be, until when it holds.
 *
 * @see {@link usecase.my_ticket}
 */
export const my_ticket = usecase.my_ticket

/**
 * The input of `my_ticket`, declared inline.
 *
 * @see {@link usecase.my_ticket}
 */
export const my_ticket_input = usecase.my_ticket.input
export type my_ticket_input = z.output<typeof my_ticket_input>

/**
 * Anna opens greetings: its manifest as installed, and whether it is active, or waits for her to accept an update.
 *
 * @see {@link usecase.an_extension}
 */
export const an_extension = usecase.an_extension

/**
 * The input of `an_extension`, declared inline.
 *
 * @see {@link usecase.an_extension}
 */
export const an_extension_input = usecase.an_extension.input
export type an_extension_input = z.output<typeof an_extension_input>

/**
 * Anna's phone reads what it offers Bruno, before it asks him: greetings, at major 1.
 *
 * @see {@link usecase.the_extensions_offered_to_a_bond}
 */
export const the_extensions_offered_to_a_bond = usecase.the_extensions_offered_to_a_bond

/**
 * The input of `the_extensions_offered_to_a_bond`, declared inline.
 *
 * @see {@link usecase.the_extensions_offered_to_a_bond}
 */
export const the_extensions_offered_to_a_bond_input = usecase.the_extensions_offered_to_a_bond.input
export type the_extensions_offered_to_a_bond_input = z.output<
  typeof the_extensions_offered_to_a_bond_input
>
