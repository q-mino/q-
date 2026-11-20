// generated

// The commands of `extensions/activations` from `command.ts` (DOM-25): the same
// objects under the same names, each schema with its output type under the same
// name, so that one import gives both. Only this module imports `command.ts`.

import { z } from 'zod'
import * as command from './command.ts'

/**
 * The extension is installed with the manifest shown, which the user has not accepted yet.
 *
 * @see {@link command.the_manifest_shown_is_new}
 */
export const the_manifest_shown_is_new = command.the_manifest_shown_is_new
export type the_manifest_shown_is_new = z.output<typeof the_manifest_shown_is_new>

/**
 * The extension is installed with the manifest shown, and the user activated it with that manifest already.
 *
 * @see {@link command.the_manifest_shown_is_accepted_already}
 */
export const the_manifest_shown_is_accepted_already = command.the_manifest_shown_is_accepted_already
export type the_manifest_shown_is_accepted_already = z.output<
  typeof the_manifest_shown_is_accepted_already
>

/**
 * Anna activates greetings (EXT-7), the conscious act: from the
 * extension's screen, accepting what its manifest shows (what it sees, what
 * it touches, its extension points, its leaves on known faces), at its
 * version. The office records the manifest she accepted, which is the one
 * installed: one shown before an update, or not the node's, is refused. An
 * update that asks more is accepted so, and one already accepted again
 * changes nothing.
 *
 * @see {@link command.activate_an_extension}
 */
export const activate_an_extension = command.activate_an_extension

/**
 * The input of `activate_an_extension`, declared inline.
 *
 * @see {@link command.activate_an_extension}
 */
export const activate_an_extension_input = command.activate_an_extension.input
export type activate_an_extension_input = z.output<typeof activate_an_extension_input>

/**
 * The user has not activated the extension, or has deactivated it.
 *
 * @see {@link command.the_extension_is_not_activated}
 */
export const the_extension_is_not_activated = command.the_extension_is_not_activated
export type the_extension_is_not_activated = z.output<typeof the_extension_is_not_activated>

/**
 * Anna deactivates greetings (EXT-7): it runs nothing, serves nothing, its
 * leaves silent to every bond (F8), until she activates it again. One she
 * has not activated, deactivated again, changes nothing. Her offers stay as
 * she left them, for when she activates it again.
 *
 * @see {@link command.deactivate_an_extension}
 */
export const deactivate_an_extension = command.deactivate_an_extension

/**
 * The input of `deactivate_an_extension`, declared inline.
 *
 * @see {@link command.deactivate_an_extension}
 */
export const deactivate_an_extension_input = command.deactivate_an_extension.input
export type deactivate_an_extension_input = z.output<typeof deactivate_an_extension_input>

/**
 * The extension is installed, the bond is one of the user's, and the extension is offered to it: its offer not withdrawn.
 *
 * @see {@link command.the_extension_is_offered_to_the_bond}
 */
export const the_extension_is_offered_to_the_bond = command.the_extension_is_offered_to_the_bond
export type the_extension_is_offered_to_the_bond = z.output<
  typeof the_extension_is_offered_to_the_bond
>

/**
 * The extension is installed, the bond is one of the user's, and she withdrew the offer from it.
 *
 * @see {@link command.the_offer_is_withdrawn_from_the_bond}
 */
export const the_offer_is_withdrawn_from_the_bond = command.the_offer_is_withdrawn_from_the_bond
export type the_offer_is_withdrawn_from_the_bond = z.output<
  typeof the_offer_is_withdrawn_from_the_bond
>

/**
 * Anna withdraws the offer of greetings from her bond with Carla (EXT-7):
 * her node neither serves it to Carla (F8) nor asks with it on their bond,
 * and draws none of its extension points on Carla's screen; to Bruno it is
 * still offered. From a bond that is not hers (never one, or removed), or
 * of an extension the node does not have, refused. Withdrawn already, it
 * changes nothing.
 *
 * @see {@link command.withdraw_the_offer_from_a_bond}
 */
export const withdraw_the_offer_from_a_bond = command.withdraw_the_offer_from_a_bond

/**
 * The input of `withdraw_the_offer_from_a_bond`, declared inline.
 *
 * @see {@link command.withdraw_the_offer_from_a_bond}
 */
export const withdraw_the_offer_from_a_bond_input = command.withdraw_the_offer_from_a_bond.input
export type withdraw_the_offer_from_a_bond_input = z.output<
  typeof withdraw_the_offer_from_a_bond_input
>

/**
 * Anna offers greetings to Carla again (EXT-7): the offer she withdrew
 * comes back, a change, so no `again`. Offered already (every bond is, by
 * default), it changes nothing. To a bond that is not hers, or of an
 * extension the node does not have, refused.
 *
 * @see {@link command.offer_an_extension_to_a_bond}
 */
export const offer_an_extension_to_a_bond = command.offer_an_extension_to_a_bond

/**
 * The input of `offer_an_extension_to_a_bond`, declared inline.
 *
 * @see {@link command.offer_an_extension_to_a_bond}
 */
export const offer_an_extension_to_a_bond_input = command.offer_an_extension_to_a_bond.input
export type offer_an_extension_to_a_bond_input = z.output<typeof offer_an_extension_to_a_bond_input>

/**
 * The question is new, the bond is one of the user's, and the node offers it what it tells.
 *
 * @see {@link command.the_question_can_be_asked}
 */
export const the_question_can_be_asked = command.the_question_can_be_asked
export type the_question_can_be_asked = z.output<typeof the_question_can_be_asked>

/**
 * Anna's phone asks Bruno's which extensions they have in common (EXT-8):
 * on their bond, telling what it offers him (greetings, at major 1), and
 * nothing it does not (F8: each side tells only what it offers the other).
 * The question, named by the operation that asks it, waits 60 seconds for
 * what comes back. When to ask (at the introduction, on a bond's screen)
 * is `user`'s, which gives what the node offers the bond as
 * `the_extensions_offered_to_a_bond` reads it. Asked again under the same
 * operation, it is the recorded fact (DOM-11).
 *
 * @see {@link command.ask_a_bond_for_the_extensions_in_common}
 */
export const ask_a_bond_for_the_extensions_in_common =
  command.ask_a_bond_for_the_extensions_in_common

/**
 * The input of `ask_a_bond_for_the_extensions_in_common`, declared inline.
 *
 * @see {@link command.ask_a_bond_for_the_extensions_in_common}
 */
export const ask_a_bond_for_the_extensions_in_common_input =
  command.ask_a_bond_for_the_extensions_in_common.input
export type ask_a_bond_for_the_extensions_in_common_input = z.output<
  typeof ask_a_bond_for_the_extensions_in_common_input
>

/**
 * The question waits, and the extensions in common came back.
 *
 * @see {@link command.the_question_waits_and_they_came_back}
 */
export const the_question_waits_and_they_came_back = command.the_question_waits_and_they_came_back
export type the_question_waits_and_they_came_back = z.output<
  typeof the_question_waits_and_they_came_back
>

/**
 * The question waits, and no answer came back.
 *
 * @see {@link command.the_question_waits_and_no_answer_came_back}
 */
export const the_question_waits_and_no_answer_came_back =
  command.the_question_waits_and_no_answer_came_back
export type the_question_waits_and_no_answer_came_back = z.output<
  typeof the_question_waits_and_no_answer_came_back
>

/**
 * What came back of Anna's question closes it (EXT-8, DOM-13): the
 * extensions Bruno's phone offers back, with the majors it serves, learned;
 * or no answer, with why: no response in its 60 seconds, or a phone that
 * cannot answer it. The return of `ask_for_the_extensions_in_common`, its
 * input the office's closed set. A question that waits no more (closed, or
 * never asked) is refused: a dead letter of the executor, shown.
 *
 * @see {@link command.learn_the_extensions_in_common}
 */
export const learn_the_extensions_in_common = command.learn_the_extensions_in_common

/**
 * The input of `learn_the_extensions_in_common`, declared inline.
 *
 * @see {@link command.learn_the_extensions_in_common}
 */
export const learn_the_extensions_in_common_input = command.learn_the_extensions_in_common.input
export type learn_the_extensions_in_common_input = z.output<
  typeof learn_the_extensions_in_common_input
>
