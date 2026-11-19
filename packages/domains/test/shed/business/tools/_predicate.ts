// generated

// The predicates of `business/tools` from `predicate.ts` (DOM-25): the same
// objects under the same names, branded with their path (DOM-24), each schema
// with its output type under the same name, so that one import gives both. Only
// this module imports `predicate.ts`.

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

/**
 * @see {@link predicate.the_tool_is_under_repair}
 */
export const the_tool_is_under_repair =
  predicate.the_tool_is_under_repair.brand<'business/tools/predicate/the_tool_is_under_repair'>()
export type the_tool_is_under_repair = z.output<typeof the_tool_is_under_repair>

/**
 * The tool is in the workshop for this stay in repair, not another (SC-34):
 * Rossi's system names the stay it closes, RP1, written on its job ticket.
 *
 * @see {@link predicate.the_tool_is_under_this_repair}
 */
export const the_tool_is_under_this_repair =
  predicate.the_tool_is_under_this_repair.brand<'business/tools/predicate/the_tool_is_under_this_repair'>()
export type the_tool_is_under_this_repair = z.output<typeof the_tool_is_under_this_repair>

/**
 * A sheet of tools with this id is in the desk's hands, being loaded or loaded (SC-44).
 *
 * @see {@link predicate.a_sheet_has_this_id}
 */
export const a_sheet_has_this_id =
  predicate.a_sheet_has_this_id.brand<'business/tools/predicate/a_sheet_has_this_id'>()
export type a_sheet_has_this_id = z.output<typeof a_sheet_has_this_id>
