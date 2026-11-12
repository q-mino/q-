// generated

// The predicates of `tools`, branded with their path (DOM-24): the same
// objects as in `predicate.ts`, nominal in the types. Only this module imports
// `predicate.ts`.

import { z } from 'zod'
import * as predicate from './predicate.ts'

/**
 * @see {@link predicate.a_tool_has_this_id}
 */
export const a_tool_has_this_id =
  predicate.a_tool_has_this_id.brand<'business/tools/predicate/a_tool_has_this_id'>()
export type a_tool_has_this_id = z.output<typeof a_tool_has_this_id>

/**
 * @see {@link predicate.the_tool_is_in_service}
 */
export const the_tool_is_in_service =
  predicate.the_tool_is_in_service.brand<'business/tools/predicate/the_tool_is_in_service'>()
export type the_tool_is_in_service = z.output<typeof the_tool_is_in_service>

/**
 * @see {@link predicate.the_tool_is_retired}
 */
export const the_tool_is_retired =
  predicate.the_tool_is_retired.brand<'business/tools/predicate/the_tool_is_retired'>()
export type the_tool_is_retired = z.output<typeof the_tool_is_retired>
