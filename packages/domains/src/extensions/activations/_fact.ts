// generated

// The facts of `extensions/activations` from `fact.ts` (DOM-25): the same
// objects under the same names, branded with their path (DOM-24), each schema
// with its output type under the same name, so that one import gives both. Only
// this module imports `fact.ts`.

import { z } from 'zod'
import * as fact from './fact.ts'

/**
 * An extension has been activated (EXT-7): the user's conscious act, which records the manifest she accepted, at its version.
 *
 * @see {@link fact.an_extension_has_been_activated}
 */
export const an_extension_has_been_activated =
  fact.an_extension_has_been_activated.brand<'extensions/activations/fact/an_extension_has_been_activated'>()
export type an_extension_has_been_activated = z.output<typeof an_extension_has_been_activated>

/**
 * An extension already active with this manifest has been activated again: nothing changes (DOM-6).
 *
 * @see {@link fact.an_extension_has_been_activated_again}
 */
export const an_extension_has_been_activated_again =
  fact.an_extension_has_been_activated_again.brand<'extensions/activations/fact/an_extension_has_been_activated_again'>()
export type an_extension_has_been_activated_again = z.output<
  typeof an_extension_has_been_activated_again
>

/**
 * An extension has been deactivated (EXT-7): it runs nothing, serves nothing, until the user activates it again.
 *
 * @see {@link fact.an_extension_has_been_deactivated}
 */
export const an_extension_has_been_deactivated =
  fact.an_extension_has_been_deactivated.brand<'extensions/activations/fact/an_extension_has_been_deactivated'>()
export type an_extension_has_been_deactivated = z.output<typeof an_extension_has_been_deactivated>

/**
 * An extension not activated has been deactivated again: nothing changes (DOM-6).
 *
 * @see {@link fact.an_extension_has_been_deactivated_again}
 */
export const an_extension_has_been_deactivated_again =
  fact.an_extension_has_been_deactivated_again.brand<'extensions/activations/fact/an_extension_has_been_deactivated_again'>()
export type an_extension_has_been_deactivated_again = z.output<
  typeof an_extension_has_been_deactivated_again
>

/**
 * The offer of an extension has been withdrawn from a bond (EXT-7): the node neither serves it there nor asks with it.
 *
 * @see {@link fact.the_offer_of_an_extension_has_been_withdrawn_from_a_bond}
 */
export const the_offer_of_an_extension_has_been_withdrawn_from_a_bond =
  fact.the_offer_of_an_extension_has_been_withdrawn_from_a_bond.brand<'extensions/activations/fact/the_offer_of_an_extension_has_been_withdrawn_from_a_bond'>()
export type the_offer_of_an_extension_has_been_withdrawn_from_a_bond = z.output<
  typeof the_offer_of_an_extension_has_been_withdrawn_from_a_bond
>

/**
 * The offer of an extension, withdrawn from a bond already, has been withdrawn again: nothing changes (DOM-6).
 *
 * @see {@link fact.the_offer_of_an_extension_has_been_withdrawn_from_a_bond_again}
 */
export const the_offer_of_an_extension_has_been_withdrawn_from_a_bond_again =
  fact.the_offer_of_an_extension_has_been_withdrawn_from_a_bond_again.brand<'extensions/activations/fact/the_offer_of_an_extension_has_been_withdrawn_from_a_bond_again'>()
export type the_offer_of_an_extension_has_been_withdrawn_from_a_bond_again = z.output<
  typeof the_offer_of_an_extension_has_been_withdrawn_from_a_bond_again
>

/**
 * An extension whose offer was withdrawn from a bond has been offered to it again (EXT-7): a change, so no `again`.
 *
 * @see {@link fact.an_extension_has_been_offered_to_a_bond}
 */
export const an_extension_has_been_offered_to_a_bond =
  fact.an_extension_has_been_offered_to_a_bond.brand<'extensions/activations/fact/an_extension_has_been_offered_to_a_bond'>()
export type an_extension_has_been_offered_to_a_bond = z.output<
  typeof an_extension_has_been_offered_to_a_bond
>

/**
 * An extension offered to a bond already has been offered to it again: nothing changes (DOM-6).
 *
 * @see {@link fact.an_extension_has_been_offered_to_a_bond_again}
 */
export const an_extension_has_been_offered_to_a_bond_again =
  fact.an_extension_has_been_offered_to_a_bond_again.brand<'extensions/activations/fact/an_extension_has_been_offered_to_a_bond_again'>()
export type an_extension_has_been_offered_to_a_bond_again = z.output<
  typeof an_extension_has_been_offered_to_a_bond_again
>

/**
 * A bond has been asked for the extensions in common (EXT-8): the question, with what the node offers it, waiting for what comes back.
 *
 * @see {@link fact.a_bond_has_been_asked_for_the_extensions_in_common}
 */
export const a_bond_has_been_asked_for_the_extensions_in_common =
  fact.a_bond_has_been_asked_for_the_extensions_in_common.brand<'extensions/activations/fact/a_bond_has_been_asked_for_the_extensions_in_common'>()
export type a_bond_has_been_asked_for_the_extensions_in_common = z.output<
  typeof a_bond_has_been_asked_for_the_extensions_in_common
>

/**
 * The extensions in common with a bond have been learned (EXT-8): those of the node's the peer offers back, with the majors it serves.
 *
 * @see {@link fact.the_extensions_in_common_with_a_bond_have_been_learned}
 */
export const the_extensions_in_common_with_a_bond_have_been_learned =
  fact.the_extensions_in_common_with_a_bond_have_been_learned.brand<'extensions/activations/fact/the_extensions_in_common_with_a_bond_have_been_learned'>()
export type the_extensions_in_common_with_a_bond_have_been_learned = z.output<
  typeof the_extensions_in_common_with_a_bond_have_been_learned
>

/**
 * A question about the extensions in common had no answer (EXT-8): no response in its time, or a peer that cannot answer it.
 *
 * @see {@link fact.a_question_about_the_extensions_in_common_had_no_answer}
 */
export const a_question_about_the_extensions_in_common_had_no_answer =
  fact.a_question_about_the_extensions_in_common_had_no_answer.brand<'extensions/activations/fact/a_question_about_the_extensions_in_common_had_no_answer'>()
export type a_question_about_the_extensions_in_common_had_no_answer = z.output<
  typeof a_question_about_the_extensions_in_common_had_no_answer
>
