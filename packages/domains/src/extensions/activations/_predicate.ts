// generated

// The predicates of `extensions/activations` from `predicate.ts` (DOM-25): the
// same objects under the same names, branded with their path (DOM-24), each
// schema with its output type under the same name, so that one import gives
// both. Only this module imports `predicate.ts`.

import { z } from 'zod'
import * as predicate from './predicate.ts'

/**
 * The extension is installed on the node, with whatever manifest: the composition has it (EXT-7).
 *
 * @see {@link predicate.the_extension_is_installed}
 */
export const the_extension_is_installed =
  predicate.the_extension_is_installed.brand<'extensions/activations/predicate/the_extension_is_installed'>()
export type the_extension_is_installed = z.output<typeof the_extension_is_installed>

/**
 * The extension is installed with this manifest, the one the user is shown (EXT-7): its name, its version, all it declares.
 *
 * @see {@link predicate.the_extension_is_installed_with_this_manifest}
 */
export const the_extension_is_installed_with_this_manifest =
  predicate.the_extension_is_installed_with_this_manifest.brand<'extensions/activations/predicate/the_extension_is_installed_with_this_manifest'>()
export type the_extension_is_installed_with_this_manifest = z.output<
  typeof the_extension_is_installed_with_this_manifest
>

/**
 * The user activated the extension, whatever its manifest installed now asks, and has not deactivated it since.
 *
 * @see {@link predicate.the_extension_is_activated}
 */
export const the_extension_is_activated =
  predicate.the_extension_is_activated.brand<'extensions/activations/predicate/the_extension_is_activated'>()
export type the_extension_is_activated = z.output<typeof the_extension_is_activated>

/**
 * The user activated the extension accepting this manifest, and has not deactivated it since.
 *
 * @see {@link predicate.the_extension_is_activated_with_this_manifest}
 */
export const the_extension_is_activated_with_this_manifest =
  predicate.the_extension_is_activated_with_this_manifest.brand<'extensions/activations/predicate/the_extension_is_activated_with_this_manifest'>()
export type the_extension_is_activated_with_this_manifest = z.output<
  typeof the_extension_is_activated_with_this_manifest
>

/**
 * The bond is one of the user's, in her address book and not removed (GR-3: over the address book's state, BND-6).
 *
 * @see {@link predicate.the_bond_exists}
 */
export const the_bond_exists =
  predicate.the_bond_exists.brand<'extensions/activations/predicate/the_bond_exists'>()
export type the_bond_exists = z.output<typeof the_bond_exists>

/**
 * The user withdrew the offer of the extension from the bond, and has not offered it again since.
 *
 * @see {@link predicate.the_offer_is_withdrawn_from_the_bond}
 */
export const the_offer_is_withdrawn_from_the_bond =
  predicate.the_offer_is_withdrawn_from_the_bond.brand<'extensions/activations/predicate/the_offer_is_withdrawn_from_the_bond'>()
export type the_offer_is_withdrawn_from_the_bond = z.output<
  typeof the_offer_is_withdrawn_from_the_bond
>

/**
 * Each of these extensions is offered to the bond, with the majors its
 * installed surface on `known` speaks (EXT-8): a side tells only what it
 * offers the other.
 *
 * @see {@link predicate.these_extensions_are_offered_to_the_bond}
 */
export const these_extensions_are_offered_to_the_bond =
  predicate.these_extensions_are_offered_to_the_bond.brand<'extensions/activations/predicate/these_extensions_are_offered_to_the_bond'>()
export type these_extensions_are_offered_to_the_bond = z.output<
  typeof these_extensions_are_offered_to_the_bond
>

/**
 * A question with this identity has been asked, whatever came back.
 *
 * @see {@link predicate.a_question_has_this_id}
 */
export const a_question_has_this_id =
  predicate.a_question_has_this_id.brand<'extensions/activations/predicate/a_question_has_this_id'>()
export type a_question_has_this_id = z.output<typeof a_question_has_this_id>

/**
 * This question waits for its answer: asked, nothing came back yet.
 *
 * @see {@link predicate.the_question_waits}
 */
export const the_question_waits =
  predicate.the_question_waits.brand<'extensions/activations/predicate/the_question_waits'>()
export type the_question_waits = z.output<typeof the_question_waits>

/**
 * What came back of a question is the extensions in common (EXT-8): a
 * predicate over what the return is given, its meaning the dsl's
 * (`the_extensions_in_common_came_back`), which tells the office's two
 * happenings apart.
 *
 * @see {@link predicate.the_extensions_in_common_came_back}
 */
export const the_extensions_in_common_came_back =
  predicate.the_extensions_in_common_came_back.brand<'extensions/activations/predicate/the_extensions_in_common_came_back'>()
export type the_extensions_in_common_came_back = z.output<typeof the_extensions_in_common_came_back>
