// generated

// The facts of `tools`, branded with their path (DOM-24): the same objects as
// in `fact.ts`, nominal in the types. Only this module imports `fact.ts`.

import { z } from 'zod'
import * as fact from './_fact.ts'

/**
 * Carries the change of state (DOM-5, V9): every value it writes. The
 * adapters of the domain materialize it.
 *
 * @see {@link fact.a_tool_has_been_added}
 */
export const a_tool_has_been_added =
  fact.a_tool_has_been_added.brand<'tools/fact/a_tool_has_been_added'>()
export type a_tool_has_been_added = z.output<typeof a_tool_has_been_added>

/**
 * A partial value: the tool's id and the fields the retirement changes. Name,
 * category and add date stay as they were.
 *
 * @see {@link fact.a_tool_has_been_retired}
 */
export const a_tool_has_been_retired =
  fact.a_tool_has_been_retired.brand<'tools/fact/a_tool_has_been_retired'>()
export type a_tool_has_been_retired = z.output<typeof a_tool_has_been_retired>

/**
 * Nothing to do (DOM-6): the first retirement stands, the state does not change.
 *
 * @see {@link fact.the_tool_was_already_retired}
 */
export const the_tool_was_already_retired =
  fact.the_tool_was_already_retired.brand<'tools/fact/the_tool_was_already_retired'>()
export type the_tool_was_already_retired = z.output<typeof the_tool_was_already_retired>
