// generated

import { z } from 'zod'
import * as fact from './fact.ts'

/**
 * Carries the change of state (DOM-5, V9): every value it writes. The
 * adapters of the domain materialize it.
 *
 * @see {@link fact.a_tool_has_been_added}
 */
export const a_tool_has_been_added = z.strictObject({
  $path: z.literal('tools/fact/a_tool_has_been_added'),
  ...fact.a_tool_has_been_added.shape,
})
export type $a_tool_has_been_added = z.output<typeof a_tool_has_been_added>
export const $a_tool_has_been_added = (
  v: /*omit the $path!*/ Omit<$a_tool_has_been_added, '$path'>,
) => a_tool_has_been_added.parse({ ...v, $path: 'tools/fact/a_tool_has_been_added' })
export const $$a_tool_has_been_added = (v: unknown) => a_tool_has_been_added.safeParse(v)
export const $$$a_tool_has_been_added = (v: unknown) => a_tool_has_been_added.parse(v)

/**
 * A partial value: the tool's id and the fields the retirement changes. Name,
 * category and add date stay as they were.
 *
 * @see {@link fact.a_tool_has_been_retired}
 */
export const a_tool_has_been_retired = z.strictObject({
  $path: z.literal('tools/fact/a_tool_has_been_retired'),
  ...fact.a_tool_has_been_retired.shape,
})
export type $a_tool_has_been_retired = z.output<typeof a_tool_has_been_retired>
export const $a_tool_has_been_retired = (
  v: /*omit the $path!*/ Omit<$a_tool_has_been_retired, '$path'>,
) => a_tool_has_been_retired.parse({ ...v, $path: 'tools/fact/a_tool_has_been_retired' })
export const $$a_tool_has_been_retired = (v: unknown) => a_tool_has_been_retired.safeParse(v)
export const $$$a_tool_has_been_retired = (v: unknown) => a_tool_has_been_retired.parse(v)

/**
 * Nothing to do (DOM-6): the first retirement stands, the state does not change.
 *
 * @see {@link fact.the_tool_was_already_retired}
 */
export const the_tool_was_already_retired = z.strictObject({
  $path: z.literal('tools/fact/the_tool_was_already_retired'),
  ...fact.the_tool_was_already_retired.shape,
})
export type $the_tool_was_already_retired = z.output<typeof the_tool_was_already_retired>
export const $the_tool_was_already_retired = (
  v: /*omit the $path!*/ Omit<$the_tool_was_already_retired, '$path'>,
) => the_tool_was_already_retired.parse({ ...v, $path: 'tools/fact/the_tool_was_already_retired' })
export const $$the_tool_was_already_retired = (v: unknown) =>
  the_tool_was_already_retired.safeParse(v)
export const $$$the_tool_was_already_retired = (v: unknown) => the_tool_was_already_retired.parse(v)
