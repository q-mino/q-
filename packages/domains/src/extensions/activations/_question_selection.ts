// generated

// The selection predicates of `extensions/activations` from
// `question_selection.ts` (DOM-25): the same objects under the same names,
// branded with their path (DOM-24), each schema with its output type under the
// same name, so that one import gives both. Only this module imports
// `question_selection.ts`.

import { z } from 'zod'
import * as selection from './question_selection.ts'

/**
 * The question was asked of this bond (EXT-8).
 *
 * @see {@link selection.the_question_was_asked_of_this_bond}
 */
export const the_question_was_asked_of_this_bond =
  selection.the_question_was_asked_of_this_bond.brand<'extensions/activations/selection/question/the_question_was_asked_of_this_bond'>()
export type the_question_was_asked_of_this_bond = z.output<
  typeof the_question_was_asked_of_this_bond
>
