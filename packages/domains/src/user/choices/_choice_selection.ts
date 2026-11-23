// generated

// The selection predicates of `user/choices` from `choice_selection.ts`
// (DOM-25): the same objects under the same names, branded with their path
// (DOM-24), each schema with its output type under the same name, so that one
// import gives both. Only this module imports `choice_selection.ts`.

import { z } from 'zod'
import * as selection from './choice_selection.ts'

/**
 * The choice is this one.
 *
 * @see {@link selection.the_choice_is_this_one}
 */
export const the_choice_is_this_one =
  selection.the_choice_is_this_one.brand<'user/choices/selection/choice/the_choice_is_this_one'>()
export type the_choice_is_this_one = z.output<typeof the_choice_is_this_one>
