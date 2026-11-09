// generated

import { z } from 'zod'
import * as predicate from './predicate.ts'

export const a_tool_has_this_id = z.strictObject({
  $path: z.literal('tools/predicate/a_tool_has_this_id'),
  ...predicate.a_tool_has_this_id.shape,
})
export type $a_tool_has_this_id = z.output<typeof a_tool_has_this_id>
export const $a_tool_has_this_id = (v: /*omit the $path!*/ Omit<$a_tool_has_this_id, '$path'>) =>
  a_tool_has_this_id.parse({ ...v, $path: 'tools/predicate/a_tool_has_this_id' })
export const $$a_tool_has_this_id = (v: unknown) => a_tool_has_this_id.safeParse(v)
export const $$$a_tool_has_this_id = (v: unknown) => a_tool_has_this_id.parse(v)

export const the_tool_is_in_service = z.strictObject({
  $path: z.literal('tools/predicate/the_tool_is_in_service'),
  ...predicate.the_tool_is_in_service.shape,
})
export type $the_tool_is_in_service = z.output<typeof the_tool_is_in_service>
export const $the_tool_is_in_service = (
  v: /*omit the $path!*/ Omit<$the_tool_is_in_service, '$path'>,
) => the_tool_is_in_service.parse({ ...v, $path: 'tools/predicate/the_tool_is_in_service' })
export const $$the_tool_is_in_service = (v: unknown) => the_tool_is_in_service.safeParse(v)
export const $$$the_tool_is_in_service = (v: unknown) => the_tool_is_in_service.parse(v)

export const the_tool_is_retired = z.strictObject({
  $path: z.literal('tools/predicate/the_tool_is_retired'),
  ...predicate.the_tool_is_retired.shape,
})
export type $the_tool_is_retired = z.output<typeof the_tool_is_retired>
export const $the_tool_is_retired = (v: /*omit the $path!*/ Omit<$the_tool_is_retired, '$path'>) =>
  the_tool_is_retired.parse({ ...v, $path: 'tools/predicate/the_tool_is_retired' })
export const $$the_tool_is_retired = (v: unknown) => the_tool_is_retired.safeParse(v)
export const $$$the_tool_is_retired = (v: unknown) => the_tool_is_retired.parse(v)
