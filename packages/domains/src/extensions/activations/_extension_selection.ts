// generated

// The selection predicates of `extensions/activations` from
// `extension_selection.ts` (DOM-25): the same objects under the same names,
// branded with their path (DOM-24), each schema with its output type under the
// same name, so that one import gives both. Only this module imports
// `extension_selection.ts`.

import { z } from 'zod'
import * as selection from './extension_selection.ts'

/**
 * The extension has this name.
 *
 * @see {@link selection.the_extension_has_this_name}
 */
export const the_extension_has_this_name =
  selection.the_extension_has_this_name.brand<'extensions/activations/selection/extension/the_extension_has_this_name'>()
export type the_extension_has_this_name = z.output<typeof the_extension_has_this_name>

/**
 * The extension is offered to this bond (EXT-7): active, and its offer not withdrawn from the bond.
 *
 * @see {@link selection.the_extension_is_offered_to_this_bond}
 */
export const the_extension_is_offered_to_this_bond =
  selection.the_extension_is_offered_to_this_bond.brand<'extensions/activations/selection/extension/the_extension_is_offered_to_this_bond'>()
export type the_extension_is_offered_to_this_bond = z.output<
  typeof the_extension_is_offered_to_this_bond
>

/**
 * The extension is one of these, by name: those a peer offers (EXT-8), a claim (F2).
 *
 * @see {@link selection.the_extension_is_one_of_these}
 */
export const the_extension_is_one_of_these =
  selection.the_extension_is_one_of_these.brand<'extensions/activations/selection/extension/the_extension_is_one_of_these'>()
export type the_extension_is_one_of_these = z.output<typeof the_extension_is_one_of_these>
