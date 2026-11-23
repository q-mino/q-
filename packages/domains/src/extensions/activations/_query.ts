// generated

// The queries of `extensions/activations` from `query.ts` (DOM-25): the same
// objects under the same names, each schema with its output type under the same
// name, so that one import gives both. Only this module imports `query.ts`.

import { z } from 'zod'
import * as query from './query.ts'

/**
 * Greetings on Anna's phone (EXT-7): its manifest as installed, what she
 * is shown at its activation, and whether it is active, not active, or
 * waiting for her to accept an update that asks more, with what it asks
 * more. The kernel reads it before it routes a request to the extension,
 * loads it or serves its calls (EXT-6, EXT-15). No entry for an extension
 * the node does not have.
 *
 * @see {@link query.an_extension}
 */
export const an_extension = query.an_extension

/**
 * The input of `an_extension`, declared inline.
 *
 * @see {@link query.an_extension}
 */
export const an_extension_input = query.an_extension.input
export type an_extension_input = z.output<typeof an_extension_input>

/**
 * The extensions Anna's node offers Bruno (EXT-7), by name, with the majors
 * of their surfaces on known faces: every active one, but those whose offer
 * she withdrew from their bond. What auth's lookup tells the kernel's
 * routing (`the_extensions_offered_to_the_bond_of_a_key`, PER-9, step 13),
 * what the port of requests reads before it asks on a bond (EXT-2), and
 * what her phone tells Bruno's when it asks for the extensions in common.
 *
 * @see {@link query.the_extensions_offered_to_a_bond}
 */
export const the_extensions_offered_to_a_bond = query.the_extensions_offered_to_a_bond

/**
 * The input of `the_extensions_offered_to_a_bond`, declared inline.
 *
 * @see {@link query.the_extensions_offered_to_a_bond}
 */
export const the_extensions_offered_to_a_bond_input = query.the_extensions_offered_to_a_bond.input
export type the_extensions_offered_to_a_bond_input = z.output<
  typeof the_extensions_offered_to_a_bond_input
>

/**
 * The extension is offered to the bond, and the peer named it.
 *
 * @see {@link query.it_is_offered_back}
 */
export const it_is_offered_back = query.it_is_offered_back
export type it_is_offered_back = z.output<typeof it_is_offered_back>

/**
 * The questions Anna's phone asked Bruno's about the extensions in common
 * (EXT-8), the last first, each with what she offered him and where it
 * stands: waiting, the extensions in common learned, or no answer. What her
 * screen of the bond shows beside the question (UI-5): the last one's
 * answer, as the office keeps it.
 *
 * @see {@link query.the_questions_asked_of_a_bond}
 */
export const the_questions_asked_of_a_bond = query.the_questions_asked_of_a_bond

/**
 * The input of `the_questions_asked_of_a_bond`, declared inline.
 *
 * @see {@link query.the_questions_asked_of_a_bond}
 */
export const the_questions_asked_of_a_bond_input = query.the_questions_asked_of_a_bond.input
export type the_questions_asked_of_a_bond_input = z.output<
  typeof the_questions_asked_of_a_bond_input
>

/**
 * The extensions in common, as Bruno's node answers Anna's question (EXT-8):
 * of those her phone says it offers him (a claim, F2), the ones his node
 * offers back to their bond, with the majors it serves. Each side tells only
 * what it offers the other: one withdrawn from Anna is not named, and a
 * list that claims more learns only what a request for each would learn.
 * The bond is the one the kernel's node gives the leaf on `known` (step
 * 13), never the asker's word.
 *
 * @see {@link query.the_extensions_in_common}
 */
export const the_extensions_in_common = query.the_extensions_in_common

/**
 * The input of `the_extensions_in_common`, declared inline.
 *
 * @see {@link query.the_extensions_in_common}
 */
export const the_extensions_in_common_input = query.the_extensions_in_common.input
export type the_extensions_in_common_input = z.output<typeof the_extensions_in_common_input>
